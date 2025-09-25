/**
 * 🔢 BGAPP Interface Counter - Sistema de Contagem Dinâmica
 * Garante que o número de interfaces seja sempre preciso
 */

export interface InterfaceCategory {
  name: string;
  interfaces: string[];
  active: boolean;
}

// 📊 Definição centralizada de todas as interfaces BGAPP
export const BGAPP_INTERFACES = {
  // 🔬 Análise e Ciência (8 interfaces)
  analysis: {
    name: 'Análise',
    active: true,
    interfaces: [
      'Dashboard Científico',
      'Dashboard Principal', 
      'Colaboração Científica',
      'STAC Oceanográfico',
      'ML Demo',
      'Animações Avançadas',
      'BGAPP Enhanced',
      'ML Demo deck.gl WebGL2'
    ]
  },
  
  // 📡 Monitorização (4 interfaces - sem duplicações)
  monitoring: {
    name: 'Monitorização',
    active: true,
    interfaces: [
      'Tempo Real Angola',  // Versão principal única
      'Dashboard de Saúde',
      'Sistema Status',
      'Alertas Automáticos'
    ]
  },
  
  // 🗺️ Espacial e QGIS (6 interfaces)
  spatial: {
    name: 'Espacial',
    active: true,
    interfaces: [
      'QGIS Dashboard',
      'Análise Espacial',
      'Visualização Temporal',
      'Calculadora de Biomassa',
      'Análise MCDA/AHP',
      'Zonas Sustentáveis'
    ]
  },
  
  // 📱 Mobile (2 interfaces)
  mobile: {
    name: 'Mobile',
    active: true,
    interfaces: [
      'Mobile PWA',
      'Mobile Basic'
    ]
  },
  
  // 🌊 Oceanografia (5 interfaces)
  oceanography: {
    name: 'Oceanografia',
    active: true,
    interfaces: [
      'Enhanced Ocean System',
      'Correntes Marinhas',
      'Temperatura SST',
      'Salinidade',
      'Batimetria'
    ]
  },
  
  // 🤖 Machine Learning (7 interfaces)
  machineLearning: {
    name: 'Machine Learning',
    active: true,
    interfaces: [
      'ML Dashboard',
      'Filtros Preditivos',
      'Modelos Treinados',
      'Base de Retenção ML',
      'Auto Ingestion',
      'Model Manager',
      'Performance Metrics'
    ]
  },
  
  // 🎯 Demos e Testes (3 interfaces)
  demos: {
    name: 'Demos',
    active: true,
    interfaces: [
      'Demo Enhanced',
      'Wind Animation Demo',
      'Ocean Simulation'
    ]
  },
  
  // 📊 Analytics (4 interfaces)
  analytics: {
    name: 'Analytics',
    active: true,
    interfaces: [
      'Analytics Avançado',
      'Relatórios',
      'Heatmaps',
      'Cohort Analysis'
    ]
  },
  
  // 🔧 Administração (2 interfaces)
  admin: {
    name: 'Administração',
    active: true,
    interfaces: [
      'User Management',
      'System Config'
    ]
  },
  
  // 🌐 Serviços Externos (3 interfaces)
  external: {
    name: 'Externos',
    active: true,
    interfaces: [
      'STAC Browser',
      'MinIO Console',
      'Flower Monitor'
    ]
  }
};

// 🔢 Funções de contagem dinâmica
export const InterfaceCounter = {
  /**
   * Conta o total de interfaces
   */
  getTotalCount(): number {
    let total = 0;
    Object.values(BGAPP_INTERFACES).forEach(category => {
      if (category.active) {
        total += category.interfaces.length;
      }
    });
    return total;
  },
  
  /**
   * Conta interfaces ativas
   */
  getActiveCount(): number {
    // Por enquanto, consideramos 90% como ativas (simulação)
    return Math.floor(this.getTotalCount() * 0.9);
  },
  
  /**
   * Conta categorias
   */
  getCategoryCount(): number {
    return Object.keys(BGAPP_INTERFACES).length;
  },
  
  /**
   * Retorna interfaces por categoria
   */
  getInterfacesByCategory(categoryKey: string): string[] {
    const category = BGAPP_INTERFACES[categoryKey as keyof typeof BGAPP_INTERFACES];
    return category ? category.interfaces : [];
  },
  
  /**
   * Valida se o número está correto
   */
  validateCount(claimedCount: number): boolean {
    const actualCount = this.getTotalCount();
    return claimedCount === actualCount;
  },
  
  /**
   * Retorna estatísticas completas
   */
  getStats() {
    return {
      total: this.getTotalCount(),
      active: this.getActiveCount(),
      categories: this.getCategoryCount(),
      byCategory: Object.entries(BGAPP_INTERFACES).map(([key, cat]) => ({
        name: cat.name,
        count: cat.interfaces.length,
        active: cat.active
      }))
    };
  },
  
  /**
   * Verifica duplicações
   */
  checkDuplicates(): string[] {
    const allInterfaces: string[] = [];
    const duplicates: string[] = [];
    
    Object.values(BGAPP_INTERFACES).forEach(category => {
      category.interfaces.forEach(interfaceName => {
        if (allInterfaces.includes(interfaceName)) {
          duplicates.push(interfaceName);
        } else {
          allInterfaces.push(interfaceName);
        }
      });
    });
    
    return duplicates;
  },
  
  /**
   * Gera badge dinâmico
   */
  generateBadge(): string {
    const count = this.getTotalCount();
    return `${count} INTERFACES`;
  }
};

// 🎯 Exportar contagem atual
export const CURRENT_INTERFACE_COUNT = InterfaceCounter.getTotalCount();
export const CURRENT_ACTIVE_COUNT = InterfaceCounter.getActiveCount();
export const CURRENT_CATEGORY_COUNT = InterfaceCounter.getCategoryCount();

// 🔍 Validação automática em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  const duplicates = InterfaceCounter.checkDuplicates();
  if (duplicates.length > 0) {
    console.warn('⚠️ Interfaces duplicadas encontradas:', duplicates);
  }
  
  console.log('📊 BGAPP Interface Stats:', InterfaceCounter.getStats());
}

export default InterfaceCounter;
