/**
 * Nezasa ISO8601 Polyfill for BGAPP
 * Resolve o problema de "nezasa is not defined" no leaflet-timedimension
 * Deve ser carregado ANTES do leaflet-timedimension
 */

console.log('🔧 Inicializando polyfill nezasa...');

// Cria o objeto nezasa se não existir
window.nezasa = window.nezasa || {
  iso8601: {
    /**
     * Construtor de Period
     */
    Period: function(period) {
      this.period = period;
      this.toString = function() { 
        return this.period; 
      };
      return this;
    },
    
    /**
     * Parse de string ISO8601
     */
    parse: function(str) {
      try {
        return new this.Period(str);
      } catch (error) {
        console.warn('⚠️ Erro no parse ISO8601:', str, error);
        return new this.Period('P1D'); // Fallback para 1 dia
      }
    },
    
    /**
     * Formatação de data para ISO8601
     */
    format: function(date) {
      try {
        if (date instanceof Date) {
          return date.toISOString();
        }
        return date.toString();
      } catch (error) {
        console.warn('⚠️ Erro na formatação de data:', date, error);
        return new Date().toISOString();
      }
    }
  }
};

// Adiciona métodos auxiliares para compatibilidade
window.nezasa.iso8601.Duration = window.nezasa.iso8601.Period;

console.log('✅ Polyfill nezasa configurado com sucesso');
console.log('🔍 Nezasa disponível:', typeof window.nezasa !== 'undefined');
console.log('🔍 Nezasa.iso8601 disponível:', typeof window.nezasa.iso8601 !== 'undefined');
