#!/usr/bin/env node

/**
 * GFW Permissions Request Automation Script
 * Automates the process of requesting dataset permissions from Global Fishing Watch
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load configuration
const configPath = path.join(__dirname, '..', 'gfw-datasets-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

/**
 * Send request to Slack webhook
 */
async function sendSlackNotification(message, priority = 'normal') {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log('⚠️  SLACK_WEBHOOK_URL not configured, skipping Slack notification');
    return;
  }

  const color = priority === 'high' ? '#ff0000' : priority === 'medium' ? '#ffaa00' : '#36a64f';

  const payload = {
    username: 'GFW Permissions Bot',
    icon_emoji: ':fish:',
    attachments: [{
      color: color,
      title: 'GFW Dataset Access Request',
      text: message,
      footer: 'BGAPP Angola Project',
      ts: Math.floor(Date.now() / 1000)
    }]
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log('✅ Slack notification sent successfully');
    } else {
      console.log('❌ Failed to send Slack notification:', response.statusText);
    }
  } catch (error) {
    console.log('❌ Error sending Slack notification:', error.message);
  }
}

/**
 * Generate email template for GFW request
 */
function generateEmailTemplate() {
  const datasets = Object.entries({
    ...config.datasets_requested.essential_priority_high,
    ...config.datasets_requested.compliance_priority_high,
    ...config.datasets_requested.advanced_priority_medium
  });

  const datasetList = datasets.map(([key, dataset]) =>
    `• ${key} - ${dataset.name}\n  Purpose: ${dataset.justification}`
  ).join('\n\n');

  return `
Subject: API Dataset Access Request - BGAPP Angola Maritime Monitoring

Dear Global Fishing Watch Team,

I am writing to request access to additional datasets for our marine monitoring project in Angola.

ORGANIZATION DETAILS:
- Company: ${config.company.name}
- Contact: ${config.company.email}
- Website: ${config.company.website}
- Country: ${config.company.country}

PROJECT DETAILS:
- Project Name: ${config.project_details.name}
- Description: ${config.project_details.description}
- Purpose: ${config.project_details.purpose}
- Region: ${config.project_details.region}
- Use Case: ${config.project_details.use_case}

STAKEHOLDERS:
${config.project_details.stakeholders.map(s => `- ${s}`).join('\n')}

TECHNICAL DETAILS:
- Platform: ${config.technical_details.platform}
- Deployment: ${config.technical_details.deployment}
- API Integration: ${config.technical_details.api_proxy}
- Current Access: ${config.technical_details.current_token_scope}

REQUESTED DATASETS:

${datasetList}

JUSTIFICATION:
Our project aims to support marine conservation and sustainable fishing management in Angolan territorial waters. The requested datasets will enable us to:

1. Monitor fishing vessel activities and compliance
2. Detect potential IUU (Illegal, Unreported, Unregulated) fishing
3. Track vessel movements in marine protected areas
4. Support government decision-making for fisheries management
5. Provide data for biodiversity conservation efforts

We confirm this is for non-commercial purposes and will be used exclusively for government monitoring, conservation, and research activities in Angola.

CURRENT LIMITATIONS:
We currently have limited access to public datasets only, which restricts our ability to provide comprehensive monitoring capabilities. The requested datasets would significantly enhance our platform's effectiveness in supporting marine conservation in Angola.

We would be happy to provide additional information about our project or discuss the specific use cases for each dataset. Please let us know if you need any additional documentation or have questions about our request.

Thank you for your consideration. We look forward to your response.

Best regards,

${config.access_request.contact_person}
${config.access_request.contact_email}
${config.company.name}

--
Technical Contact: info@maredatum.pt
Project Repository: https://github.com/your-org/bgapp-angola
Live Demo: ${config.technical_details.deployment}
  `.trim();
}

/**
 * Create GitHub issue for tracking
 */
async function createTrackingIssue() {
  const title = 'GFW Dataset Access Request - Track Status';
  const body = `
# GFW Dataset Access Request Tracking

## Request Details
- **Date Submitted**: ${new Date().toISOString().split('T')[0]}
- **Status**: Pending Submission
- **Priority**: High

## Datasets Requested
${Object.entries(config.datasets_requested.essential_priority_high).map(([key, dataset]) =>
  `- [ ] ${key} - ${dataset.name}`
).join('\n')}

## Next Steps
- [ ] Submit email request to GFW
- [ ] Follow up after 1 week
- [ ] Update proxy worker when approved
- [ ] Test new dataset endpoints

## Updates
_Track progress and responses here_
  `;

  console.log('📄 GitHub Issue Template:');
  console.log('Title:', title);
  console.log('Body:', body);

  return { title, body };
}

/**
 * Update configuration with request status
 */
function updateRequestStatus(status = 'submitted') {
  config.access_request.date_submitted = new Date().toISOString();
  config.access_request.status = status;

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('✅ Configuration updated with request status');
}

/**
 * Main execution function
 */
async function main() {
  console.log('🎣 GFW Permissions Request Automation');
  console.log('=====================================\n');

  const action = process.argv[2] || 'prepare';

  switch (action) {
    case 'prepare':
      console.log('📧 Generating email template...\n');
      const emailTemplate = generateEmailTemplate();

      // Save to file
      const emailPath = path.join(__dirname, '..', 'gfw-request-email.txt');
      fs.writeFileSync(emailPath, emailTemplate);

      console.log('✅ Email template saved to:', emailPath);
      console.log('\n📋 Copy this email and send to: api@globalfishingwatch.org\n');
      console.log(emailTemplate);

      // Send Slack notification
      await sendSlackNotification(
        `🎣 GFW dataset access request prepared for ${config.project_details.name}\n\n` +
        `📧 Email template ready for manual sending\n` +
        `📊 Requesting ${Object.keys(config.datasets_requested.essential_priority_high).length +
             Object.keys(config.datasets_requested.compliance_priority_high).length +
             Object.keys(config.datasets_requested.advanced_priority_medium).length} datasets\n\n` +
        `Next step: Send email to api@globalfishingwatch.org`,
        'high'
      );
      break;

    case 'submit':
      console.log('📨 Marking request as submitted...');
      updateRequestStatus('submitted');

      await sendSlackNotification(
        `✅ GFW dataset access request submitted for ${config.project_details.name}\n\n` +
        `📅 Date: ${new Date().toLocaleDateString()}\n` +
        `⏳ Expected response: ${config.access_request.expected_response_time}\n\n` +
        `Will check status weekly and send follow-up if needed.`,
        'medium'
      );
      break;

    case 'track':
      console.log('📊 Creating tracking issue...');
      const issue = await createTrackingIssue();

      await sendSlackNotification(
        `📋 Created tracking issue for GFW permissions\n\n` +
        `Status: ${config.access_request.status}\n` +
        `Date: ${config.access_request.date_submitted || 'Not submitted'}\n\n` +
        `Use this issue to track progress and updates.`,
        'normal'
      );
      break;

    case 'status':
      console.log('📈 Current Status:');
      console.log(`- Status: ${config.access_request.status}`);
      console.log(`- Date Submitted: ${config.access_request.date_submitted || 'Not submitted'}`);
      console.log(`- Contact: ${config.access_request.contact_email}`);

      const totalDatasets = Object.keys(config.datasets_requested.essential_priority_high).length +
                           Object.keys(config.datasets_requested.compliance_priority_high).length +
                           Object.keys(config.datasets_requested.advanced_priority_medium).length;
      console.log(`- Total Datasets Requested: ${totalDatasets}`);
      break;

    default:
      console.log('Usage: node request-gfw-permissions.js [action]');
      console.log('Actions:');
      console.log('  prepare  - Generate email template (default)');
      console.log('  submit   - Mark request as submitted');
      console.log('  track    - Create tracking issue');
      console.log('  status   - Show current status');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { sendSlackNotification, generateEmailTemplate, createTrackingIssue };