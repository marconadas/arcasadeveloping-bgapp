import {
	WorkflowEntrypoint,
	WorkflowEvent,
	WorkflowStep,
} from "cloudflare:workers";

/**
 * BGAPP Cloudflare Workflow - Sistema de Gestão de Infraestrutura
 * 
 * Este workflow gerencia e monitora os serviços da infraestrutura BGAPP:
 * - Frontend Principal (8085)
 * - Admin Dashboard (3000) 
 * - API Admin (8000)
 * - PostgreSQL (5432)
 * - MinIO (9000/9001)
 * - Redis (6379)
 * - STAC API (8081)
 * - PyGeoAPI (5080)
 * - STAC Browser (8082)
 * - Keycloak (8083)
 * - Flower (Celery) (5555)
 *
 * - Run `npm run dev` para iniciar servidor de desenvolvimento
 * - Run `npm run deploy` para fazer deploy usando wrangler
 *
 * Learn more at https://developers.cloudflare.com/workflows
 */
 
// Parâmetros do workflow para monitoramento de serviços BGAPP
type BGAPPServiceParams = {
	serviceName: string;
	serviceUrl: string;
	servicePort: number;
	healthCheckEndpoint?: string;
	timeout?: number;
	metadata?: Record<string, string>;
};

// Estrutura de resposta do health check
type ServiceHealthStatus = {
	serviceName: string;
	status: 'healthy' | 'unhealthy' | 'unknown';
	responseTime: number;
	lastChecked: string;
	error?: string;
	details?: any;
};

export class BGAPPInfrastructureWorkflow extends WorkflowEntrypoint<Env, BGAPPServiceParams> {
	async run(event: WorkflowEvent<BGAPPServiceParams>, step: WorkflowStep) {
		// Configuração dos serviços BGAPP - URLs públicas para acesso dos clientes
		const bgappServices = await step.do("configure-bgapp-services", async () => {
			// Detectar se estamos em ambiente de desenvolvimento ou produção
			const isProduction = !event.payload?.metadata?.isDevelopment;
			const baseUrl = isProduction ? "https://bgapp.majearcasa.workers.dev" : "http://localhost";
			
			return [
				{
					serviceName: "Frontend Principal",
					serviceUrl: isProduction ? "https://bgapp-frontend.majearcasa.workers.dev" : "http://localhost:8085",
					servicePort: 8085,
					healthCheckEndpoint: "/health",
					timeout: 5000,
					metadata: { type: "frontend", priority: "high", environment: isProduction ? "production" : "development" }
				},
				{
					serviceName: "Admin Dashboard",
					serviceUrl: isProduction ? "https://bgapp-admin.majearcasa.workers.dev" : "http://localhost:3000",
					servicePort: 3000,
					healthCheckEndpoint: "/api/health",
					timeout: 5000,
					metadata: { type: "admin", priority: "high", environment: isProduction ? "production" : "development" }
				},
				{
					serviceName: "API Admin",
					serviceUrl: isProduction ? "https://bgapp-api.majearcasa.workers.dev" : "http://localhost:8000",
					servicePort: 8000,
					healthCheckEndpoint: "/docs",
					timeout: 10000,
					metadata: { type: "api", priority: "critical", environment: isProduction ? "production" : "development" }
				},
				{
					serviceName: "STAC API",
					serviceUrl: isProduction ? "https://bgapp-stac.majearcasa.workers.dev" : "http://localhost:8081",
					servicePort: 8081,
					healthCheckEndpoint: "/",
					timeout: 5000,
					metadata: { type: "geospatial", priority: "high", environment: isProduction ? "production" : "development" }
				},
				{
					serviceName: "PyGeoAPI",
					serviceUrl: isProduction ? "https://bgapp-geoapi.majearcasa.workers.dev" : "http://localhost:5080",
					servicePort: 5080,
					healthCheckEndpoint: "/",
					timeout: 5000,
					metadata: { type: "geospatial", priority: "medium", environment: isProduction ? "production" : "development" }
				},
				{
					serviceName: "STAC Browser",
					serviceUrl: isProduction ? "https://bgapp-browser.majearcasa.workers.dev" : "http://localhost:8082",
					servicePort: 8082,
					healthCheckEndpoint: "/",
					timeout: 5000,
					metadata: { type: "browser", priority: "medium", environment: isProduction ? "production" : "development" }
				},
				{
					serviceName: "Keycloak",
					serviceUrl: isProduction ? "https://bgapp-auth.majearcasa.workers.dev" : "http://localhost:8083",
					servicePort: 8083,
					healthCheckEndpoint: "/auth/realms/master",
					timeout: 10000,
					metadata: { type: "auth", priority: "critical", environment: isProduction ? "production" : "development" }
				},
				{
					serviceName: "Flower (Celery)",
					serviceUrl: isProduction ? "https://bgapp-monitor.majearcasa.workers.dev" : "http://localhost:5555",
					servicePort: 5555,
					healthCheckEndpoint: "/",
					timeout: 5000,
					metadata: { type: "monitoring", priority: "low", environment: isProduction ? "production" : "development" }
				}
			];
		});

		// Health check de todos os serviços
		const healthChecks = await step.do("perform-health-checks", async () => {
			const results: ServiceHealthStatus[] = [];
			
			for (const service of bgappServices) {
				try {
					const startTime = Date.now();
					const controller = new AbortController();
					const timeoutId = setTimeout(() => controller.abort(), service.timeout || 5000);
					
					const response = await fetch(
						`${service.serviceUrl}${service.healthCheckEndpoint || '/'}`,
						{
							signal: controller.signal,
							method: 'GET',
							headers: {
								'User-Agent': 'BGAPP-HealthCheck/1.0'
							}
						}
					);
					
					clearTimeout(timeoutId);
					const responseTime = Date.now() - startTime;
					
					results.push({
						serviceName: service.serviceName,
						status: response.ok ? 'healthy' : 'unhealthy',
						responseTime,
						lastChecked: new Date().toISOString(),
						details: {
							statusCode: response.status,
							url: service.serviceUrl,
							port: service.servicePort
						}
					});
				} catch (error) {
					results.push({
						serviceName: service.serviceName,
						status: 'unhealthy',
						responseTime: 0,
						lastChecked: new Date().toISOString(),
						error: error instanceof Error ? error.message : 'Unknown error',
						details: {
							url: service.serviceUrl,
							port: service.servicePort
						}
					});
				}
			}
			
			return results;
		});

		// Análise de status e alertas
		const statusAnalysis = await step.do("analyze-service-status", async () => {
			const healthyServices = healthChecks.filter(s => s.status === 'healthy');
			const unhealthyServices = healthChecks.filter(s => s.status === 'unhealthy');
			const criticalServices = bgappServices.filter(s => s.metadata?.priority === 'critical');
			const criticalUnhealthy = unhealthyServices.filter(s => 
				criticalServices.some(cs => cs.serviceName === s.serviceName)
			);

			return {
				totalServices: healthChecks.length,
				healthyCount: healthyServices.length,
				unhealthyCount: unhealthyServices.length,
				criticalUnhealthyCount: criticalUnhealthy.length,
				overallStatus: criticalUnhealthy.length > 0 ? 'CRITICAL' : 
							  unhealthyServices.length > 0 ? 'WARNING' : 'HEALTHY',
				unhealthyServices: unhealthyServices.map(s => ({
					name: s.serviceName,
					error: s.error,
					responseTime: s.responseTime
				})),
				criticalUnhealthyServices: criticalUnhealthy.map(s => ({
					name: s.serviceName,
					error: s.error,
					responseTime: s.responseTime
				}))
			};
		});

		// Se houver serviços críticos com problemas, aguardar aprovação para ação
		if (statusAnalysis.criticalUnhealthyCount > 0) {
			await step.waitForEvent("critical-service-alert", {
				type: "critical-alert",
				timeout: "5 minutes",
			});
		}

		// Log de resultados e notificações
		await step.do("log-and-notify", async () => {
			const logEntry = {
				timestamp: new Date().toISOString(),
				workflowId: event.instanceId,
				status: statusAnalysis.overallStatus,
				summary: statusAnalysis,
				healthChecks: healthChecks
			};

			// Aqui você pode integrar com sistemas de logging como:
			// - Cloudflare Analytics
			// - Webhooks para Slack/Discord
			// - Email notifications
			// - Database logging
			
			console.log('BGAPP Infrastructure Health Check Results:', JSON.stringify(logEntry, null, 2));
			
			return logEntry;
		});

		// Retry automático para serviços com falha (com backoff exponencial)
		if (statusAnalysis.unhealthyCount > 0) {
			await step.do(
				"retry-failed-services",
				{
					retries: {
						limit: 3,
						delay: "30 seconds",
						backoff: "exponential",
					},
					timeout: "10 minutes",
				},
				async () => {
					// Implementar lógica de retry específica para cada serviço
					// Por exemplo, reiniciar containers, verificar dependências, etc.
					console.log(`Retrying ${statusAnalysis.unhealthyCount} failed services...`);
					
					// Simular retry logic
					for (const service of statusAnalysis.unhealthyServices) {
						console.log(`Retrying service: ${service.name}`);
						// Aqui você implementaria a lógica específica de retry
						// para cada tipo de serviço
					}
				}
			);
		}

		return {
			workflowId: event.instanceId,
			executionTime: new Date().toISOString(),
			status: statusAnalysis.overallStatus,
			servicesChecked: healthChecks.length,
			healthyServices: statusAnalysis.healthyCount,
			unhealthyServices: statusAnalysis.unhealthyCount,
			criticalIssues: statusAnalysis.criticalUnhealthyCount,
			details: healthChecks
		};
	}
}
export default {
	async fetch(req: Request, env: Env): Promise<Response> {
		let url = new URL(req.url);
		const path = url.pathname;

		// CORS headers para permitir acesso do frontend BGAPP
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		};

		// Handle CORS preflight
		if (req.method === 'OPTIONS') {
			return new Response(null, { status: 204, headers: corsHeaders });
		}

		if (path.startsWith("/favicon")) {
			return Response.json({}, { status: 404 });
		}

		// Endpoint para obter status de uma instância específica
		// GET /status?instanceId=<id>
		if (path === "/status") {
			let id = url.searchParams.get("instanceId");
			if (id) {
				try {
					let instance = await env.MY_WORKFLOW.get(id);
					const status = await instance.status();
					return Response.json({
						success: true,
						instanceId: id,
						status: status,
						timestamp: new Date().toISOString()
					}, { headers: corsHeaders });
				} catch (error) {
					return Response.json({
						success: false,
						error: "Instance not found",
						instanceId: id
					}, { status: 404, headers: corsHeaders });
				}
			}
			return Response.json({
				success: false,
				error: "instanceId parameter required"
			}, { status: 400, headers: corsHeaders });
		}

		// Endpoint para iniciar health check de todos os serviços BGAPP
		// GET /health-check ou POST /health-check
		if (path === "/health-check") {
			try {
				// Criar nova instância do workflow com parâmetros específicos
				let instance = await env.MY_WORKFLOW.create({
					params: {
						serviceName: "BGAPP-Infrastructure",
						serviceUrl: "http://localhost",
						servicePort: 0,
						metadata: {
							triggeredBy: "manual-request",
							userAgent: req.headers.get("User-Agent") || "unknown",
							requestTime: new Date().toISOString()
						}
					}
				});

				return Response.json({
					success: true,
					message: "BGAPP Infrastructure Health Check iniciado",
					instanceId: instance.id,
					status: await instance.status(),
					timestamp: new Date().toISOString(),
					services: [
						"Frontend Principal (8085)",
						"Admin Dashboard (3000)",
						"API Admin (8000)",
						"STAC API (8081)",
						"PyGeoAPI (5080)",
						"STAC Browser (8082)",
						"Keycloak (8083)",
						"Flower (Celery) (5555)"
					]
				}, { headers: corsHeaders });
			} catch (error) {
				return Response.json({
					success: false,
					error: "Failed to start health check",
					details: error instanceof Error ? error.message : "Unknown error"
				}, { status: 500, headers: corsHeaders });
			}
		}

		// Endpoint para obter informações sobre os serviços BGAPP
		// GET /services
		if (path === "/services") {
			// Detectar ambiente baseado no parâmetro ou header
			const isDevelopment = url.searchParams.get("env") === "dev" || 
								 req.headers.get("x-environment") === "development";
			
			return Response.json({
				success: true,
				message: "BGAPP Services Information",
				environment: isDevelopment ? "development" : "production",
				services: [
					{
						name: "Frontend Principal",
						port: 8085,
						url: isDevelopment ? "http://localhost:8085" : "https://bgapp-frontend.majearcasa.workers.dev",
						type: "frontend",
						priority: "high",
						description: "Interface principal da aplicação BGAPP",
						status: "available",
						clientAccess: true
					},
					{
						name: "Admin Dashboard",
						port: 3000,
						url: isDevelopment ? "http://localhost:3000" : "https://bgapp-admin.majearcasa.workers.dev",
						type: "admin",
						priority: "high",
						description: "Painel administrativo do sistema",
						status: "available",
						clientAccess: true
					},
					{
						name: "API Admin",
						port: 8000,
						url: isDevelopment ? "http://localhost:8000/docs" : "https://bgapp-api.majearcasa.workers.dev/docs",
						type: "api",
						priority: "critical",
						description: "API administrativa com documentação Swagger",
						status: "available",
						clientAccess: true
					},
					{
						name: "PostgreSQL",
						port: 5432,
						url: isDevelopment ? "localhost:5432" : "bgapp-db.majearcasa.workers.dev:5432",
						type: "database",
						priority: "critical",
						description: "Base de dados principal",
						status: "internal",
						clientAccess: false
					},
					{
						name: "MinIO",
						port: "9000/9001",
						url: isDevelopment ? "http://localhost:9001" : "https://bgapp-storage.majearcasa.workers.dev",
						type: "storage",
						priority: "high",
						description: "Sistema de armazenamento de objetos",
						status: "available",
						clientAccess: true
					},
					{
						name: "Redis",
						port: 6379,
						url: isDevelopment ? "localhost:6379" : "bgapp-cache.majearcasa.workers.dev:6379",
						type: "cache",
						priority: "high",
						description: "Sistema de cache e sessões",
						status: "internal",
						clientAccess: false
					},
					{
						name: "STAC API",
						port: 8081,
						url: isDevelopment ? "http://localhost:8081" : "https://bgapp-stac.majearcasa.workers.dev",
						type: "geospatial",
						priority: "high",
						description: "API para dados geoespaciais STAC",
						status: "available",
						clientAccess: true
					},
					{
						name: "PyGeoAPI",
						port: 5080,
						url: isDevelopment ? "http://localhost:5080" : "https://bgapp-geoapi.majearcasa.workers.dev",
						type: "geospatial",
						priority: "medium",
						description: "API geoespacial Python",
						status: "available",
						clientAccess: true
					},
					{
						name: "STAC Browser",
						port: 8082,
						url: isDevelopment ? "http://localhost:8082" : "https://bgapp-browser.majearcasa.workers.dev",
						type: "browser",
						priority: "medium",
						description: "Navegador de dados STAC",
						status: "available",
						clientAccess: true
					},
					{
						name: "Keycloak",
						port: 8083,
						url: isDevelopment ? "http://localhost:8083" : "https://bgapp-auth.majearcasa.workers.dev",
						type: "auth",
						priority: "critical",
						description: "Sistema de autenticação e autorização",
						status: "available",
						clientAccess: true
					},
					{
						name: "Flower (Celery)",
						port: 5555,
						url: isDevelopment ? "http://localhost:5555" : "https://bgapp-monitor.majearcasa.workers.dev",
						type: "monitoring",
						priority: "low",
						description: "Monitor de tarefas Celery",
						status: "available",
						clientAccess: false
					}
				],
				clientAccess: {
					note: "Serviços marcados como 'clientAccess: true' estão disponíveis para acesso dos clientes",
					development: "Use ?env=dev para ver URLs de desenvolvimento",
					production: "URLs de produção estão configuradas para acesso público"
				},
				timestamp: new Date().toISOString()
			}, { headers: corsHeaders });
		}

		// Endpoint específico para clientes - informações da aplicação BGAPP
		// GET /client-info
		if (path === "/client-info") {
			return Response.json({
				success: true,
				message: "BGAPP - Sistema de Gestão Geoespacial",
				company: "MareDatum Consultoria e Gestão de Projectos Unipessoal LDA",
				version: "1.0.0",
				status: "online",
				description: "Sistema avançado de gestão e análise de dados geoespaciais para projetos de grande escala",
				features: [
					"Interface web moderna e intuitiva",
					"Dashboard administrativo completo",
					"APIs RESTful para integração",
					"Processamento de dados geoespaciais STAC",
					"Sistema de autenticação seguro",
					"Armazenamento de objetos escalável",
					"Monitoramento em tempo real"
				],
				accessPoints: {
					mainApplication: "https://bgapp-frontend.majearcasa.workers.dev",
					adminDashboard: "https://bgapp-admin.majearcasa.workers.dev",
					apiDocumentation: "https://bgapp-api.majearcasa.workers.dev/docs",
					geospatialAPI: "https://bgapp-stac.majearcasa.workers.dev",
					authentication: "https://bgapp-auth.majearcasa.workers.dev"
				},
				technicalSpecs: {
					architecture: "Microserviços com Cloudflare Workers",
					database: "PostgreSQL com Redis para cache",
					storage: "MinIO para objetos geoespaciais",
					authentication: "Keycloak com OAuth2/OIDC",
					monitoring: "Flower para tarefas assíncronas",
					geospatial: "STAC API e PyGeoAPI"
				},
				contact: {
					email: "info@maredatum.pt",
					website: "https://maredatum.pt",
					support: "Disponível 24/7 via sistema de tickets"
				},
				timestamp: new Date().toISOString()
			}, { headers: corsHeaders });
		}

		// Endpoint raiz - informações gerais do workflow
		if (path === "/") {
			return Response.json({
				success: true,
				message: "BGAPP Cloudflare Workflow - Sistema de Gestão de Infraestrutura",
				version: "1.0.0",
				endpoints: {
					"GET /": "Informações gerais do workflow",
					"GET /client-info": "Informações para clientes sobre a aplicação BGAPP",
					"GET /services": "Lista de serviços BGAPP",
					"GET /health-check": "Iniciar health check de todos os serviços",
					"GET /status?instanceId=<id>": "Status de uma instância específica"
				},
				workflow: {
					name: "BGAPPInfrastructureWorkflow",
					description: "Monitora e gerencia a infraestrutura completa do BGAPP",
					features: [
						"Health checks automáticos",
						"Monitoramento de serviços críticos",
						"Retry automático com backoff exponencial",
						"Alertas para serviços críticos",
						"Logging detalhado"
					]
				},
				clientAccess: {
					note: "Para informações específicas para clientes, acesse /client-info",
					mainApp: "https://bgapp-frontend.majearcasa.workers.dev"
				},
				timestamp: new Date().toISOString()
			}, { headers: corsHeaders });
		}

		// Endpoint não encontrado
		return Response.json({
			success: false,
			error: "Endpoint not found",
			availableEndpoints: [
				"/",
				"/client-info",
				"/services",
				"/health-check",
				"/status"
			],
			clientEndpoints: {
				mainInfo: "/client-info",
				services: "/services",
				note: "Use /client-info para informações específicas para clientes"
			}
		}, { status: 404, headers: corsHeaders });
	},
};
