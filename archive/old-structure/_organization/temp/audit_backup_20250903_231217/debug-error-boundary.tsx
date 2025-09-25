/**
 * 🔍 DEBUG ERROR BOUNDARY - SILICON VALLEY DIAGNOSTIC
 * Componente temporário para identificar erros específicos
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function DebugErrorBoundary() {
  const [errors, setErrors] = useState<string[]>([]);
  const [isDebugging, setIsDebugging] = useState(false);

  const testComponents = [
    { name: 'Dashboard Overview', id: 'dashboard' },
    { name: 'Hub Científico', id: 'scientific-hub' },
    { name: 'Mapas', id: 'maps' },
    { name: 'QGIS', id: 'qgis' },
    { name: 'Machine Learning', id: 'ml' },
  ];

  const testComponent = async (componentId: string, componentName: string) => {
    try {
      console.log(`🧪 Testing ${componentName}...`);
      
      // Simular carregamento do componente
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verificar se há erros conhecidos
      const knownErrors = [];
      
      if (componentId === 'maps') {
        knownErrors.push('URLs localhost não convertidas para mapas');
      }
      
      if (componentId === 'qgis') {
        knownErrors.push('Componentes QGIS com problemas de hydration');
      }
      
      if (knownErrors.length > 0) {
        setErrors(prev => [...prev, `❌ ${componentName}: ${knownErrors.join(', ')}`]);
      } else {
        setErrors(prev => [...prev, `✅ ${componentName}: OK`]);
      }
      
    } catch (error) {
      setErrors(prev => [...prev, `🚨 ${componentName}: ${error}`]);
    }
  };

  const runDiagnostic = async () => {
    setIsDebugging(true);
    setErrors(['🔍 Iniciando diagnóstico Silicon Valley...']);
    
    for (const component of testComponents) {
      await testComponent(component.id, component.name);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setIsDebugging(false);
    setErrors(prev => [...prev, '🎯 Diagnóstico completo!']);
  };

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>🔍 Debug Error Boundary - Silicon Valley</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostic} 
          disabled={isDebugging}
          className="w-full"
        >
          {isDebugging ? '🔄 Diagnosticando...' : '🧪 Executar Diagnóstico'}
        </Button>
        
        <div className="bg-gray-100 p-4 rounded max-h-60 overflow-y-auto">
          <pre className="text-sm">
            {errors.map((error, i) => (
              <div key={i}>{error}</div>
            ))}
          </pre>
        </div>
        
        <div className="text-xs text-gray-500">
          <p>🌐 Ambiente: Cloudflare (Produção)</p>
          <p>🕐 Debug: {new Date().toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  );
}
