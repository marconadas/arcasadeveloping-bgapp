'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ENV } from '@/config/environment';

export function TestScientificLinks() {
  const testLinks = [
    {
      name: 'Dashboard Científico',
      path: '/dashboard_cientifico.html',
      fullUrl: 'https://bgapp-frontend.pages.dev/dashboard_cientifico.html'
    },
    {
      name: 'Tempo Real Angola',
      path: '/realtime_angola.html',
      fullUrl: 'https://bgapp-frontend.pages.dev/realtime_angola.html'
    },
    {
      name: 'QGIS Dashboard',
      path: '/qgis_dashboard.html',
      fullUrl: 'https://bgapp-frontend.pages.dev/qgis_dashboard.html'
    },
    {
      name: 'Colaboração',
      path: '/collaboration.html',
      fullUrl: 'https://bgapp-frontend.pages.dev/collaboration.html'
    }
  ];

  const testLink = (url: string, name: string) => {
    console.log(`🧪 Testing ${name}: ${url}`);
    try {
      window.open(url, '_blank');
      console.log(`✅ ${name} opened successfully`);
    } catch (error) {
      console.error(`❌ ${name} failed:`, error);
    }
  };

  const testAllLinks = () => {
    console.log('🚀 Testing all scientific interfaces...');
    console.log('🌐 Environment:', ENV);
    console.log('📍 Scientific Interfaces URL:', ENV.scientificInterfacesUrl);
    
    testLinks.forEach(link => {
      setTimeout(() => testLink(link.fullUrl, link.name), 500);
    });
  };

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>🧪 Teste de Links Científicos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 p-4 rounded">
          <p className="text-sm"><strong>URL Base:</strong> {ENV.scientificInterfacesUrl}</p>
          <p className="text-sm"><strong>Ambiente:</strong> {ENV.isProduction ? 'Produção' : 'Desenvolvimento'}</p>
        </div>

        <Button onClick={testAllLinks} className="w-full">
          🧪 Testar Todos os Links
        </Button>

        <div className="grid grid-cols-1 gap-2">
          {testLinks.map((link, i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded">
              <div>
                <p className="font-medium">{link.name}</p>
                <p className="text-xs text-gray-500">{link.fullUrl}</p>
              </div>
              <Button 
                size="sm" 
                onClick={() => testLink(link.fullUrl, link.name)}
              >
                Testar
              </Button>
            </div>
          ))}
        </div>

        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <p>🔍 Abra o Console (F12) para ver logs detalhados</p>
          <p>✅ Links que funcionam abrirão em nova aba</p>
          <p>❌ Links com problemas mostrarão erro no console</p>
        </div>
      </CardContent>
    </Card>
  );
}
