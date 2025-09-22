/**
 * 🧹 BGAPP Interface Cleanup - Remoção de Duplicações
 * Consolida interfaces duplicadas e remove versões de debug
 */

// Interfaces que devem ser removidas ou consolidadas
export const INTERFACES_TO_REMOVE = [
  'realtime_angola_debug',     // Versão de debug
  'realtime_angola_fixed',      // Versão corrigida (usar principal)
  'Tempo Real Debug',           // Debug duplicado
  'Tempo Real Corrigido',       // Versão duplicada
];

// Mapeamento de interfaces duplicadas para a versão principal
export const INTERFACE_MAPPING = {
  'realtime_angola': 'Tempo Real Angola',
  'realtime_angola_debug': 'Tempo Real Angola',
  'realtime_angola_fixed': 'Tempo Real Angola',
  'Tempo Real Debug': 'Tempo Real Angola',
  'Tempo Real Corrigido': 'Tempo Real Angola',
  'Realtime Angola': 'Tempo Real Angola',
};

// Interface única consolidada
export const CONSOLIDATED_REALTIME_INTERFACE = {
  id: 'realtime-angola',
  name: 'Tempo Real Angola',
  description: 'Dados oceanográficos em tempo real da costa angolana',
  url: '/realtime_angola.html',
  category: 'monitoring',
  icon: '👁️',
  badge: 'LIVE',
  isActive: true,
  features: [
    'Dados em tempo real',
    'Monitorização contínua',
    'WebSockets',
    'Visualização interativa'
  ]
};

/**
 * Limpa duplicações de uma lista de interfaces
 */
export function cleanupInterfaces(interfaces: any[]): any[] {
  const seen = new Set<string>();
  const cleaned: any[] = [];
  
  interfaces.forEach(interface_ => {
    const mappedName = INTERFACE_MAPPING[interface_.name] || interface_.name;
    
    // Pular interfaces que devem ser removidas
    if (INTERFACES_TO_REMOVE.includes(interface_.id) || 
        INTERFACES_TO_REMOVE.includes(interface_.name)) {
      return;
    }
    
    // Evitar duplicações
    if (!seen.has(mappedName)) {
      seen.add(mappedName);
      
      // Se for Tempo Real Angola, usar a versão consolidada
      if (mappedName === 'Tempo Real Angola') {
        cleaned.push(CONSOLIDATED_REALTIME_INTERFACE);
      } else {
        cleaned.push(interface_);
      }
    }
  });
  
  return cleaned;
}

/**
 * Valida se há duplicações em uma lista
 */
export function checkForDuplicates(interfaces: any[]): string[] {
  const names = interfaces.map(i => i.name || i.label);
  const duplicates: string[] = [];
  const seen = new Set<string>();
  
  names.forEach(name => {
    if (seen.has(name)) {
      duplicates.push(name);
    } else {
      seen.add(name);
    }
  });
  
  return duplicates;
}

export default {
  cleanupInterfaces,
  checkForDuplicates,
  INTERFACES_TO_REMOVE,
  INTERFACE_MAPPING,
  CONSOLIDATED_REALTIME_INTERFACE
};
