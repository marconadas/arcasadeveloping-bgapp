#!/usr/bin/env node
/**
 * Local GFW Proxy Server
 * Run this locally or on a server to proxy GFW API requests
 */

const http = require('http');
const https = require('https');
const url = require('url');

const PORT = process.env.PORT || 8080;
const GFW_TOKEN = process.env.GFW_TOKEN || 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtpZEtleSJ9.eyJkYXRhIjp7Im5hbWUiOiJCR0FQUCIsInVzZXJJZCI6NTA0NzEsImFwcGxpY2F0aW9uTmFtZSI6IkJHQVBQIiwiaWQiOjMyNzMsInR5cGUiOiJ1c2VyLWFwcGxpY2F0aW9uIn0sImlhdCI6MTc1Nzk2MTc5MCwiZXhwIjoyMDczMzIxNzkwLCJhdWQiOiJnZnciLCJpc3MiOiJnZncifQ.exNtfPb4WFo3qp-qmCUBQUXDch5Q70Xxp4EB672VZU-YnaxlXuVXTS7mTLC798yzYmnaTPdI-UfvTl5jNNMiyP591jXUy7eYH2pZc_c4SZQIeyiMlmDuLgf30CCEcpEy3yVdVv2NJBd985U8yYfH2SWoinZxUCFhi64OuDA7GF2eq8Y5t2Pf-QzNVqA4lLxebrn8meN2gptRVKpMAL9ovLfYuJfCICkiGhboGBI4gvPnkjPpZs3J3Fpar_sDmXODiaP6Ojx5scdN8gtcexYX4TO8WjeuRt_Zv_kGXbBMyitmHzspQDPsNcVmhhZQBGH5P3E2cViKGqCPNoed8Gotr0QBrna11EI21pKuW9cixNneTLRlDY0tB-4LkTSqfmAP41KCuCKrLfOUsBO5etfv-G-y-XVhOgyrFjxrKCDh2MMIv4AkNXYi66e8_eclii8r2g8rE3gVhQn_865PwboyPqT34qBYDIxwP0SPsmrRQ6oq6Z1kVFRfDZMrqR_luQlV';

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const parsedUrl = url.parse(req.url, true);
  
  // Only proxy GFW requests
  if (!parsedUrl.pathname.startsWith('/gfw/')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }
  
  // Extract GFW path
  const gfwPath = parsedUrl.pathname.replace('/gfw/', '');
  const gfwUrl = `https://api.globalfishingwatch.org/v3/${gfwPath}${parsedUrl.search || ''}`;
  
  console.log(`Proxying request to: ${gfwUrl}`);
  
  // Make the request to GFW
  const gfwReq = https.request(gfwUrl, {
    method: req.method,
    headers: {
      'Authorization': `Bearer ${GFW_TOKEN}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'BGAPP-Proxy/1.0'
    }
  }, (gfwRes) => {
    console.log(`GFW Response: ${gfwRes.statusCode}`);
    
    // Forward status code and headers
    res.writeHead(gfwRes.statusCode, {
      'Content-Type': gfwRes.headers['content-type'] || 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    
    // Pipe the response
    gfwRes.pipe(res);
  });
  
  gfwReq.on('error', (error) => {
    console.error('GFW Request Error:', error);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Failed to connect to GFW API',
      message: error.message
    }));
  });
  
  // Handle request body if present
  if (req.method === 'POST' || req.method === 'PUT') {
    req.pipe(gfwReq);
  } else {
    gfwReq.end();
  }
});

server.listen(PORT, () => {
  console.log(`🎣 GFW Proxy Server running on http://localhost:${PORT}`);
  console.log(`Token configured: ${GFW_TOKEN ? 'Yes' : 'No'}`);
  console.log(`\nExample usage:`);
  console.log(`curl http://localhost:${PORT}/gfw/4wings/aggregate?dataset=public-global-fishing-activity:v20231026\\&start-date=2025-09-15\\&end-date=2025-09-16\\&bbox=-12,-18,17.5,-4.2\\&format=json`);
});
