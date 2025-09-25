"""
Sistema de Sincronização Offline para BGAPP Angola
Gerencia coleta de dados em áreas remotas e sincronização posterior
"""

import json
import sqlite3
import hashlib
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import logging
import asyncio
import aiohttp
from dataclasses import dataclass, asdict
from enum import Enum


class SyncStatus(Enum):
    PENDING = "pending"
    SYNCING = "syncing" 
    SYNCED = "synced"
    ERROR = "error"
    CONFLICT = "conflict"


@dataclass
class OfflineRecord:
    """Estrutura de dados para registos offline"""
    id: str
    timestamp: str
    data_type: str  # 'observation', 'sample', 'measurement'
    content: Dict[str, Any]
    location: Tuple[float, float]  # (lat, lon)
    collector_id: str
    device_id: str
    sync_status: str = SyncStatus.PENDING.value
    sync_attempts: int = 0
    last_sync_attempt: Optional[str] = None
    hash: Optional[str] = None
    
    def __post_init__(self):
        if not self.hash:
            self.hash = self._calculate_hash()
    
    def _calculate_hash(self) -> str:
        """Calcular hash para detecção de duplicatas"""
        content_str = json.dumps(self.content, sort_keys=True)
        hash_input = f"{self.timestamp}_{self.data_type}_{content_str}_{self.location}"
        return hashlib.sha256(hash_input.encode()).hexdigest()[:16]


class OfflineSyncManager:
    """Gerenciador de sincronização offline"""
    
    def __init__(self, db_path: str = "bgapp_offline.db", api_base_url: str = "http://localhost:5080"):
        self.db_path = Path(db_path)
        self.api_base_url = api_base_url
        self.logger = logging.getLogger(__name__)
        
        # Configurações
        self.max_sync_attempts = 5
        self.sync_batch_size = 50
        self.retry_delay_hours = [1, 2, 6, 24, 72]  # Backoff exponencial
        
        self._init_database()
    
    def _init_database(self):
        """Inicializar base de dados SQLite local"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS offline_records (
                    id TEXT PRIMARY KEY,
                    timestamp TEXT NOT NULL,
                    data_type TEXT NOT NULL,
                    content TEXT NOT NULL,
                    latitude REAL NOT NULL,
                    longitude REAL NOT NULL,
                    collector_id TEXT NOT NULL,
                    device_id TEXT NOT NULL,
                    sync_status TEXT DEFAULT 'pending',
                    sync_attempts INTEGER DEFAULT 0,
                    last_sync_attempt TEXT,
                    hash TEXT UNIQUE,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS sync_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    record_id TEXT,
                    action TEXT,
                    status TEXT,
                    message TEXT,
                    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (record_id) REFERENCES offline_records (id)
                )
            """)
            
            # Índices para performance
            conn.execute("CREATE INDEX IF NOT EXISTS idx_sync_status ON offline_records (sync_status)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_timestamp ON offline_records (timestamp)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_hash ON offline_records (hash)")
    
    def store_record(self, record: OfflineRecord) -> bool:
        """Armazenar registo offline"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    INSERT OR REPLACE INTO offline_records 
                    (id, timestamp, data_type, content, latitude, longitude, 
                     collector_id, device_id, sync_status, sync_attempts, 
                     last_sync_attempt, hash)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    record.id, record.timestamp, record.data_type,
                    json.dumps(record.content), record.location[0], record.location[1],
                    record.collector_id, record.device_id, record.sync_status,
                    record.sync_attempts, record.last_sync_attempt, record.hash
                ))
                
                self._log_action(record.id, "store", "success", "Registo armazenado localmente")
                return True
                
        except sqlite3.IntegrityError as e:
            if "hash" in str(e):
                self.logger.warning(f"Registo duplicado detectado: {record.hash}")
                return False
            raise
        except Exception as e:
            self.logger.error(f"Erro ao armazenar registo: {e}")
            return False
    
    def get_pending_records(self, limit: int = None) -> List[OfflineRecord]:
        """Obter registos pendentes de sincronização"""
        query = """
            SELECT id, timestamp, data_type, content, latitude, longitude,
                   collector_id, device_id, sync_status, sync_attempts,
                   last_sync_attempt, hash
            FROM offline_records 
            WHERE sync_status = 'pending' 
            ORDER BY timestamp ASC
        """
        
        if limit:
            query += f" LIMIT {limit}"
        
        records = []
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(query)
            for row in cursor.fetchall():
                record = OfflineRecord(
                    id=row[0],
                    timestamp=row[1],
                    data_type=row[2],
                    content=json.loads(row[3]),
                    location=(row[4], row[5]),
                    collector_id=row[6],
                    device_id=row[7],
                    sync_status=row[8],
                    sync_attempts=row[9],
                    last_sync_attempt=row[10],
                    hash=row[11]
                )
                records.append(record)
        
        return records
    
    def update_sync_status(self, record_id: str, status: SyncStatus, message: str = ""):
        """Atualizar status de sincronização"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                UPDATE offline_records 
                SET sync_status = ?, last_sync_attempt = ?, sync_attempts = sync_attempts + 1
                WHERE id = ?
            """, (status.value, datetime.now().isoformat(), record_id))
            
            self._log_action(record_id, "sync_update", status.value, message)
    
    def _log_action(self, record_id: str, action: str, status: str, message: str):
        """Registar ação no log"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT INTO sync_log (record_id, action, status, message)
                VALUES (?, ?, ?, ?)
            """, (record_id, action, status, message))
    
    async def sync_single_record(self, record: OfflineRecord, session: aiohttp.ClientSession) -> bool:
        """Sincronizar um registo individual"""
        try:
            # Preparar dados para envio
            sync_data = {
                'id': record.id,
                'timestamp': record.timestamp,
                'data_type': record.data_type,
                'content': record.content,
                'location': {
                    'latitude': record.location[0],
                    'longitude': record.location[1]
                },
                'collector_id': record.collector_id,
                'device_id': record.device_id,
                'hash': record.hash,
                'source': 'offline_sync'
            }
            
            # Determinar endpoint baseado no tipo de dados
            endpoint_map = {
                'observation': '/collections/occurrences/items',
                'sample': '/collections/samples/items',
                'measurement': '/collections/measurements/items'
            }
            
            endpoint = endpoint_map.get(record.data_type, '/collections/data/items')
            url = f"{self.api_base_url}{endpoint}"
            
            # Enviar dados
            async with session.post(url, json=sync_data) as response:
                if response.status == 200 or response.status == 201:
                    self.update_sync_status(record.id, SyncStatus.SYNCED, "Sincronizado com sucesso")
                    return True
                elif response.status == 409:
                    # Conflito - registo já existe
                    self.update_sync_status(record.id, SyncStatus.CONFLICT, "Registo já existe no servidor")
                    return False
                else:
                    error_msg = f"Erro HTTP {response.status}: {await response.text()}"
                    self.update_sync_status(record.id, SyncStatus.ERROR, error_msg)
                    return False
                    
        except Exception as e:
            error_msg = f"Erro de sincronização: {str(e)}"
            self.update_sync_status(record.id, SyncStatus.ERROR, error_msg)
            self.logger.error(f"Erro ao sincronizar registo {record.id}: {e}")
            return False
    
    async def sync_batch(self, max_records: int = None) -> Dict[str, int]:
        """Sincronizar lote de registos"""
        if max_records is None:
            max_records = self.sync_batch_size
        
        pending_records = self.get_pending_records(max_records)
        
        if not pending_records:
            return {'total': 0, 'success': 0, 'error': 0, 'conflict': 0}
        
        results = {'total': len(pending_records), 'success': 0, 'error': 0, 'conflict': 0}
        
        # Criar sessão HTTP assíncrona
        timeout = aiohttp.ClientTimeout(total=30)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            
            # Processar registos em paralelo (limitado)
            semaphore = asyncio.Semaphore(5)  # Máximo 5 requisições simultâneas
            
            async def sync_with_semaphore(record):
                async with semaphore:
                    return await self.sync_single_record(record, session)
            
            # Executar sincronizações
            tasks = [sync_with_semaphore(record) for record in pending_records]
            sync_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Contar resultados
            for result in sync_results:
                if isinstance(result, Exception):
                    results['error'] += 1
                elif result:
                    results['success'] += 1
                else:
                    results['error'] += 1
        
        self.logger.info(f"Sincronização concluída: {results}")
        return results
    
    def get_sync_statistics(self) -> Dict[str, Any]:
        """Obter estatísticas de sincronização"""
        with sqlite3.connect(self.db_path) as conn:
            # Contar por status
            status_counts = {}
            cursor = conn.execute("""
                SELECT sync_status, COUNT(*) 
                FROM offline_records 
                GROUP BY sync_status
            """)
            for status, count in cursor.fetchall():
                status_counts[status] = count
            
            # Estatísticas gerais
            cursor = conn.execute("""
                SELECT 
                    COUNT(*) as total,
                    MIN(timestamp) as oldest,
                    MAX(timestamp) as newest,
                    AVG(sync_attempts) as avg_attempts
                FROM offline_records
            """)
            general_stats = cursor.fetchone()
            
            # Estatísticas por tipo de dados
            cursor = conn.execute("""
                SELECT data_type, COUNT(*), AVG(sync_attempts)
                FROM offline_records
                GROUP BY data_type
            """)
            type_stats = {}
            for data_type, count, avg_attempts in cursor.fetchall():
                type_stats[data_type] = {
                    'count': count,
                    'avg_sync_attempts': round(avg_attempts or 0, 2)
                }
            
            # Registos com erro que precisam atenção
            cursor = conn.execute("""
                SELECT COUNT(*) 
                FROM offline_records 
                WHERE sync_status = 'error' AND sync_attempts >= ?
            """, (self.max_sync_attempts,))
            failed_records = cursor.fetchone()[0]
            
        return {
            'status_counts': status_counts,
            'total_records': general_stats[0] or 0,
            'oldest_record': general_stats[1],
            'newest_record': general_stats[2],
            'average_sync_attempts': round(general_stats[3] or 0, 2),
            'by_data_type': type_stats,
            'failed_records_needing_attention': failed_records,
            'last_updated': datetime.now().isoformat()
        }
    
    def export_offline_data(self, output_file: str, status_filter: str = None) -> int:
        """Exportar dados offline para arquivo JSON"""
        query = """
            SELECT id, timestamp, data_type, content, latitude, longitude,
                   collector_id, device_id, sync_status, sync_attempts,
                   last_sync_attempt, hash, created_at
            FROM offline_records
        """
        
        params = []
        if status_filter:
            query += " WHERE sync_status = ?"
            params.append(status_filter)
        
        query += " ORDER BY timestamp"
        
        records = []
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(query, params)
            for row in cursor.fetchall():
                record = {
                    'id': row[0],
                    'timestamp': row[1],
                    'data_type': row[2],
                    'content': json.loads(row[3]),
                    'location': {'latitude': row[4], 'longitude': row[5]},
                    'collector_id': row[6],
                    'device_id': row[7],
                    'sync_status': row[8],
                    'sync_attempts': row[9],
                    'last_sync_attempt': row[10],
                    'hash': row[11],
                    'created_at': row[12]
                }
                records.append(record)
        
        # Criar GeoJSON se houver coordenadas
        if records and all('location' in r for r in records):
            geojson = {
                'type': 'FeatureCollection',
                'metadata': {
                    'source': 'BGAPP Offline Sync Manager',
                    'export_date': datetime.now().isoformat(),
                    'total_records': len(records),
                    'status_filter': status_filter
                },
                'features': []
            }
            
            for record in records:
                feature = {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Point',
                        'coordinates': [record['location']['longitude'], record['location']['latitude']]
                    },
                    'properties': {k: v for k, v in record.items() if k != 'location'}
                }
                geojson['features'].append(feature)
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(geojson, f, ensure_ascii=False, indent=2)
        else:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(records, f, ensure_ascii=False, indent=2)
        
        return len(records)
    
    def cleanup_old_synced_records(self, days_old: int = 30) -> int:
        """Limpar registos antigos já sincronizados"""
        cutoff_date = (datetime.now() - timedelta(days=days_old)).isoformat()
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                DELETE FROM offline_records 
                WHERE sync_status = 'synced' AND timestamp < ?
            """, (cutoff_date,))
            
            deleted_count = cursor.rowcount
            
            # Limpar logs órfãos
            conn.execute("""
                DELETE FROM sync_log 
                WHERE record_id NOT IN (SELECT id FROM offline_records)
            """)
        
        self.logger.info(f"Removidos {deleted_count} registos sincronizados antigos")
        return deleted_count
    
    async def auto_sync_daemon(self, interval_minutes: int = 15):
        """Daemon de sincronização automática"""
        self.logger.info(f"Iniciando daemon de sincronização (intervalo: {interval_minutes}min)")
        
        while True:
            try:
                # Verificar conectividade (simplificado)
                async with aiohttp.ClientSession() as session:
                    try:
                        async with session.get(f"{self.api_base_url}/health", timeout=5) as response:
                            if response.status == 200:
                                # Servidor disponível, tentar sincronizar
                                results = await self.sync_batch()
                                if results['total'] > 0:
                                    self.logger.info(f"Sincronização automática: {results}")
                    except:
                        self.logger.debug("Servidor indisponível para sincronização automática")
                
                # Aguardar próximo ciclo
                await asyncio.sleep(interval_minutes * 60)
                
            except Exception as e:
                self.logger.error(f"Erro no daemon de sincronização: {e}")
                await asyncio.sleep(60)  # Aguardar 1 minuto em caso de erro


# Utilitários para integração
def create_observation_record(
    species: str,
    location: Tuple[float, float],
    collector_id: str,
    device_id: str,
    **kwargs
) -> OfflineRecord:
    """Criar registo de observação offline"""
    
    content = {
        'scientificName': species,
        'eventDate': datetime.now().isoformat(),
        'decimalLatitude': location[0],
        'decimalLongitude': location[1],
        'basisOfRecord': 'HumanObservation',
        'source': 'bgapp_mobile',
        **kwargs
    }
    
    return OfflineRecord(
        id=str(uuid.uuid4()),
        timestamp=datetime.now().isoformat(),
        data_type='observation',
        content=content,
        location=location,
        collector_id=collector_id,
        device_id=device_id
    )


async def main():
    """Exemplo de uso"""
    sync_manager = OfflineSyncManager()
    
    # Criar registo de teste
    test_record = create_observation_record(
        species="Tursiops truncatus",
        location=(-8.8, 13.2),
        collector_id="researcher_001",
        device_id="mobile_001",
        individualCount=3,
        behavior="feeding"
    )
    
    # Armazenar offline
    sync_manager.store_record(test_record)
    
    # Sincronizar
    results = await sync_manager.sync_batch()
    print(f"Resultados da sincronização: {results}")
    
    # Estatísticas
    stats = sync_manager.get_sync_statistics()
    print(f"Estatísticas: {json.dumps(stats, indent=2)}")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
