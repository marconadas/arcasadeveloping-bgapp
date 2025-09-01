// Script para testar a função loadAPI() diretamente
console.log('🧪 Iniciando teste da função loadAPI...');

// Aguardar um pouco para garantir que a página carregou
setTimeout(() => {
    console.log('🧪 Verificando se SectionLoader existe...');
    
    if (typeof window.SectionLoader !== 'undefined') {
        console.log('✅ SectionLoader encontrado!');
        console.log('📋 Métodos disponíveis:', Object.keys(window.SectionLoader));
        
        // Verificar se loadAPI existe
        if (typeof window.SectionLoader.loadAPI === 'function') {
            console.log('✅ loadAPI é uma função!');
            
            // Executar a função
            console.log('🚀 Executando loadAPI()...');
            window.SectionLoader.loadAPI().then(() => {
                console.log('✅ loadAPI() executada com sucesso!');
            }).catch(error => {
                console.error('❌ Erro ao executar loadAPI():', error);
            });
            
        } else {
            console.error('❌ loadAPI não é uma função');
        }
        
    } else {
        console.error('❌ SectionLoader não encontrado');
        console.log('🔍 Variáveis globais disponíveis:', Object.keys(window).filter(k => k.includes('Section') || k.includes('API') || k.includes('Config')));
    }
    
}, 2000);

// Verificar se CONFIG existe
if (typeof window.CONFIG !== 'undefined') {
    console.log('✅ CONFIG encontrado:', window.CONFIG);
} else {
    console.error('❌ CONFIG não encontrado');
}
