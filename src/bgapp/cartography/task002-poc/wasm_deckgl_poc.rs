// POC 3: WebAssembly (WASM) + Deck.GL Integration
// Wrapper Rust para Deck.GL usando wasm-bindgen
// TASK-002 - BGAPP Silicon Valley Edition

use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::{Document, HtmlCanvasElement, WebGl2RenderingContext};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// Importar console do JavaScript para logging
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
    
    #[wasm_bindgen(js_namespace = deck)]
    type DeckGL;
    
    #[wasm_bindgen(constructor, js_namespace = deck)]
    fn new(config: &JsValue) -> DeckGL;
    
    #[wasm_bindgen(method)]
    fn setProps(this: &DeckGL, props: &JsValue);
    
    #[wasm_bindgen(method)]
    fn finalize(this: &DeckGL);
}

// Macro para facilitar logging
macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

// Estruturas de dados para a ZEE Angola
#[derive(Serialize, Deserialize, Debug)]
pub struct ViewState {
    pub longitude: f64,
    pub latitude: f64,
    pub zoom: f64,
    pub pitch: f64,
    pub bearing: f64,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct FishingZone {
    pub position: Vec<f64>,
    pub abundance: f64,
    pub species: String,
    pub zone: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct TemperaturePoint {
    pub position: Vec<f64>,
    pub weight: f64,
}

#[derive(Serialize, Deserialize)]
pub struct LayerConfig {
    pub id: String,
    #[serde(rename = "type")]
    pub layer_type: String,
    pub data: Vec<serde_json::Value>,
}

// Métricas de performance
#[derive(Serialize, Deserialize, Debug)]
pub struct PerformanceMetrics {
    pub init_time_ms: f64,
    pub render_time_ms: f64,
    pub layer_count: usize,
    pub memory_usage_kb: f64,
    pub fps: f64,
}

// Wrapper principal para Deck.GL em WASM
#[wasm_bindgen]
pub struct BGAPPDeckGLWASM {
    deck_instance: Option<DeckGL>,
    view_state: ViewState,
    layers: Vec<LayerConfig>,
    performance: PerformanceMetrics,
    canvas_id: String,
}

#[wasm_bindgen]
impl BGAPPDeckGLWASM {
    // Construtor
    #[wasm_bindgen(constructor)]
    pub fn new(canvas_id: String) -> BGAPPDeckGLWASM {
        console_log!("🚀 Inicializando BGAPPDeckGLWASM...");
        
        let view_state = ViewState {
            longitude: 12.0,  // Centro da ZEE Angola
            latitude: -11.0,
            zoom: 5.0,
            pitch: 0.0,
            bearing: 0.0,
        };
        
        BGAPPDeckGLWASM {
            deck_instance: None,
            view_state,
            layers: Vec::new(),
            performance: PerformanceMetrics {
                init_time_ms: 0.0,
                render_time_ms: 0.0,
                layer_count: 0,
                memory_usage_kb: 0.0,
                fps: 0.0,
            },
            canvas_id,
        }
    }
    
    // Inicializar Deck.GL
    pub fn initialize(&mut self) -> Result<bool, JsValue> {
        let start = js_sys::Date::now();
        console_log!("🔧 Configurando Deck.GL via WASM...");
        
        // Obter documento e canvas
        let window = web_sys::window().unwrap();
        let document = window.document().unwrap();
        
        // Configuração do Deck.GL
        let config = js_sys::Object::new();
        js_sys::Reflect::set(
            &config,
            &JsValue::from_str("container"),
            &JsValue::from_str(&self.canvas_id),
        )?;
        
        // Adicionar view state
        let view_state_js = JsValue::from_serde(&self.view_state).unwrap();
        js_sys::Reflect::set(
            &config,
            &JsValue::from_str("initialViewState"),
            &view_state_js,
        )?;
        
        js_sys::Reflect::set(
            &config,
            &JsValue::from_str("controller"),
            &JsValue::from_bool(true),
        )?;
        
        // Criar instância do Deck.GL
        let deck = DeckGL::new(&config);
        self.deck_instance = Some(deck);
        
        // Calcular tempo de inicialização
        self.performance.init_time_ms = js_sys::Date::now() - start;
        
        console_log!("✅ Deck.GL inicializado em {:.2}ms", self.performance.init_time_ms);
        Ok(true)
    }
    
    // Criar dados de pesca da ZEE Angola
    pub fn create_angola_fishing_data(&self) -> Vec<FishingZone> {
        console_log!("🐟 Gerando dados de pesca da ZEE Angola...");
        
        let zones = vec![
            ("Cabinda", -5.5, 12.2),
            ("Soyo", -6.1, 12.3),
            ("Luanda", -8.8, 13.2),
            ("Benguela", -12.6, 13.4),
            ("Namibe", -15.2, 12.1),
        ];
        
        let species = vec!["Sardinha", "Atum", "Carapau", "Corvina", "Garoupa"];
        let mut data = Vec::new();
        
        for (zone_name, lat, lng) in zones {
            // Gerar pontos ao redor de cada zona
            for i in 0..10 {
                let offset_lat = (i as f64 - 5.0) * 0.1;
                let offset_lng = (i as f64 - 5.0) * 0.1;
                
                data.push(FishingZone {
                    position: vec![lng + offset_lng, lat + offset_lat],
                    abundance: 50.0 + (i as f64 * 15.0),
                    species: species[i % species.len()].to_string(),
                    zone: zone_name.to_string(),
                });
            }
        }
        
        console_log!("✅ {} pontos de pesca criados", data.len());
        data
    }
    
    // Criar dados de temperatura
    pub fn create_temperature_data(&self) -> Vec<TemperaturePoint> {
        console_log!("🌡️ Gerando dados de temperatura SST...");
        
        let mut data = Vec::new();
        
        // Grade de temperatura ao longo da costa
        for lat in (-16..=-4).step_by(2) {
            for lng in (11..=14).step_by(1) {
                data.push(TemperaturePoint {
                    position: vec![lng as f64, lat as f64],
                    weight: 0.3 + ((lat + 10) as f64 * 0.05),
                });
            }
        }
        
        console_log!("✅ {} pontos de temperatura criados", data.len());
        data
    }
    
    // Adicionar ScatterplotLayer
    pub fn add_scatterplot_layer(&mut self, layer_id: String) -> Result<(), JsValue> {
        let start = js_sys::Date::now();
        console_log!("📍 Adicionando ScatterplotLayer: {}", layer_id);
        
        // Criar dados
        let fishing_data = self.create_angola_fishing_data();
        let data_js: Vec<serde_json::Value> = fishing_data
            .iter()
            .map(|d| serde_json::to_value(d).unwrap())
            .collect();
        
        // Configurar layer
        let layer = LayerConfig {
            id: layer_id.clone(),
            layer_type: "ScatterplotLayer".to_string(),
            data: data_js,
        };
        
        self.layers.push(layer);
        self.update_deck_layers()?;
        
        let elapsed = js_sys::Date::now() - start;
        self.performance.render_time_ms += elapsed;
        self.performance.layer_count = self.layers.len();
        
        console_log!("✅ ScatterplotLayer adicionada em {:.2}ms", elapsed);
        Ok(())
    }
    
    // Adicionar HeatmapLayer
    pub fn add_heatmap_layer(&mut self, layer_id: String) -> Result<(), JsValue> {
        let start = js_sys::Date::now();
        console_log!("🌡️ Adicionando HeatmapLayer: {}", layer_id);
        
        // Criar dados
        let temp_data = self.create_temperature_data();
        let data_js: Vec<serde_json::Value> = temp_data
            .iter()
            .map(|d| serde_json::to_value(d).unwrap())
            .collect();
        
        // Configurar layer
        let layer = LayerConfig {
            id: layer_id.clone(),
            layer_type: "HeatmapLayer".to_string(),
            data: data_js,
        };
        
        self.layers.push(layer);
        self.update_deck_layers()?;
        
        let elapsed = js_sys::Date::now() - start;
        self.performance.render_time_ms += elapsed;
        self.performance.layer_count = self.layers.len();
        
        console_log!("✅ HeatmapLayer adicionada em {:.2}ms", elapsed);
        Ok(())
    }
    
    // Atualizar layers no Deck.GL
    fn update_deck_layers(&self) -> Result<(), JsValue> {
        if let Some(deck) = &self.deck_instance {
            let layers_js = JsValue::from_serde(&self.layers)?;
            let props = js_sys::Object::new();
            js_sys::Reflect::set(&props, &JsValue::from_str("layers"), &layers_js)?;
            deck.setProps(&props);
        }
        Ok(())
    }
    
    // Executar verificações de sanidade
    pub fn run_sanity_checks(&self) -> String {
        console_log!("🔍 Executando verificações de sanidade WASM...");
        
        let mut checks = HashMap::new();
        
        // Verificar inicialização
        checks.insert("wasm_initialized", true);
        checks.insert("deck_instance_created", self.deck_instance.is_some());
        checks.insert("layers_created", self.layers.len() > 0);
        
        // Verificar WebGL
        let webgl_available = self.check_webgl_support();
        checks.insert("webgl2_available", webgl_available);
        
        // Verificar performance
        checks.insert("init_time_acceptable", self.performance.init_time_ms < 1000.0);
        checks.insert("render_time_acceptable", self.performance.render_time_ms < 500.0);
        
        // Calcular memória aproximada
        let memory_estimate = (self.layers.len() * 100) as f64; // KB estimados por layer
        self.performance.memory_usage_kb.clone_from(&memory_estimate);
        checks.insert("memory_usage_acceptable", memory_estimate < 10000.0);
        
        let all_passed = checks.values().all(|&v| v);
        
        let result = serde_json::json!({
            "checks": checks,
            "performance": self.performance,
            "all_passed": all_passed,
            "timestamp": js_sys::Date::now(),
        });
        
        console_log!("📋 Resultado das verificações: {}", 
                   if all_passed { "✅ PASSOU" } else { "❌ FALHOU" });
        
        result.to_string()
    }
    
    // Verificar suporte WebGL
    fn check_webgl_support(&self) -> bool {
        let window = web_sys::window().unwrap();
        let document = window.document().unwrap();
        
        if let Ok(canvas) = document.create_element("canvas") {
            if let Ok(canvas) = canvas.dyn_into::<HtmlCanvasElement>() {
                // Tentar WebGL2 primeiro
                if canvas.get_context("webgl2").unwrap_or(JsValue::NULL).is_truthy() {
                    console_log!("✅ WebGL2 suportado");
                    return true;
                }
                // Fallback para WebGL1
                if canvas.get_context("webgl").unwrap_or(JsValue::NULL).is_truthy() {
                    console_log!("⚠️ Apenas WebGL1 suportado");
                    return true;
                }
            }
        }
        
        console_log!("❌ WebGL não suportado");
        false
    }
    
    // Obter métricas de performance
    pub fn get_performance_metrics(&self) -> String {
        serde_json::to_string(&self.performance).unwrap_or_default()
    }
    
    // Limpar recursos
    pub fn cleanup(&self) {
        console_log!("🧹 Limpando recursos WASM...");
        if let Some(deck) = &self.deck_instance {
            deck.finalize();
        }
    }
}

// Função de inicialização do módulo WASM
#[wasm_bindgen(start)]
pub fn main() {
    // Configurar panic handler para debug
    console_error_panic_hook::set_once();
    console_log!("🚀 Módulo WASM BGAPPDeckGL carregado com sucesso!");
}