/**
 * Test GFW Real Integration
 * Testa a integração real com Global Fishing Watch API
 */

const GFW_API_BASE = 'https://gateway.api.globalfishingwatch.org';

async function testGFWIntegration() {
  console.log('🔍 Testando integração real com GFW API...');

  // Get token from environment (simulate worker environment)
  const token = process.env.GFW_API_TOKEN;
  if (!token) {
    console.error('❌ GFW_API_TOKEN não encontrado nas variáveis de ambiente');
    return;
  }

  console.log(`✅ Token encontrado: ${token.substring(0, 20)}...`);

  // Test 1: Basic connectivity
  console.log('\n📡 Teste 1: Conectividade básica com API');
  try {
    const response = await fetch(`${GFW_API_BASE}/v3/datasets?limit=1`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Conectividade OK! Total datasets: ${data.total}`);
      console.log(`📊 Sample dataset: ${data.entries?.[0]?.id || 'N/A'}`);
    } else {
      console.error(`❌ Falha na conectividade: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Erro:', errorText.substring(0, 200));
    }
  } catch (error) {
    console.error('❌ Erro de conectividade:', error.message);
  }

  // Test 2: Vessel presence data for Angola
  console.log('\n🚢 Teste 2: Dados de presença de embarcações (Angola)');
  try {
    const end = new Date();
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

    const params = new URLSearchParams({
      'dataset': 'public-global-ais-vessel-presence:v3.0',
      'start-date': start.toISOString().split('T')[0],
      'end-date': end.toISOString().split('T')[0],
      'bbox': '11.5,-18.5,17.5,-4.2', // Angola EEZ
      'format': 'json'
    });

    const response = await fetch(`${GFW_API_BASE}/v3/4wings/report?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Dados de embarcações obtidos!');
      console.log(`📊 Vessel presence hours: ${data.total_vessel_presence_hours || 'N/A'}`);
      console.log(`🚢 Unique vessels: ${data.unique_vessels || 'N/A'}`);
    } else {
      console.error(`❌ Falha ao obter dados de embarcações: ${response.status}`);
      const errorText = await response.text();
      console.error('Detalhes:', errorText.substring(0, 300));
    }
  } catch (error) {
    console.error('❌ Erro ao obter dados de embarcações:', error.message);
  }

  // Test 3: Fishing activity data
  console.log('\n🎣 Teste 3: Dados de atividade pesqueira');
  try {
    const end = new Date();
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

    const params = new URLSearchParams({
      'dataset': 'public-global-fishing-activity:v20231026',
      'start-date': start.toISOString().split('T')[0],
      'end-date': end.toISOString().split('T')[0],
      'bbox': '11.5,-18.5,17.5,-4.2',
      'vessel-groups': 'fishing',
      'format': 'geojson',
      'spatial-aggregation': 'true'
    });

    const response = await fetch(`${GFW_API_BASE}/v3/4wings/aggregate?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/geo+json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Dados de atividade pesqueira obtidos!');
      console.log(`📊 Features encontradas: ${data.features?.length || 0}`);
      if (data.features && data.features.length > 0) {
        const sample = data.features[0];
        console.log(`🎯 Sample location: [${sample.geometry?.coordinates?.join(', ') || 'N/A'}]`);
        console.log(`⏱️ Hours: ${sample.properties?.hours || 'N/A'}`);
      }
    } else {
      console.error(`❌ Falha ao obter atividade pesqueira: ${response.status}`);
      const errorText = await response.text();
      console.error('Detalhes:', errorText.substring(0, 300));
    }
  } catch (error) {
    console.error('❌ Erro ao obter atividade pesqueira:', error.message);
  }

  console.log('\n🎉 Teste de integração GFW concluído!');
}

// Execute the test
testGFWIntegration().catch(console.error);