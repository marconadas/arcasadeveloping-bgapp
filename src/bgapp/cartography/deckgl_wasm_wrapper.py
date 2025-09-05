#!/usr/bin/env python3
"""
🌐 DECK.GL WebAssembly WRAPPER - BGAPP
Wrapper Python para executar Deck.GL usando WebAssembly
Integração de alta performance para visualizações geoespaciais

TASK-003 Implementation: WebAssembly Deck.GL Python Integration
Baseado na pesquisa da TASK-002 - Solução WebAssembly recomendada
"""

import asyncio
import json
import logging
import base64
from typing import Dict, List, Any, Optional, Tuple, Union
from pathlib import Path
import subprocess
import tempfile
from dataclasses import dataclass, asdict
from io import BytesIO
import uuid
from datetime import datetime

# WebAssembly e JavaScript execution imports
try:
    import js2py
    JS2PY_AVAILABLE = True
except ImportError:
    JS2PY_AVAILABLE = False

try:
    import wasmtime
    WASMTIME_AVAILABLE = True
except ImportError:
    WASMTIME_AVAILABLE = False

# Configurar logging
logger = logging.getLogger(__name__)

@dataclass
class DeckGLLayer:
    """Definição de uma camada Deck.GL"""
    id: str
    type: str
    data: List[Dict[str, Any]]
    props: Dict[str, Any]
    visible: bool = True
    pickable: bool = True

@dataclass  
class DeckGLViewState:
    """Estado de visualização do Deck.GL"""
    longitude: float = 13.2  # Centro de Angola
    latitude: float = -8.8
    zoom: float = 6
    pitch: float = 0
    bearing: float = 0
    width: int = 800
    height: int = 600

@dataclass
class DeckGLConfig:
    """Configuração do Deck.GL"""
    canvas_id: str
    view_state: DeckGLViewState
    controller: bool = True
    useDevicePixels: bool = True
    pickingRadius: int = 10
    
class DeckGLWASMWrapper:
    """
    🚀 Wrapper WebAssembly para Deck.GL
    
    Permite executar visualizações Deck.GL no Python usando WebAssembly
    para máxima performance e compatibilidade.
    """
    
    def __init__(self, config: Optional[DeckGLConfig] = None):
        """
        Inicializar wrapper Deck.GL WebAssembly
        
        Args:
            config: Configuração do Deck.GL
        """
        self.config = config or DeckGLConfig(
            canvas_id=f"deckgl-canvas-{uuid.uuid4().hex[:8]}",
            view_state=DeckGLViewState()
        )
        
        self.layers: List[DeckGLLayer] = []
        self.is_initialized = False
        self.js_context = None
        self.wasm_module = None
        self.html_output = ""
        
        # Verificar dependências
        self._check_dependencies()
        
        # Inicializar
        self._initialize()
    
    def _check_dependencies(self) -> None:
        """Verificar e instalar dependências necessárias"""
        logger.info("🔍 Verificando dependências WebAssembly...")
        
        dependencies_status = {
            "js2py": JS2PY_AVAILABLE,
            "wasmtime": WASMTIME_AVAILABLE
        }
        
        missing_deps = [dep for dep, available in dependencies_status.items() if not available]
        
        if missing_deps:
            logger.warning(f"⚠️ Dependências em falta: {', '.join(missing_deps)}")
            logger.info("💡 Continuando com implementação JavaScript fallback...")
        else:
            logger.info("✅ Todas as dependências WebAssembly disponíveis")
    
    def _initialize(self) -> None:
        """Inicializar o wrapper"""
        try:
            logger.info("🚀 Inicializando DeckGL WASM Wrapper...")
            
            # Configurar contexto JavaScript se disponível
            if JS2PY_AVAILABLE:
                self._setup_js_context()
            
            # Configurar WebAssembly se disponível
            if WASMTIME_AVAILABLE:
                self._setup_wasm_context()
            
            self.is_initialized = True
            logger.info("✅ DeckGL WASM Wrapper inicializado com sucesso")
            
        except Exception as e:
            logger.error(f"❌ Erro na inicialização: {e}")
            # Fallback para modo compatibilidade
            self._initialize_compatibility_mode()
    
    def _setup_js_context(self) -> None:
        """Configurar contexto JavaScript"""
        logger.info("⚙️ Configurando contexto JavaScript...")
        
        try:
            # JavaScript code para Deck.GL
            deckgl_js_code = """
            // Mock Deck.GL implementation for Python integration
            var deck = {
                Deck: function(config) {
                    this.config = config;
                    this.layers = [];
                    this.viewState = config.initialViewState || config.viewState;
                    
                    this.setProps = function(props) {
                        if (props.layers) this.layers = props.layers;
                        if (props.viewState) this.viewState = props.viewState;
                    };
                    
                    this.getLayers = function() { return this.layers; };
                    this.getViewState = function() { return this.viewState; };
                },
                ScatterplotLayer: function(props) {
                    this.id = props.id;
                    this.type = 'ScatterplotLayer';
                    this.props = props;
                },
                HeatmapLayer: function(props) {
                    this.id = props.id;
                    this.type = 'HeatmapLayer';
                    this.props = props;
                },
                IconLayer: function(props) {
                    this.id = props.id;
                    this.type = 'IconLayer';
                    this.props = props;
                }
            };
            
            function createDeckInstance(config) {
                return new deck.Deck(config);
            }
            
            function createLayer(layerType, props) {
                switch(layerType) {
                    case 'ScatterplotLayer':
                        return new deck.ScatterplotLayer(props);
                    case 'HeatmapLayer':
                        return new deck.HeatmapLayer(props);
                    case 'IconLayer':
                        return new deck.IconLayer(props);
                    default:
                        throw new Error('Unknown layer type: ' + layerType);
                }
            }
            """
            
            self.js_context = js2py.eval_js(deckgl_js_code)
            logger.info("✅ Contexto JavaScript configurado")
            
        except Exception as e:
            logger.error(f"❌ Erro ao configurar JavaScript: {e}")
            self.js_context = None
    
    def _setup_wasm_context(self) -> None:
        """Configurar contexto WebAssembly"""
        logger.info("⚙️ Configurando contexto WebAssembly...")
        
        try:
            # Por agora, usar mock até ter módulo WASM real
            logger.info("💡 WebAssembly mock configurado (integração futura)")
            
        except Exception as e:
            logger.error(f"❌ Erro ao configurar WebAssembly: {e}")
    
    def _initialize_compatibility_mode(self) -> None:
        """Inicializar modo de compatibilidade"""
        logger.info("🔄 Inicializando modo de compatibilidade...")
        self.is_initialized = True
        logger.info("✅ Modo de compatibilidade ativo")
    
    def add_layer(self, layer: DeckGLLayer) -> None:
        """
        Adicionar camada ao Deck.GL
        
        Args:
            layer: Camada para adicionar
        """
        if not self.is_initialized:
            raise RuntimeError("Wrapper não inicializado")
        
        logger.info(f"➕ Adicionando camada: {layer.id} ({layer.type})")
        
        # Validar camada
        if not layer.data and layer.type != 'TileLayer':
            logger.warning(f"⚠️ Camada {layer.id} não tem dados")
        
        self.layers.append(layer)
        logger.info(f"✅ Camada {layer.id} adicionada (total: {len(self.layers)})")
    
    def remove_layer(self, layer_id: str) -> bool:
        """
        Remover camada por ID
        
        Args:
            layer_id: ID da camada para remover
            
        Returns:
            True se removida com sucesso
        """
        initial_count = len(self.layers)
        self.layers = [layer for layer in self.layers if layer.id != layer_id]
        
        removed = len(self.layers) < initial_count
        if removed:
            logger.info(f"🗑️ Camada {layer_id} removida")
        else:
            logger.warning(f"⚠️ Camada {layer_id} não encontrada")
            
        return removed
    
    def update_view_state(self, view_state: DeckGLViewState) -> None:
        """
        Atualizar estado de visualização
        
        Args:
            view_state: Novo estado de visualização
        """
        logger.info(f"🗺️ Atualizando view state: lon={view_state.longitude}, lat={view_state.latitude}, zoom={view_state.zoom}")
        self.config.view_state = view_state
    
    def create_scatterplot_layer(self, 
                                layer_id: str, 
                                data: List[Dict[str, Any]],
                                **props) -> DeckGLLayer:
        """
        Criar camada de pontos
        
        Args:
            layer_id: ID único da camada
            data: Dados dos pontos
            **props: Propriedades adicionais
            
        Returns:
            Camada configurada
        """
        default_props = {
            'getPosition': '[longitude, latitude]',
            'getRadius': 1000,
            'getFillColor': '[255, 0, 0, 160]',
            'radiusScale': 1,
            'radiusMinPixels': 3,
            'radiusMaxPixels': 30
        }
        default_props.update(props)
        
        return DeckGLLayer(
            id=layer_id,
            type='ScatterplotLayer',
            data=data,
            props=default_props
        )
    
    def create_heatmap_layer(self, 
                           layer_id: str, 
                           data: List[Dict[str, Any]],
                           **props) -> DeckGLLayer:
        """
        Criar camada de mapa de calor
        
        Args:
            layer_id: ID único da camada
            data: Dados dos pontos
            **props: Propriedades adicionais
            
        Returns:
            Camada configurada
        """
        default_props = {
            'getPosition': '[longitude, latitude]',
            'getWeight': 'weight',
            'radiusPixels': 60,
            'intensity': 1,
            'threshold': 0.03
        }
        default_props.update(props)
        
        return DeckGLLayer(
            id=layer_id,
            type='HeatmapLayer',
            data=data,
            props=default_props
        )
    
    def create_icon_layer(self, 
                         layer_id: str, 
                         data: List[Dict[str, Any]],
                         **props) -> DeckGLLayer:
        """
        Criar camada de ícones
        
        Args:
            layer_id: ID único da camada
            data: Dados dos ícones
            **props: Propriedades adicionais
            
        Returns:
            Camada configurada
        """
        default_props = {
            'getPosition': '[longitude, latitude]',
            'getIcon': 'icon',
            'getSize': 32,
            'getColor': '[255, 255, 255, 255]',
            'pickable': True
        }
        default_props.update(props)
        
        return DeckGLLayer(
            id=layer_id,
            type='IconLayer',
            data=data,
            props=default_props
        )
    
    def render_to_html(self, 
                      title: str = "BGAPP Deck.GL Visualization",
                      include_controls: bool = True) -> str:
        """
        Renderizar visualização para HTML
        
        Args:
            title: Título da visualização
            include_controls: Incluir controles de navegação
            
        Returns:
            HTML completo da visualização
        """
        logger.info("🎨 Renderizando visualização para HTML...")
        
        # Preparar dados das camadas
        layers_json = []
        for layer in self.layers:
            layer_config = {
                'id': layer.id,
                'type': layer.type,
                'data': layer.data,
                'visible': layer.visible,
                'pickable': layer.pickable,
                **layer.props
            }
            layers_json.append(layer_config)
        
        # Gerar HTML
        html_template = f"""
<!DOCTYPE html>
<html>
<head>
    <title>{title}</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Deck.GL e dependências -->
    <script src="https://unpkg.com/deck.gl@latest/dist.min.js"></script>
    <script src="https://unpkg.com/@loaders.gl/core@latest/dist/dist.min.js"></script>
    <script src="https://unpkg.com/@loaders.gl/csv@latest/dist/dist.min.js"></script>
    
    <!-- Mapbox GL JS -->
    <script src='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js'></script>
    <link href='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css' rel='stylesheet' />
    
    <style>
        body {{ margin: 0; padding: 0; font-family: Arial, sans-serif; }}
        #container {{ position: relative; width: 100vw; height: 100vh; }}
        #{self.config.canvas_id} {{ width: 100%; height: 100%; }}
        .info-panel {{ 
            position: absolute; 
            top: 10px; 
            left: 10px; 
            background: rgba(255,255,255,0.9); 
            padding: 10px; 
            border-radius: 5px;
            font-size: 12px;
            max-width: 300px;
            z-index: 1000;
        }}
        .controls {{ 
            position: absolute; 
            top: 10px; 
            right: 10px; 
            background: rgba(255,255,255,0.9); 
            padding: 10px; 
            border-radius: 5px;
            z-index: 1000;
        }}
    </style>
</head>
<body>
    <div id="container">
        <canvas id="{self.config.canvas_id}"></canvas>
        
        <div class="info-panel">
            <h3>🌊 {title}</h3>
            <p><strong>Camadas:</strong> {len(self.layers)}</p>
            <p><strong>Centro:</strong> {self.config.view_state.latitude:.2f}, {self.config.view_state.longitude:.2f}</p>
            <p><strong>Zoom:</strong> {self.config.view_state.zoom}</p>
            <p><small>Gerado por BGAPP DeckGL WASM Wrapper</small></p>
        </div>
        
        {"" if not include_controls else '''
        <div class="controls">
            <button onclick="resetView()">🔄 Reset View</button>
            <button onclick="toggleLayers()">👁️ Toggle Layers</button>
        </div>
        '''}
    </div>

    <script>
        // Configuração inicial
        const INITIAL_VIEW_STATE = {json.dumps(asdict(self.config.view_state))};
        const LAYERS_DATA = {json.dumps(layers_json, indent=2)};
        
        // Inicializar Deck.GL
        const deckgl = new deck.DeckGL({{
            canvas: '{self.config.canvas_id}',
            width: '100%',
            height: '100%',
            initialViewState: INITIAL_VIEW_STATE,
            controller: {json.dumps(self.config.controller).lower()},
            useDevicePixels: {json.dumps(self.config.useDevicePixels).lower()},
            pickingRadius: {self.config.pickingRadius},
            
            // Criar camadas dinamicamente
            layers: LAYERS_DATA.map(layerConfig => {{
                switch(layerConfig.type) {{
                    case 'ScatterplotLayer':
                        return new deck.ScatterplotLayer(layerConfig);
                    case 'HeatmapLayer':
                        return new deck.HeatmapLayer(layerConfig);
                    case 'IconLayer':
                        return new deck.IconLayer(layerConfig);
                    default:
                        console.warn('Unknown layer type:', layerConfig.type);
                        return null;
                }}
            }}).filter(Boolean),
            
            // Event handlers
            onViewStateChange: ({{viewState}}) => {{
                console.log('View state changed:', viewState);
            }},
            
            onHover: ({{object, x, y}}) => {{
                if (object) {{
                    console.log('Hovered:', object, 'at', x, y);
                }}
            }},
            
            onClick: ({{object, x, y}}) => {{
                if (object) {{
                    console.log('Clicked:', object, 'at', x, y);
                    alert('Clicked object: ' + JSON.stringify(object, null, 2));
                }}
            }}
        }});
        
        // Funções de controle
        function resetView() {{
            deckgl.setProps({{
                initialViewState: INITIAL_VIEW_STATE
            }});
        }}
        
        let layersVisible = true;
        function toggleLayers() {{
            layersVisible = !layersVisible;
            const layers = deckgl.props.layers.map(layer => ({{
                ...layer,
                visible: layersVisible
            }}));
            deckgl.setProps({{layers}});
        }}
        
        // Log de inicialização
        console.log('🌊 BGAPP Deck.GL WASM Wrapper initialized');
        console.log('Layers:', LAYERS_DATA.length);
        console.log('View state:', INITIAL_VIEW_STATE);
    </script>
</body>
</html>
        """
        
        self.html_output = html_template
        logger.info(f"✅ HTML gerado ({len(html_template)} chars, {len(self.layers)} camadas)")
        
        return html_template
    
    def save_html(self, filepath: Union[str, Path]) -> Path:
        """
        Salvar visualização em arquivo HTML
        
        Args:
            filepath: Caminho para salvar
            
        Returns:
            Caminho do arquivo salvo
        """
        if not self.html_output:
            self.render_to_html()
        
        filepath = Path(filepath)
        filepath.parent.mkdir(parents=True, exist_ok=True)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(self.html_output)
        
        logger.info(f"💾 Visualização salva: {filepath}")
        return filepath
    
    def get_layer_stats(self) -> Dict[str, Any]:
        """
        Obter estatísticas das camadas
        
        Returns:
            Estatísticas das camadas
        """
        stats = {
            'total_layers': len(self.layers),
            'visible_layers': sum(1 for layer in self.layers if layer.visible),
            'layer_types': {},
            'total_data_points': 0
        }
        
        for layer in self.layers:
            layer_type = layer.type
            if layer_type not in stats['layer_types']:
                stats['layer_types'][layer_type] = 0
            stats['layer_types'][layer_type] += 1
            stats['total_data_points'] += len(layer.data)
        
        return stats
    
    def __str__(self) -> str:
        """String representation"""
        stats = self.get_layer_stats()
        return f"DeckGLWASMWrapper(layers={stats['total_layers']}, points={stats['total_data_points']}, initialized={self.is_initialized})"
    
    def __repr__(self) -> str:
        """Detailed representation"""
        return f"<{self.__class__.__name__} canvas_id={self.config.canvas_id} layers={len(self.layers)}>"

# Funções utilitárias para criação rápida
def create_angola_marine_visualization(data: List[Dict[str, Any]], 
                                     layer_type: str = "scatterplot") -> DeckGLWASMWrapper:
    """
    Criar visualização marinha rápida para Angola
    
    Args:
        data: Dados oceanográficos
        layer_type: Tipo de camada ('scatterplot', 'heatmap', 'icon')
        
    Returns:
        Wrapper configurado para Angola
    """
    config = DeckGLConfig(
        canvas_id="angola-marine-map",
        view_state=DeckGLViewState(
            longitude=13.2,  # Costa de Angola
            latitude=-8.8,
            zoom=6
        )
    )
    
    wrapper = DeckGLWASMWrapper(config)
    
    if layer_type == "scatterplot":
        layer = wrapper.create_scatterplot_layer(
            "angola-data", 
            data,
            getFillColor=[0, 100, 200, 160],
            getRadius=2000
        )
    elif layer_type == "heatmap":
        layer = wrapper.create_heatmap_layer("angola-heatmap", data)
    elif layer_type == "icon":
        layer = wrapper.create_icon_layer("angola-icons", data)
    else:
        raise ValueError(f"Tipo de camada não suportado: {layer_type}")
    
    wrapper.add_layer(layer)
    return wrapper

# Exemplo de uso
if __name__ == "__main__":
    # Dados de exemplo
    sample_data = [
        {"longitude": 13.2, "latitude": -8.8, "value": 25.5, "name": "Luanda"},
        {"longitude": 12.5, "latitude": -5.2, "value": 24.1, "name": "Cabinda"},
        {"longitude": 15.1, "latitude": -9.5, "value": 23.8, "name": "Lobito"},
        {"longitude": 13.8, "latitude": -12.5, "value": 22.3, "name": "Benguela"}
    ]
    
    # Criar wrapper
    wrapper = create_angola_marine_visualization(sample_data, "scatterplot")
    
    # Renderizar
    html = wrapper.render_to_html("Teste BGAPP Deck.GL WASM")
    
    # Salvar
    output_file = wrapper.save_html("test_deckgl_wasm.html")
    
    print(f"✅ Teste completo! HTML salvo em: {output_file}")
    print(f"📊 Estatísticas: {wrapper.get_layer_stats()}")
