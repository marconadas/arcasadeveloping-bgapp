const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3002;

// Configurações otimizadas para baixo uso de recursos
const app = next({ 
  dev,
  hostname,
  port,
  customServer: true,
  // Configurações para reduzir uso de memória
  conf: {
    compress: false,
    poweredByHeader: false,
    generateEtags: false,
    experimental: {
      turbo: false,
    },
    webpack: (config) => {
      // Configurações mínimas de webpack
      config.cache = false;
      config.optimization.minimize = false;
      return config;
    }
  }
});

const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  })
  .listen(port, (err) => {
    if (err) throw err;
    console.log(`🚀 BGAPP Admin Dashboard - Servidor Otimizado`);
    console.log(`   Rodando em http://${hostname}:${port}`);
    console.log(`   Modo: ${dev ? 'desenvolvimento' : 'produção'}`);
    console.log(`   Configurações: baixo uso de recursos`);
  });
});
