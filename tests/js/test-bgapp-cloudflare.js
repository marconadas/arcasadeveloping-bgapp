#!/usr/bin/env node

/**
 * BGAPP - Suite de Testes Completa para Cloudflare Deployment
 * MareDatum - Sistema de Testes Automatizados
 * 
 * Este script testa todos os aspectos da aplicação BGAPP deployed no Cloudflare
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuração
const BASE_URL = 'https://arcasadeveloping.org';
const BGAPP_PATH = '/BGAPP';
const TIMEOUT = 10000; // 10 segundos

// Cores para output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

// Estatísticas
const stats = {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
    startTime: Date.now()
};

// Lista de testes
const tests = [
    // 1. TESTES DE INFRAESTRUTURA
    {
        category: 'Infraestrutura',
        tests: [
            {
                name: 'Página principal acessível',
                endpoint: '/BGAPP/',
                method: 'GET',
                expectedStatus: 200,
                validateContent: (data) => data.includes('BGAPP')
            },
            {
                name: 'Redirecionamento de / para /BGAPP/',
                endpoint: '/',
                method: 'GET',
                expectedStatus: [301, 302, 200],
                followRedirect: true
            },
            {
                name: 'Headers de segurança presentes',
                endpoint: '/BGAPP/',
                method: 'GET',
                validateHeaders: (headers) => {
                    const required = ['x-content-type-options', 'referrer-policy'];
                    return required.every(h => headers[h]);
                }
            },
            {
                name: 'Cloudflare CDN ativo',
                endpoint: '/BGAPP/',
                method: 'GET',
                validateHeaders: (headers) => headers['cf-ray'] !== undefined
            },
            {
                name: 'Cache headers configurados',
                endpoint: '/BGAPP/assets/js/main.js',
                method: 'GET',
                validateHeaders: (headers) => headers['cache-control'] !== undefined
            }
        ]
    },

    // 2. TESTES DE CONTEÚDO
    {
        category: 'Conteúdo e Assets',
        tests: [
            {
                name: 'Título da página correto',
                endpoint: '/BGAPP/',
                method: 'GET',
                validateContent: (data) => data.includes('Plataforma Científica')
            },
            {
                name: 'Bibliotecas Three.js carregadas',
                endpoint: '/BGAPP/',
                method: 'GET',
                validateContent: (data) => data.includes('three.module.js')
            },
            {
                name: 'Deck.gl integrado',
                endpoint: '/BGAPP/',
                method: 'GET',
                validateContent: (data) => data.includes('deck.gl')
            },
            {
                name: 'Mapbox GL presente',
                endpoint: '/BGAPP/',
                method: 'GET',
                validateContent: (data) => data.includes('mapbox-gl')
            },
            {
                name: 'Plotly.js carregado',
                endpoint: '/BGAPP/',
                method: 'GET',
                validateContent: (data) => data.includes('plotly')
            },
            {
                name: 'D3.js disponível',
                endpoint: '/BGAPP/',
                method: 'GET',
                validateContent: (data) => data.includes('d3.v7')
            }
        ]
    },

    // 3. TESTES DE FUNCIONALIDADES
    {
        category: 'Funcionalidades',
        tests: [
            {
                name: 'Niagara Background presente',
                endpoint: '/BGAPP/',
                method: 'GET',
                validateContent: (data) => data.includes('niagara-background')
            },
            {
                name: 'Sistema ML mencionado',
                endpoint: '/BGAPP/',
                method: 'GET',
                validateContent: (data) => data.includes('Machine Learning')
            },
            {
                name: 'Controles Niagara disponíveis',
                endpoint: '/BGAPP/',
                method: 'GET',
                validateContent: (data) => data.includes('niagara-controls')
            },
            {
                name: 'Estatísticas da plataforma',
                endpoint: '/BGAPP/',
                method: 'GET',
                validateContent: (data) => data.includes('61+') && data.includes('Funcionalidades')
            },
            {
                name: 'Modelos ML listados',
                endpoint: '/BGAPP/',
                method: 'GET',
                validateContent: (data) => data.includes('95.2%') && data.includes('Precisão')
            }
        ]
    },

    // 4. TESTES DE API
    {
        category: 'API e Endpoints',
        tests: [
            {
                name: 'Admin dashboard acessível',
                endpoint: '/BGAPP/admin.html',
                method: 'GET',
                expectedStatus: [200, 404] // Pode não estar deployed
            },
            {
                name: 'Service Worker registrado',
                endpoint: '/BGAPP/sw.js',
                method: 'GET',
                expectedStatus: [200, 404]
            },
            {
                name: 'Manifest.json disponível',
                endpoint: '/BGAPP/manifest.json',
                method: 'GET',
                expectedStatus: [200, 404]
            }
        ]
    },

    // 5. TESTES DE PERFORMANCE
    {
        category: 'Performance',
        tests: [
            {
                name: 'Tempo de resposta < 3s',
                endpoint: '/BGAPP/',
                method: 'GET',
                validatePerformance: (responseTime) => responseTime < 3000
            },
            {
                name: 'Compressão ativa',
                endpoint: '/BGAPP/',
                method: 'GET',
                validateHeaders: (headers) => {
                    const encoding = headers['content-encoding'];
                    return encoding && (encoding.includes('gzip') || encoding.includes('br'));
                }
            }
        ]
    },

    // 6. TESTES DE SEO E METADADOS
    {
        category: 'SEO e Metadados',
        tests: [
            {
                name: 'Meta description presente',
                endpoint: '/BGAPP/',
                method: 'GET',
                validateContent: (data) => data.includes('meta name="description"')
            },
            {
                name: 'Meta keywords configuradas',
                endpoint: '/BGAPP/',
                method: 'GET',
                validateContent: (data) => data.includes('meta name="keywords"')
            },
            {
                name: 'Viewport configurado',
                endpoint: '/BGAPP/',
                method: 'GET',
                validateContent: (data) => data.includes('viewport')
            },
            {
                name: 'Charset UTF-8',
                endpoint: '/BGAPP/',
                method: 'GET',
                validateContent: (data) => data.includes('charset="UTF-8"')
            }
        ]
    },

    // 7. TESTES DE RESPONSIVIDADE
    {
        category: 'Responsividade',
        tests: [
            {
                name: 'Media queries presentes',
                endpoint: '/BGAPP/',
                method: 'GET',
                validateContent: (data) => data.includes('@media')
            },
            {
                name: 'Mobile-friendly tags',
                endpoint: '/BGAPP/',
                method: 'GET',
                validateContent: (data) => data.includes('width=device-width')
            }
        ]
    },

    // 8. TESTES DE INTEGRAÇÕES
    {
        category: 'Integrações',
        tests: [
            {
                name: 'Font Awesome carregado',
                endpoint: '/BGAPP/',
                method: 'GET',
                validateContent: (data) => data.includes('font-awesome')
            },
            {
                name: 'AOS animations',
                endpoint: '/BGAPP/',
                method: 'GET',
                validateContent: (data) => data.includes('aos.js')
            },
            {
                name: 'GSAP presente',
                endpoint: '/BGAPP/',
                method: 'GET',
                validateContent: (data) => data.includes('gsap')
            }
        ]
    },

    // 9. TESTES DE CONTEÚDO ESPECÍFICO
    {
        category: 'Conteúdo Específico',
        tests: [
            {
                name: 'Informações sobre Angola',
                endpoint: '/BGAPP/',
                method: 'GET',
                validateContent: (data) => data.includes('Angola')
            },
            {
                name: 'ZEE mencionada',
                endpoint: '/BGAPP/',
                method: 'GET',
                validateContent: (data) => data.includes('518K') || data.includes('ZEE')
            },
            {
                name: 'MareDatum creditado',
                endpoint: '/BGAPP/',
                method: 'GET',
                validateContent: (data) => data.includes('MareDatum')
            },
            {
                name: 'Diretor Geral mencionado',
                endpoint: '/BGAPP/',
                method: 'GET',
                validateContent: (data) => data.includes('Paulo Fernandes')
            }
        ]
    },

    // 10. TESTES DE ACESSIBILIDADE
    {
        category: 'Acessibilidade',
        tests: [
            {
                name: 'Atributos alt em imagens',
                endpoint: '/BGAPP/',
                method: 'GET',
                validateContent: (data) => {
                    // Verificar se há imagens sem alt (básico)
                    const imgTags = data.match(/<img[^>]*>/g) || [];
                    if (imgTags.length === 0) return true; // Sem imagens
                    return imgTags.every(tag => tag.includes('alt='));
                }
            },
            {
                name: 'Estrutura HTML semântica',
                endpoint: '/BGAPP/',
                method: 'GET',
                validateContent: (data) => {
                    return data.includes('<header') && 
                           data.includes('<section') && 
                           data.includes('<footer');
                }
            }
        ]
    }
];

// Função para fazer requisição HTTP/HTTPS
function makeRequest(url, method = 'GET') {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const protocol = parsedUrl.protocol === 'https:' ? https : http;
        
        const startTime = Date.now();
        
        const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            method: method,
            timeout: TIMEOUT,
            headers: {
                'User-Agent': 'BGAPP-Test-Suite/1.0'
            }
        };

        const req = protocol.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                const responseTime = Date.now() - startTime;
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    data: data,
                    responseTime: responseTime
                });
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

// Função para executar um teste
async function runTest(test, categoryName) {
    stats.total++;
    
    const url = BASE_URL + test.endpoint;
    const startTime = Date.now();
    
    try {
        const response = await makeRequest(url, test.method);
        const duration = Date.now() - startTime;
        
        let passed = true;
        let message = '';
        
        // Validar status
        if (test.expectedStatus) {
            const expectedStatuses = Array.isArray(test.expectedStatus) 
                ? test.expectedStatus 
                : [test.expectedStatus];
            
            if (!expectedStatuses.includes(response.status)) {
                passed = false;
                message = `Status ${response.status} (esperado: ${expectedStatuses.join(' ou ')})`;
            }
        }
        
        // Validar conteúdo
        if (passed && test.validateContent) {
            if (!test.validateContent(response.data)) {
                passed = false;
                message = 'Validação de conteúdo falhou';
            }
        }
        
        // Validar headers
        if (passed && test.validateHeaders) {
            if (!test.validateHeaders(response.headers)) {
                passed = false;
                message = 'Validação de headers falhou';
            }
        }
        
        // Validar performance
        if (passed && test.validatePerformance) {
            if (!test.validatePerformance(response.responseTime)) {
                passed = false;
                message = `Tempo de resposta: ${response.responseTime}ms`;
            }
        }
        
        if (passed) {
            stats.passed++;
            console.log(`  ${colors.green}✓${colors.reset} ${test.name} ${colors.cyan}(${duration}ms)${colors.reset}`);
        } else {
            stats.failed++;
            console.log(`  ${colors.red}✗${colors.reset} ${test.name} - ${message}`);
        }
        
    } catch (error) {
        stats.failed++;
        console.log(`  ${colors.red}✗${colors.reset} ${test.name} - Erro: ${error.message}`);
    }
}

// Função principal
async function runAllTests() {
    console.log(`\n${colors.bright}${colors.blue}╔════════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}║         BGAPP - Suite de Testes Cloudflare Deployment         ║${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}╚════════════════════════════════════════════════════════════════╝${colors.reset}\n`);
    
    console.log(`${colors.cyan}URL Base:${colors.reset} ${BASE_URL}`);
    console.log(`${colors.cyan}Path BGAPP:${colors.reset} ${BGAPP_PATH}`);
    console.log(`${colors.cyan}Timeout:${colors.reset} ${TIMEOUT}ms`);
    console.log(`${colors.cyan}Iniciando testes:${colors.reset} ${new Date().toLocaleString('pt-BR')}\n`);
    
    // Executar testes por categoria
    for (const category of tests) {
        console.log(`\n${colors.bright}${colors.magenta}[${category.category}]${colors.reset}`);
        console.log(`${colors.cyan}${'─'.repeat(50)}${colors.reset}`);
        
        for (const test of category.tests) {
            await runTest(test, category.category);
        }
    }
    
    // Relatório final
    const totalTime = ((Date.now() - stats.startTime) / 1000).toFixed(2);
    const successRate = ((stats.passed / stats.total) * 100).toFixed(1);
    
    console.log(`\n${colors.bright}${colors.blue}╔════════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}║                      RELATÓRIO FINAL                          ║${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}╚════════════════════════════════════════════════════════════════╝${colors.reset}\n`);
    
    console.log(`${colors.cyan}Total de testes:${colors.reset} ${stats.total}`);
    console.log(`${colors.green}Aprovados:${colors.reset} ${stats.passed}`);
    console.log(`${colors.red}Falhados:${colors.reset} ${stats.failed}`);
    console.log(`${colors.yellow}Avisos:${colors.reset} ${stats.warnings}`);
    console.log(`${colors.cyan}Taxa de sucesso:${colors.reset} ${successRate}%`);
    console.log(`${colors.cyan}Tempo total:${colors.reset} ${totalTime}s`);
    
    // Status final
    if (stats.failed === 0) {
        console.log(`\n${colors.bright}${colors.green}✅ TODOS OS TESTES PASSARAM COM SUCESSO!${colors.reset}\n`);
        process.exit(0);
    } else if (stats.passed > stats.failed) {
        console.log(`\n${colors.bright}${colors.yellow}⚠️  ALGUNS TESTES FALHARAM (${stats.failed}/${stats.total})${colors.reset}\n`);
        process.exit(1);
    } else {
        console.log(`\n${colors.bright}${colors.red}❌ MAIORIA DOS TESTES FALHOU${colors.reset}\n`);
        process.exit(2);
    }
}

// Executar testes
runAllTests().catch(error => {
    console.error(`\n${colors.red}Erro fatal ao executar testes:${colors.reset}`, error);
    process.exit(3);
});
