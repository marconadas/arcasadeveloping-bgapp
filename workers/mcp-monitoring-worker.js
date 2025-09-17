/**
 * 🔍 MCP-Powered Monitoring Worker for Enhanced BGAPP Infrastructure
 * Leverages MCPs for intelligent monitoring, analytics, and optimization
 * Version: 1.0.0 - Production Monitoring with AI Intelligence
 */

// MCP Monitoring Configuration
const MONITORING_CONFIG = {
  intervals: {
    health_check: 5 * 60 * 1000,      // 5 minutes
    performance_check: 15 * 60 * 1000, // 15 minutes
    mcp_status_check: 2 * 60 * 1000,   // 2 minutes
    analytics_update: 30 * 60 * 1000   // 30 minutes
  },
  thresholds: {
    response_time_warning: 1000,  // 1 second
    response_time_critical: 3000, // 3 seconds
    error_rate_warning: 5,        // 5%
    error_rate_critical: 10,      // 10%
    mcp_service_timeout: 10000    // 10 seconds
  },
  endpoints_to_monitor: [
    'https://bgapp-enhanced-api-worker.majearcasa.workers.dev',
    'https://bgapp-frontend.pages.dev',
    'https://bgapp-admin.pages.dev'
  ],
  mcp_services: {
    osm: { name: 'OpenStreetMap', priority: 'high' },
    firecrawl: { name: 'Firecrawl', priority: 'medium' },
    gis: { name: 'GIS Conversion', priority: 'high' },
    igniter: { name: 'Igniter', priority: 'low' }
  }
};

// Global monitoring state
let monitoringState = {
  lastCheck: null,
  services: {},
  mcpServices: {},
  alerts: [],
  metrics: {
    uptime: {},
    performance: {},
    errors: {}
  }
};

// Enhanced CORS headers
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-monitoring-key',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
    'X-Monitoring-System': 'BGAPP-MCP-Enhanced',
    'X-Monitoring-Version': '1.0.0'
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders()
  });
}

// MCP-Enhanced Service Health Checker
async function checkServiceHealth(url) {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MONITORING_CONFIG.thresholds.mcp_service_timeout);
    
    const response = await fetch(url + '/health', {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'BGAPP-MCP-Monitor/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    const healthData = response.ok ? await response.json() : null;
    
    return {
      url,
      status: response.ok ? 'healthy' : 'unhealthy',
      response_time: responseTime,
      status_code: response.status,
      timestamp: new Date().toISOString(),
      health_data: healthData,
      mcp_enhanced: healthData?.mcp_services ? true : false
    };
    
  } catch (error) {
    return {
      url,
      status: 'error',
      response_time: Date.now() - startTime,
      error: error.message,
      timestamp: new Date().toISOString(),
      mcp_enhanced: false
    };
  }
}

// MCP Service Status Checker
async function checkMCPServiceStatus(baseUrl) {
  try {
    const response = await fetch(baseUrl + '/api/mcp/status', {
      method: 'GET',
      headers: {
        'User-Agent': 'BGAPP-MCP-Monitor/1.0'
      }
    });
    
    if (response.ok) {
      const mcpStatus = await response.json();
      return {
        available: true,
        services: mcpStatus.services || {},
        capabilities: mcpStatus.capabilities || {},
        last_check: mcpStatus.lastCheck,
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        available: false,
        error: `HTTP ${response.status}`,
        timestamp: new Date().toISOString()
      };
    }
    
  } catch (error) {
    return {
      available: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Performance Analytics with MCP Intelligence
async function analyzePerformance(serviceChecks) {
  const analytics = {
    overall_health: 'unknown',
    services_online: 0,
    services_total: serviceChecks.length,
    avg_response_time: 0,
    mcp_services_active: 0,
    performance_score: 0,
    recommendations: []
  };
  
  let totalResponseTime = 0;
  let healthyServices = 0;
  let mcpEnabledServices = 0;
  
  for (const check of serviceChecks) {
    if (check.status === 'healthy') {
      healthyServices++;
      totalResponseTime += check.response_time;
      
      if (check.mcp_enhanced) {
        mcpEnabledServices++;
      }
    }
  }
  
  analytics.services_online = healthyServices;
  analytics.avg_response_time = healthyServices > 0 ? Math.round(totalResponseTime / healthyServices) : 0;
  analytics.mcp_services_active = mcpEnabledServices;
  
  // Calculate health status
  const healthPercentage = (healthyServices / analytics.services_total) * 100;
  if (healthPercentage >= 95) {
    analytics.overall_health = 'excellent';
  } else if (healthPercentage >= 80) {
    analytics.overall_health = 'good';
  } else if (healthPercentage >= 60) {
    analytics.overall_health = 'warning';
  } else {
    analytics.overall_health = 'critical';
  }
  
  // Calculate performance score (0-100)
  let performanceScore = healthPercentage;
  
  // Adjust score based on response times
  if (analytics.avg_response_time < 500) {
    performanceScore += 5;
  } else if (analytics.avg_response_time > 2000) {
    performanceScore -= 10;
  }
  
  // Adjust score based on MCP integration
  const mcpIntegrationScore = (mcpEnabledServices / analytics.services_total) * 10;
  performanceScore += mcpIntegrationScore;
  
  analytics.performance_score = Math.min(100, Math.max(0, Math.round(performanceScore)));
  
  // Generate recommendations using MCP intelligence
  analytics.recommendations = generateRecommendations(analytics, serviceChecks);
  
  return analytics;
}

// MCP-Powered Recommendations Engine
function generateRecommendations(analytics, serviceChecks) {
  const recommendations = [];
  
  // Performance recommendations
  if (analytics.avg_response_time > MONITORING_CONFIG.thresholds.response_time_warning) {
    recommendations.push({
      type: 'performance',
      priority: 'high',
      message: `Average response time (${analytics.avg_response_time}ms) exceeds threshold`,
      action: 'Consider enabling more aggressive caching or optimizing worker code'
    });
  }
  
  // MCP integration recommendations
  if (analytics.mcp_services_active < analytics.services_total) {
    recommendations.push({
      type: 'enhancement',
      priority: 'medium',
      message: `${analytics.services_total - analytics.mcp_services_active} services not MCP-enhanced`,
      action: 'Consider upgrading remaining services to use MCP integrations'
    });
  }
  
  // Health recommendations
  if (analytics.services_online < analytics.services_total) {
    const offlineServices = analytics.services_total - analytics.services_online;
    recommendations.push({
      type: 'reliability',
      priority: 'high',
      message: `${offlineServices} service(s) offline`,
      action: 'Investigate and restore offline services immediately'
    });
  }
  
  // Optimization recommendations
  if (analytics.performance_score < 80) {
    recommendations.push({
      type: 'optimization',
      priority: 'medium',
      message: `Performance score (${analytics.performance_score}) below optimal`,
      action: 'Review system configuration and consider performance optimizations'
    });
  }
  
  return recommendations;
}

// Alert Management System
function generateAlerts(analytics, serviceChecks) {
  const alerts = [];
  const currentTime = new Date().toISOString();
  
  // Critical service failures
  for (const check of serviceChecks) {
    if (check.status === 'error' || check.status === 'unhealthy') {
      alerts.push({
        id: `service_${check.url.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`,
        type: 'critical',
        service: check.url,
        message: `Service ${check.url} is ${check.status}`,
        details: check.error || `HTTP ${check.status_code}`,
        timestamp: currentTime,
        resolved: false
      });
    }
  }
  
  // Performance alerts
  if (analytics.avg_response_time > MONITORING_CONFIG.thresholds.response_time_critical) {
    alerts.push({
      id: `performance_critical_${Date.now()}`,
      type: 'critical',
      service: 'system',
      message: `Critical response time: ${analytics.avg_response_time}ms`,
      details: `Exceeds critical threshold of ${MONITORING_CONFIG.thresholds.response_time_critical}ms`,
      timestamp: currentTime,
      resolved: false
    });
  } else if (analytics.avg_response_time > MONITORING_CONFIG.thresholds.response_time_warning) {
    alerts.push({
      id: `performance_warning_${Date.now()}`,
      type: 'warning',
      service: 'system',
      message: `High response time: ${analytics.avg_response_time}ms`,
      details: `Exceeds warning threshold of ${MONITORING_CONFIG.thresholds.response_time_warning}ms`,
      timestamp: currentTime,
      resolved: false
    });
  }
  
  // Health alerts
  if (analytics.overall_health === 'critical') {
    alerts.push({
      id: `health_critical_${Date.now()}`,
      type: 'critical',
      service: 'system',
      message: 'System health critical',
      details: `Only ${analytics.services_online}/${analytics.services_total} services online`,
      timestamp: currentTime,
      resolved: false
    });
  }
  
  return alerts;
}

// Comprehensive Monitoring Check
async function performMonitoringCheck() {
  console.log('🔍 Starting comprehensive monitoring check...');
  
  const startTime = Date.now();
  
  // Check all configured endpoints
  const serviceChecks = await Promise.all(
    MONITORING_CONFIG.endpoints_to_monitor.map(url => checkServiceHealth(url))
  );
  
  // Check MCP service status for enhanced endpoints
  const mcpChecks = {};
  for (const url of MONITORING_CONFIG.endpoints_to_monitor) {
    mcpChecks[url] = await checkMCPServiceStatus(url);
  }
  
  // Analyze performance
  const analytics = await analyzePerformance(serviceChecks);
  
  // Generate alerts
  const alerts = generateAlerts(analytics, serviceChecks);
  
  // Update monitoring state
  monitoringState = {
    lastCheck: new Date().toISOString(),
    services: serviceChecks.reduce((acc, check) => {
      acc[check.url] = check;
      return acc;
    }, {}),
    mcpServices: mcpChecks,
    alerts: alerts,
    metrics: {
      uptime: analytics,
      performance: {
        avg_response_time: analytics.avg_response_time,
        performance_score: analytics.performance_score,
        mcp_integration_rate: (analytics.mcp_services_active / analytics.services_total) * 100
      },
      errors: alerts.filter(alert => alert.type === 'critical').length
    },
    check_duration_ms: Date.now() - startTime
  };
  
  console.log(`✅ Monitoring check completed in ${monitoringState.check_duration_ms}ms`);
  console.log(`📊 Health: ${analytics.overall_health}, Score: ${analytics.performance_score}`);
  console.log(`🚨 Alerts: ${alerts.length} (${alerts.filter(a => a.type === 'critical').length} critical)`);
  
  return monitoringState;
}

// MCP-Enhanced Reporting
async function generateMonitoringReport() {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      system_status: monitoringState.metrics?.uptime?.overall_health || 'unknown',
      services_monitored: MONITORING_CONFIG.endpoints_to_monitor.length,
      services_online: monitoringState.metrics?.uptime?.services_online || 0,
      performance_score: monitoringState.metrics?.performance?.performance_score || 0,
      active_alerts: monitoringState.alerts?.length || 0,
      mcp_integration_rate: monitoringState.metrics?.performance?.mcp_integration_rate || 0
    },
    services: monitoringState.services || {},
    mcp_services: monitoringState.mcpServices || {},
    alerts: monitoringState.alerts || [],
    recommendations: monitoringState.metrics?.uptime?.recommendations || [],
    last_check: monitoringState.lastCheck,
    next_check: new Date(Date.now() + MONITORING_CONFIG.intervals.health_check).toISOString()
  };
  
  return report;
}

// Worker Event Handler
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }
    
    try {
      // Health check for the monitoring system itself
      if (path === '/health') {
        return jsonResponse({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          monitoring_system: 'mcp-enhanced',
          last_monitoring_check: monitoringState.lastCheck,
          services_monitored: MONITORING_CONFIG.endpoints_to_monitor.length
        });
      }
      
      // Trigger manual monitoring check
      if (path === '/check') {
        const result = await performMonitoringCheck();
        return jsonResponse({
          message: 'Monitoring check completed',
          result: result,
          duration_ms: result.check_duration_ms
        });
      }
      
      // Get current monitoring status
      if (path === '/status') {
        if (!monitoringState.lastCheck) {
          // Do first check if none exists
          await performMonitoringCheck();
        }
        
        return jsonResponse(monitoringState);
      }
      
      // Get monitoring report
      if (path === '/report') {
        const report = await generateMonitoringReport();
        return jsonResponse(report);
      }
      
      // Get alerts only
      if (path === '/alerts') {
        return jsonResponse({
          alerts: monitoringState.alerts || [],
          count: monitoringState.alerts?.length || 0,
          critical_count: monitoringState.alerts?.filter(a => a.type === 'critical').length || 0,
          timestamp: new Date().toISOString()
        });
      }
      
      // Get metrics only
      if (path === '/metrics') {
        return jsonResponse({
          metrics: monitoringState.metrics || {},
          timestamp: new Date().toISOString(),
          last_check: monitoringState.lastCheck
        });
      }
      
      // MCP services status
      if (path === '/mcp-status') {
        return jsonResponse({
          mcp_services: monitoringState.mcpServices || {},
          timestamp: new Date().toISOString(),
          last_check: monitoringState.lastCheck
        });
      }
      
      // Configuration endpoint
      if (path === '/config') {
        return jsonResponse({
          config: MONITORING_CONFIG,
          version: '1.0.0',
          timestamp: new Date().toISOString()
        });
      }
      
      // 404 for unknown paths
      return jsonResponse({
        error: 'Endpoint not found',
        path,
        available_endpoints: [
          '/health',
          '/check',
          '/status', 
          '/report',
          '/alerts',
          '/metrics',
          '/mcp-status',
          '/config'
        ]
      }, 404);
      
    } catch (error) {
      console.error('Monitoring worker error:', error);
      return jsonResponse({
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      }, 500);
    }
  },
  
  // Scheduled event handler for automatic monitoring
  async scheduled(controller, env, ctx) {
    console.log('🕐 Scheduled monitoring check triggered');
    
    try {
      await performMonitoringCheck();
      console.log('✅ Scheduled monitoring check completed');
    } catch (error) {
      console.error('❌ Scheduled monitoring check failed:', error);
    }
  }
};
