/**
 * GFW Webhook Worker - Handles notifications about dataset approvals
 * This worker receives webhooks from GFW when dataset access is approved
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Webhook-Signature',
      'Access-Control-Max-Age': '86400',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      switch (url.pathname) {
        case '/webhook/gfw/approval':
          return await handleGFWApproval(request, env);

        case '/webhook/gfw/status':
          return await handleStatusUpdate(request, env);

        case '/api/permissions/status':
          return await getPermissionsStatus(request, env);

        case '/api/permissions/test':
          return await testDatasetAccess(request, env);

        default:
          return new Response(JSON.stringify({ error: 'Not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
      }
    } catch (error) {
      console.error('Webhook error:', error);
      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

/**
 * Handle GFW dataset approval notifications
 */
async function handleGFWApproval(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const payload = await request.json();
  console.log('GFW Approval webhook received:', payload);

  // Verify webhook signature if available
  const signature = request.headers.get('X-Webhook-Signature');
  if (env.GFW_WEBHOOK_SECRET && signature) {
    const isValid = await verifyWebhookSignature(
      JSON.stringify(payload),
      signature,
      env.GFW_WEBHOOK_SECRET
    );

    if (!isValid) {
      return new Response('Invalid signature', { status: 401 });
    }
  }

  // Process approval
  const result = await processDatasetApproval(payload, env);

  // Send Slack notification
  await sendSlackNotification(env, {
    type: 'approval',
    dataset: payload.dataset || 'Unknown',
    status: payload.status || 'approved',
    message: `🎉 GFW Dataset Access Approved: ${payload.dataset || 'Unknown dataset'}`
  });

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Handle status updates from GFW
 */
async function handleStatusUpdate(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const payload = await request.json();
  console.log('GFW Status update received:', payload);

  // Update stored status
  await updateDatasetStatus(payload, env);

  // Send notification if significant change
  if (payload.status === 'approved' || payload.status === 'rejected') {
    await sendSlackNotification(env, {
      type: 'status_update',
      dataset: payload.dataset,
      status: payload.status,
      message: `📊 Dataset ${payload.dataset}: ${payload.status}`
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Get current permissions status
 */
async function getPermissionsStatus(request, env) {
  try {
    // Get stored status from KV or return default
    const storedStatus = await env.GFW_PERMISSIONS?.get('status');
    const status = storedStatus ? JSON.parse(storedStatus) : getDefaultStatus();

    // Test current access for each dataset
    const testResults = await testAllDatasets(env);

    // Merge stored status with live test results
    const currentStatus = {
      ...status,
      last_checked: new Date().toISOString(),
      live_test_results: testResults,
      overall_status: calculateOverallStatus(testResults)
    };

    return new Response(JSON.stringify(currentStatus), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error getting permissions status:', error);
    return new Response(JSON.stringify({
      error: 'Failed to get status',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Test dataset access by making actual API calls
 */
async function testDatasetAccess(request, env) {
  const testResults = await testAllDatasets(env);

  return new Response(JSON.stringify({
    timestamp: new Date().toISOString(),
    results: testResults,
    summary: {
      total: Object.keys(testResults).length,
      accessible: Object.values(testResults).filter(r => r.accessible).length,
      failed: Object.values(testResults).filter(r => !r.accessible).length
    }
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Process dataset approval and update configuration
 */
async function processDatasetApproval(payload, env) {
  const { dataset, status, approved_at, access_level } = payload;

  // Update stored permissions
  const currentStatus = await getStoredStatus(env);
  currentStatus.datasets = currentStatus.datasets || {};

  currentStatus.datasets[dataset] = {
    status: status,
    approved_at: approved_at || new Date().toISOString(),
    access_level: access_level || 'full',
    last_updated: new Date().toISOString()
  };

  // Save updated status
  await env.GFW_PERMISSIONS?.put('status', JSON.stringify(currentStatus));

  // Update proxy worker configuration if needed
  if (status === 'approved') {
    await updateProxyWorkerConfig(dataset, env);
  }

  return {
    success: true,
    dataset: dataset,
    status: status,
    message: `Dataset ${dataset} access ${status}`
  };
}

/**
 * Update dataset status in storage
 */
async function updateDatasetStatus(payload, env) {
  const currentStatus = await getStoredStatus(env);
  const { dataset, status, message, updated_at } = payload;

  currentStatus.datasets = currentStatus.datasets || {};
  currentStatus.datasets[dataset] = {
    ...currentStatus.datasets[dataset],
    status: status,
    message: message,
    last_updated: updated_at || new Date().toISOString()
  };

  await env.GFW_PERMISSIONS?.put('status', JSON.stringify(currentStatus));
}

/**
 * Test access to all configured datasets
 */
async function testAllDatasets(env) {
  const testDatasets = [
    'public-global-vessels:v3.0',
    'public-global-vessel-identity:v3.0',
    'public-global-fishing-effort:v3.0',
    'public-global-carrier-vessels:v3.0',
    'public-global-transshipment:v3.0'
  ];

  const results = {};
  const token = env.GFW_API_TOKEN;

  for (const dataset of testDatasets) {
    try {
      const response = await fetch(
        `https://gateway.api.globalfishingwatch.org/v3/vessels/search?datasets=${dataset}&limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      results[dataset] = {
        accessible: response.ok,
        status_code: response.status,
        error: response.ok ? null : await response.text(),
        tested_at: new Date().toISOString()
      };
    } catch (error) {
      results[dataset] = {
        accessible: false,
        status_code: null,
        error: error.message,
        tested_at: new Date().toISOString()
      };
    }
  }

  return results;
}

/**
 * Send Slack notification
 */
async function sendSlackNotification(env, { type, dataset, status, message }) {
  const webhookUrl = env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const color = status === 'approved' ? '#36a64f' :
                status === 'rejected' ? '#ff0000' : '#ffaa00';

  const payload = {
    username: 'GFW Permissions Bot',
    icon_emoji: ':fish:',
    attachments: [{
      color: color,
      title: `GFW ${type.replace('_', ' ').toUpperCase()}`,
      text: message,
      fields: [
        {
          title: 'Dataset',
          value: dataset || 'N/A',
          short: true
        },
        {
          title: 'Status',
          value: status || 'unknown',
          short: true
        }
      ],
      footer: 'BGAPP Angola Project',
      ts: Math.floor(Date.now() / 1000)
    }]
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
  }
}

/**
 * Verify webhook signature
 */
async function verifyWebhookSignature(payload, signature, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return signature === `sha256=${expectedSignature}`;
}

/**
 * Get stored status or default
 */
async function getStoredStatus(env) {
  try {
    const stored = await env.GFW_PERMISSIONS?.get('status');
    return stored ? JSON.parse(stored) : getDefaultStatus();
  } catch (error) {
    return getDefaultStatus();
  }
}

/**
 * Get default status structure
 */
function getDefaultStatus() {
  return {
    request_submitted: false,
    submission_date: null,
    last_updated: new Date().toISOString(),
    datasets: {},
    contact_email: 'info@maredatum.pt',
    project: 'BGAPP Angola'
  };
}

/**
 * Calculate overall status from test results
 */
function calculateOverallStatus(testResults) {
  const total = Object.keys(testResults).length;
  const accessible = Object.values(testResults).filter(r => r.accessible).length;

  if (accessible === 0) return 'no_access';
  if (accessible === total) return 'full_access';
  return 'partial_access';
}

/**
 * Update proxy worker configuration when new dataset is approved
 */
async function updateProxyWorkerConfig(dataset, env) {
  // This would trigger a deployment or configuration update
  // For now, just log the approval
  console.log(`Dataset ${dataset} approved - proxy worker should be updated`);

  // In a real implementation, this could:
  // 1. Update a configuration file in GitHub
  // 2. Trigger a new deployment
  // 3. Update environment variables
  // 4. Send a webhook to CI/CD system
}