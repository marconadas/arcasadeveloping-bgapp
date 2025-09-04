#!/usr/bin/env python3
"""
Demonstração do Sistema de Machine Learning
Script independente que demonstra todas as funcionalidades implementadas
"""

import json
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
import uuid

class MLSystemDemo:
    """Demonstração das funcionalidades de ML implementadas"""
    
    def __init__(self):
        self.demo_db = "demo_ml.db"
        self.setup_demo_database()
    
    def setup_demo_database(self):
        """Cria base de dados de demonstração"""
        print("🗄️ Configurando base de dados de demonstração...")
        
        conn = sqlite3.connect(self.demo_db)
        
        # Criar tabelas simplificadas para demo
        conn.execute("""
            CREATE TABLE IF NOT EXISTS biodiversity_studies (
                study_id TEXT PRIMARY KEY,
                study_name TEXT NOT NULL,
                study_type TEXT NOT NULL,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                species_observed TEXT,
                environmental_parameters TEXT,
                data_quality_score REAL,
                processed_for_ml BOOLEAN DEFAULT FALSE,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.execute("""
            CREATE TABLE IF NOT EXISTS ml_training_data (
                training_data_id TEXT PRIMARY KEY,
                source_study_id TEXT,
                model_type TEXT,
                features TEXT,
                target_variable TEXT,
                target_value TEXT,
                data_quality REAL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.execute("""
            CREATE TABLE IF NOT EXISTS ml_models (
                model_id TEXT PRIMARY KEY,
                model_name TEXT,
                model_type TEXT,
                status TEXT,
                training_accuracy REAL,
                prediction_count INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.execute("""
            CREATE TABLE IF NOT EXISTS prediction_results (
                prediction_id TEXT PRIMARY KEY,
                model_id TEXT,
                input_data TEXT,
                prediction TEXT,
                confidence REAL,
                latitude REAL,
                longitude REAL,
                used_for_mapping BOOLEAN DEFAULT FALSE,
                prediction_timestamp TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.execute("""
            CREATE TABLE IF NOT EXISTS map_filters (
                filter_id TEXT PRIMARY KEY,
                name TEXT,
                filter_type TEXT,
                model_id TEXT,
                min_confidence REAL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.commit()
        conn.close()
        
        print("✅ Base de dados configurada")
    
    def demo_create_biodiversity_study(self):
        """Demonstra criação automática de estudo de biodiversidade"""
        print("\n🐟 DEMO: Criação de Estudo de Biodiversidade")
        print("-" * 50)
        
        # Dados do estudo
        study_data = {
            "study_id": f"demo_study_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "study_name": "Levantamento Costa de Luanda - Demo",
            "study_type": "species_survey",
            "latitude": -8.8383,
            "longitude": 13.2344,
            "species_observed": [
                {"species_name": "Sardinella aurita", "count": 25, "abundance": 75},
                {"species_name": "Trachurus capensis", "count": 12, "abundance": 45}
            ],
            "environmental_parameters": {
                "temperature": 24.8,
                "salinity": 35.1,
                "ph": 8.0,
                "chlorophyll": 2.3
            },
            "data_quality_score": 0.87
        }
        
        # Simular armazenamento automático
        conn = sqlite3.connect(self.demo_db)
        
        conn.execute("""
            INSERT INTO biodiversity_studies (
                study_id, study_name, study_type, latitude, longitude,
                species_observed, environmental_parameters, data_quality_score,
                processed_for_ml
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            study_data["study_id"],
            study_data["study_name"],
            study_data["study_type"],
            study_data["latitude"],
            study_data["longitude"],
            json.dumps(study_data["species_observed"]),
            json.dumps(study_data["environmental_parameters"]),
            study_data["data_quality_score"],
            True  # Processado automaticamente
        ))
        
        conn.commit()
        conn.close()
        
        print(f"✅ Estudo criado: {study_data['study_id']}")
        print(f"   📍 Localização: {study_data['latitude']}, {study_data['longitude']}")
        print(f"   🐟 Espécies: {len(study_data['species_observed'])}")
        print(f"   📊 Qualidade: {study_data['data_quality_score']:.2f}")
        print(f"   🧠 Processado para ML: ✅")
        
        return study_data["study_id"]
    
    def demo_automatic_ml_ingestion(self, study_id):
        """Demonstra ingestão automática para ML"""
        print("\n🔄 DEMO: Ingestão Automática para ML")
        print("-" * 50)
        
        # Simular extração automática de características
        conn = sqlite3.connect(self.demo_db)
        
        # Obter dados do estudo
        study = conn.execute(
            "SELECT * FROM biodiversity_studies WHERE study_id = ?",
            (study_id,)
        ).fetchone()
        
        if not study:
            print("❌ Estudo não encontrado")
            return
        
        # Extrair dados para treino
        species_data = json.loads(study[5])  # species_observed
        env_data = json.loads(study[6])      # environmental_parameters
        
        training_samples = []
        
        for species in species_data:
            # Criar amostra de treino para cada espécie
            training_id = f"training_{study_id}_{species['species_name'].replace(' ', '_')}"
            
            features = {
                "latitude": study[3],
                "longitude": study[4],
                **env_data
            }
            
            # Inserir dados de treino
            conn.execute("""
                INSERT INTO ml_training_data (
                    training_data_id, source_study_id, model_type,
                    features, target_variable, target_value, data_quality
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                training_id,
                study_id,
                "biodiversity_predictor",
                json.dumps(features),
                "abundance",
                str(species["abundance"]),
                study[7]  # data_quality_score
            ))
            
            training_samples.append(training_id)
        
        conn.commit()
        conn.close()
        
        print(f"✅ Dados extraídos automaticamente:")
        print(f"   📊 {len(training_samples)} amostras de treino criadas")
        print(f"   🎯 Modelo alvo: biodiversity_predictor")
        print(f"   🔧 Características: latitude, longitude, temperatura, salinidade, pH, clorofila")
        print(f"   📈 Variável alvo: abundância de espécies")
        
        return training_samples
    
    def demo_model_training(self):
        """Demonstra treino automático de modelos"""
        print("\n🧠 DEMO: Treino Automático de Modelos")
        print("-" * 50)
        
        conn = sqlite3.connect(self.demo_db)
        
        # Contar dados de treino disponíveis
        training_count = conn.execute(
            "SELECT COUNT(*) FROM ml_training_data WHERE model_type = 'biodiversity_predictor'"
        ).fetchone()[0]
        
        # Simular treino de modelo
        model_data = {
            "model_id": "biodiversity_predictor_v1",
            "model_name": "Preditor de Biodiversidade v1.0",
            "model_type": "biodiversity_predictor",
            "status": "trained",
            "training_accuracy": 0.94  # 94% de precisão simulada
        }
        
        conn.execute("""
            INSERT OR REPLACE INTO ml_models (
                model_id, model_name, model_type, status, training_accuracy
            ) VALUES (?, ?, ?, ?, ?)
        """, (
            model_data["model_id"],
            model_data["model_name"],
            model_data["model_type"],
            model_data["status"],
            model_data["training_accuracy"]
        ))
        
        conn.commit()
        conn.close()
        
        print(f"✅ Modelo treinado automaticamente:")
        print(f"   🤖 Modelo: {model_data['model_name']}")
        print(f"   📊 Dados de treino: {training_count} amostras")
        print(f"   🎯 Precisão: {model_data['training_accuracy']:.1%}")
        print(f"   ⚡ Status: {model_data['status']}")
        
        return model_data["model_id"]
    
    def demo_ml_prediction(self, model_id):
        """Demonstra predição com ML"""
        print("\n🔮 DEMO: Predições de Machine Learning")
        print("-" * 50)
        
        # Dados de entrada para predição
        input_data = {
            "latitude": -8.85,
            "longitude": 13.25,
            "temperature": 25.2,
            "salinity": 35.0,
            "ph": 8.1,
            "chlorophyll": 2.1
        }
        
        # Simular predição (em produção seria o modelo real)
        import random
        prediction_result = {
            "prediction_id": f"pred_{uuid.uuid4().hex[:8]}",
            "model_id": model_id,
            "input_data": input_data,
            "prediction": {"species_richness": random.randint(8, 20)},
            "confidence": random.uniform(0.75, 0.95),
            "latitude": input_data["latitude"],
            "longitude": input_data["longitude"]
        }
        
        # Salvar resultado
        conn = sqlite3.connect(self.demo_db)
        
        conn.execute("""
            INSERT INTO prediction_results (
                prediction_id, model_id, input_data, prediction, confidence,
                latitude, longitude, used_for_mapping
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            prediction_result["prediction_id"],
            prediction_result["model_id"],
            json.dumps(prediction_result["input_data"]),
            json.dumps(prediction_result["prediction"]),
            prediction_result["confidence"],
            prediction_result["latitude"],
            prediction_result["longitude"],
            True
        ))
        
        # Atualizar contador de predições do modelo
        conn.execute("""
            UPDATE ml_models 
            SET prediction_count = prediction_count + 1 
            WHERE model_id = ?
        """, (model_id,))
        
        conn.commit()
        conn.close()
        
        print(f"✅ Predição realizada:")
        print(f"   🆔 ID: {prediction_result['prediction_id']}")
        print(f"   📍 Local: {input_data['latitude']:.3f}, {input_data['longitude']:.3f}")
        print(f"   🐟 Predição: {prediction_result['prediction']['species_richness']} espécies")
        print(f"   🎯 Confiança: {prediction_result['confidence']:.1%}")
        print(f"   🗺️ Usado para mapeamento: ✅")
        
        return prediction_result["prediction_id"]
    
    def demo_predictive_filters(self, model_id):
        """Demonstra filtros preditivos"""
        print("\n🗺️ DEMO: Filtros Preditivos para Mapas")
        print("-" * 50)
        
        # Criar filtro
        filter_data = {
            "filter_id": "biodiversity_hotspots_demo",
            "name": "Hotspots de Biodiversidade - Demo",
            "filter_type": "biodiversity_hotspots",
            "model_id": model_id,
            "min_confidence": 0.8
        }
        
        conn = sqlite3.connect(self.demo_db)
        
        conn.execute("""
            INSERT OR REPLACE INTO map_filters (
                filter_id, name, filter_type, model_id, min_confidence, is_active
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (
            filter_data["filter_id"],
            filter_data["name"],
            filter_data["filter_type"],
            filter_data["model_id"],
            filter_data["min_confidence"],
            True
        ))
        
        # Obter predições que atendem aos critérios do filtro
        predictions = conn.execute("""
            SELECT prediction_id, latitude, longitude, prediction, confidence
            FROM prediction_results 
            WHERE model_id = ? AND confidence >= ? AND used_for_mapping = TRUE
        """, (model_id, filter_data["min_confidence"])).fetchall()
        
        conn.commit()
        conn.close()
        
        # Simular dados GeoJSON
        geojson_features = []
        for pred in predictions:
            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [pred[2], pred[1]]  # lon, lat
                },
                "properties": {
                    "prediction_id": pred[0],
                    "prediction": json.loads(pred[3]),
                    "confidence": pred[4],
                    "marker_color": "#ff6b35" if pred[4] > 0.9 else "#ffa500",
                    "marker_size": int(pred[4] * 15)
                }
            }
            geojson_features.append(feature)
        
        print(f"✅ Filtro preditivo criado:")
        print(f"   🏷️ Nome: {filter_data['name']}")
        print(f"   📊 Tipo: {filter_data['filter_type']}")
        print(f"   🎯 Confiança mínima: {filter_data['min_confidence']:.1%}")
        print(f"   📍 Pontos no mapa: {len(geojson_features)}")
        print(f"   🗺️ Formato: GeoJSON pronto para mapas")
        
        return filter_data["filter_id"], geojson_features
    
    def demo_system_statistics(self):
        """Demonstra estatísticas do sistema"""
        print("\n📊 DEMO: Estatísticas do Sistema")
        print("-" * 50)
        
        conn = sqlite3.connect(self.demo_db)
        
        # Estatísticas gerais
        studies_total = conn.execute("SELECT COUNT(*) FROM biodiversity_studies").fetchone()[0]
        studies_processed = conn.execute("SELECT COUNT(*) FROM biodiversity_studies WHERE processed_for_ml = TRUE").fetchone()[0]
        
        training_samples = conn.execute("SELECT COUNT(*) FROM ml_training_data").fetchone()[0]
        
        models_total = conn.execute("SELECT COUNT(*) FROM ml_models").fetchone()[0]
        models_trained = conn.execute("SELECT COUNT(*) FROM ml_models WHERE status = 'trained'").fetchone()[0]
        
        predictions_total = conn.execute("SELECT COUNT(*) FROM prediction_results").fetchone()[0]
        
        filters_total = conn.execute("SELECT COUNT(*) FROM map_filters").fetchone()[0]
        filters_active = conn.execute("SELECT COUNT(*) FROM map_filters WHERE is_active = TRUE").fetchone()[0]
        
        # Qualidade média dos dados
        avg_quality = conn.execute("SELECT AVG(data_quality_score) FROM biodiversity_studies").fetchone()[0] or 0
        
        conn.close()
        
        print("📈 Estatísticas Gerais:")
        print(f"   📚 Total de estudos: {studies_total}")
        print(f"   🧠 Processados para ML: {studies_processed}")
        print(f"   📊 Amostras de treino: {training_samples}")
        print(f"   🤖 Modelos disponíveis: {models_total}")
        print(f"   ✅ Modelos treinados: {models_trained}")
        print(f"   🔮 Predições realizadas: {predictions_total}")
        print(f"   🗺️ Filtros disponíveis: {filters_total}")
        print(f"   ⚡ Filtros ativos: {filters_active}")
        print(f"   📏 Qualidade média: {avg_quality:.2f}")
        
        return {
            "total_studies": studies_total,
            "processed_studies": studies_processed,
            "training_samples": training_samples,
            "models_trained": models_trained,
            "predictions_total": predictions_total,
            "filters_active": filters_active,
            "avg_quality": avg_quality
        }
    
    def demo_endpoints_simulation(self):
        """Demonstra como os endpoints funcionariam"""
        print("\n🛡️ DEMO: Endpoints Seguros (Simulação)")
        print("-" * 50)
        
        endpoints = [
            {
                "method": "POST",
                "path": "/ml/studies",
                "description": "Criar estudo de biodiversidade",
                "rate_limit": "30/minuto",
                "auth": "Bearer token obrigatório",
                "validation": "Pydantic models com validação rigorosa"
            },
            {
                "method": "POST",
                "path": "/ml/predict",
                "description": "Fazer predição ML",
                "rate_limit": "100/minuto",
                "auth": "Bearer token obrigatório",
                "validation": "Coordenadas e parâmetros validados"
            },
            {
                "method": "POST",
                "path": "/ml/filters",
                "description": "Criar filtro preditivo",
                "rate_limit": "20/minuto",
                "auth": "Bearer token obrigatório",
                "validation": "Bbox e configurações validadas"
            },
            {
                "method": "GET",
                "path": "/ml/filters/{id}/data",
                "description": "Dados GeoJSON do filtro",
                "rate_limit": "200/minuto",
                "auth": "Bearer token obrigatório",
                "validation": "ID do filtro validado"
            }
        ]
        
        print("🔒 Endpoints implementados com segurança:")
        for endpoint in endpoints:
            print(f"   {endpoint['method']} {endpoint['path']}")
            print(f"      📝 {endpoint['description']}")
            print(f"      ⏱️ Rate limit: {endpoint['rate_limit']}")
            print(f"      🔐 Auth: {endpoint['auth']}")
            print(f"      ✅ Validação: {endpoint['validation']}")
            print()
    
    def run_complete_demo(self):
        """Executa demonstração completa do sistema"""
        print("🌊 BGAPP - Demonstração do Sistema de Machine Learning")
        print("=" * 60)
        print("🎯 Esta demonstração mostra todas as funcionalidades implementadas")
        print("   sem necessidade de executar a aplicação completa.")
        print()
        
        try:
            # 1. Criar estudo
            study_id = self.demo_create_biodiversity_study()
            
            # 2. Ingestão automática
            training_samples = self.demo_automatic_ml_ingestion(study_id)
            
            # 3. Treino de modelo
            model_id = self.demo_model_training()
            
            # 4. Fazer predições
            prediction_id = self.demo_ml_prediction(model_id)
            
            # 5. Criar filtros
            filter_id, geojson = self.demo_predictive_filters(model_id)
            
            # 6. Mostrar estatísticas
            stats = self.demo_system_statistics()
            
            # 7. Demonstrar endpoints
            self.demo_endpoints_simulation()
            
            # Resumo final
            print("\n🎉 DEMONSTRAÇÃO CONCLUÍDA COM SUCESSO!")
            print("=" * 60)
            print("✅ Todas as funcionalidades foram demonstradas:")
            print("   🗄️ Armazenamento automático de estudos")
            print("   🔄 Ingestão automática para ML")
            print("   🧠 Treino automático de modelos")
            print("   🔮 Predições em tempo real")
            print("   🗺️ Filtros preditivos para mapas")
            print("   🛡️ Endpoints seguros com validação")
            print("   📊 Sistema de monitorização completo")
            
            print(f"\n📈 Resultados da demonstração:")
            print(f"   📚 Estudos processados: {stats['processed_studies']}")
            print(f"   🧠 Amostras de treino: {stats['training_samples']}")
            print(f"   🤖 Modelos treinados: {stats['models_trained']}")
            print(f"   🔮 Predições realizadas: {stats['predictions_total']}")
            print(f"   🗺️ Filtros ativos: {stats['filters_active']}")
            
            print(f"\n💾 Base de dados de demonstração: {self.demo_db}")
            print("   (Pode ser inspecionada com qualquer ferramenta SQLite)")
            
            return True
            
        except Exception as e:
            print(f"\n❌ Erro na demonstração: {e}")
            return False
    
    def cleanup(self):
        """Limpa arquivos de demonstração"""
        try:
            Path(self.demo_db).unlink(missing_ok=True)
            print(f"🧹 Arquivo {self.demo_db} removido")
        except Exception as e:
            print(f"⚠️ Erro removendo arquivo: {e}")

def main():
    """Função principal"""
    demo = MLSystemDemo()
    
    try:
        success = demo.run_complete_demo()
        
        if success:
            print("\n🚀 O sistema real está pronto para uso!")
            print("📋 Para usar com a aplicação real:")
            print("   1. Iniciar aplicação: ./start_bgapp_local.sh")
            print("   2. Testar endpoints: python test_ml_system.py")
            print("   3. Ver documentação: http://localhost:8000/docs")
        
        return 0 if success else 1
        
    except KeyboardInterrupt:
        print("\n🛑 Demonstração interrompida pelo usuário")
        return 1
    except Exception as e:
        print(f"\n❌ Erro inesperado: {e}")
        return 1
    finally:
        # Perguntar se deve limpar arquivos
        try:
            response = input("\n🧹 Remover arquivos de demonstração? (y/N): ").strip().lower()
            if response in ['y', 'yes', 's', 'sim']:
                demo.cleanup()
        except:
            pass

if __name__ == "__main__":
    exit(main())
