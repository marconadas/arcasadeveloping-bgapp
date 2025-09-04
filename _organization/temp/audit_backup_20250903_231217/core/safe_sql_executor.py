"""
Executor Seguro de SQL para BGAPP
Implementa proteção robusta contra SQL injection usando prepared statements e whitelist
"""

import re
import hashlib
from typing import Dict, List, Any, Optional, Tuple
from enum import Enum
import psycopg2
from psycopg2 import sql
import logging

from .logging_config import get_logger

logger = get_logger(__name__)

class QueryType(Enum):
    """Tipos de queries aprovadas"""
    SELECT_USERS = "select_users"
    SELECT_TABLES = "select_tables"
    SELECT_COLUMNS = "select_columns"
    SELECT_DATA = "select_data"
    SELECT_STATS = "select_stats"

class SafeSQLExecutor:
    """Executor seguro de SQL com proteção total contra injection"""
    
    def __init__(self):
        # Queries pré-aprovadas com prepared statements
        self.approved_queries = {
            QueryType.SELECT_USERS: {
                "sql": "SELECT id, username, email, role, is_active, created_at FROM users WHERE id = %s OR username = %s LIMIT %s",
                "description": "Buscar utilizadores por ID ou username",
                "max_params": 3,
                "allowed_tables": ["users"]
            },
            
            QueryType.SELECT_TABLES: {
                "sql": "SELECT table_name, table_schema FROM information_schema.tables WHERE table_schema = %s ORDER BY table_name LIMIT %s",
                "description": "Listar tabelas do schema",
                "max_params": 2,
                "allowed_tables": ["information_schema.tables"]
            },
            
            QueryType.SELECT_COLUMNS: {
                "sql": "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = %s AND table_schema = %s ORDER BY ordinal_position LIMIT %s",
                "description": "Listar colunas de uma tabela",
                "max_params": 3,
                "allowed_tables": ["information_schema.columns"]
            },
            
            QueryType.SELECT_DATA: {
                "sql": "SELECT * FROM {} WHERE {} = %s ORDER BY {} LIMIT %s",
                "description": "Buscar dados com filtro simples",
                "max_params": 2,
                "template": True,
                "allowed_tables": ["users", "logs", "config", "sessions"]
            },
            
            QueryType.SELECT_STATS: {
                "sql": "SELECT COUNT(*) as total, MAX(created_at) as latest FROM {} WHERE created_at >= %s",
                "description": "Estatísticas básicas de tabela",
                "max_params": 1,
                "template": True,
                "allowed_tables": ["users", "logs", "sessions"]
            }
        }
        
        # Tabelas permitidas para queries dinâmicas
        self.allowed_tables = {
            "users", "logs", "config", "sessions", "audit_log",
            "marine_data", "biodiversity", "oceanographic_data"
        }
        
        # Colunas permitidas para ORDER BY e WHERE
        self.allowed_columns = {
            "id", "username", "email", "created_at", "updated_at",
            "name", "title", "description", "status", "type",
            "latitude", "longitude", "depth", "temperature", "salinity"
        }
        
        # Operadores permitidos
        self.allowed_operators = {"=", "!=", "<", ">", "<=", ">=", "LIKE", "IN"}
    
    def validate_table_name(self, table_name: str) -> bool:
        """Validar nome de tabela"""
        if not table_name:
            return False
        
        # Apenas caracteres alfanuméricos e underscore
        if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', table_name):
            return False
        
        return table_name.lower() in self.allowed_tables
    
    def validate_column_name(self, column_name: str) -> bool:
        """Validar nome de coluna"""
        if not column_name:
            return False
        
        # Apenas caracteres alfanuméricos e underscore
        if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', column_name):
            return False
        
        return column_name.lower() in self.allowed_columns
    
    def validate_operator(self, operator: str) -> bool:
        """Validar operador SQL"""
        return operator.upper() in self.allowed_operators
    
    def execute_approved_query(self, 
                              query_type: QueryType, 
                              parameters: List[Any],
                              connection) -> Dict[str, Any]:
        """Executar query pré-aprovada com prepared statements"""
        
        if query_type not in self.approved_queries:
            raise ValueError(f"Tipo de query não aprovado: {query_type}")
        
        query_config = self.approved_queries[query_type]
        
        # Validar número de parâmetros
        if len(parameters) > query_config["max_params"]:
            raise ValueError(f"Muitos parâmetros: {len(parameters)} > {query_config['max_params']}")
        
        # Preparar query
        query_sql = query_config["sql"]
        
        try:
            cursor = connection.cursor()
            
            # Executar com prepared statement (seguro contra injection)
            cursor.execute(query_sql, parameters)
            
            if cursor.description:
                columns = [desc[0] for desc in cursor.description]
                rows = cursor.fetchall()
                result = {
                    "columns": columns,
                    "rows": [list(row) for row in rows],
                    "count": len(rows),
                    "query_type": query_type.value,
                    "safe_execution": True
                }
            else:
                result = {
                    "message": "Query executada com sucesso",
                    "count": 0,
                    "query_type": query_type.value,
                    "safe_execution": True
                }
            
            cursor.close()
            
            logger.info(
                "safe_sql_executed",
                query_type=query_type.value,
                rows_returned=result.get("count", 0),
                parameters_count=len(parameters)
            )
            
            return result
            
        except Exception as e:
            logger.error(
                "safe_sql_error",
                query_type=query_type.value,
                error=str(e),
                parameters_count=len(parameters)
            )
            raise
    
    def build_safe_select_query(self, 
                               table: str, 
                               columns: List[str] = None,
                               where_conditions: Dict[str, Any] = None,
                               order_by: str = None,
                               limit: int = 100) -> Tuple[str, List[Any]]:
        """Construir query SELECT segura usando sql.SQL"""
        
        # Validar tabela
        if not self.validate_table_name(table):
            raise ValueError(f"Nome de tabela inválido: {table}")
        
        # Validar colunas
        if columns:
            for column in columns:
                if not self.validate_column_name(column):
                    raise ValueError(f"Nome de coluna inválido: {column}")
        else:
            columns = ["*"]
        
        # Validar ORDER BY
        if order_by and not self.validate_column_name(order_by):
            raise ValueError(f"Coluna ORDER BY inválida: {order_by}")
        
        # Construir query usando psycopg2.sql (seguro)
        query_parts = [
            sql.SQL("SELECT"),
            sql.SQL(", ").join([sql.Identifier(col) if col != "*" else sql.SQL("*") for col in columns]),
            sql.SQL("FROM"),
            sql.Identifier(table)
        ]
        
        parameters = []
        
        # Adicionar WHERE conditions
        if where_conditions:
            where_parts = []
            for column, value in where_conditions.items():
                if not self.validate_column_name(column):
                    raise ValueError(f"Coluna WHERE inválida: {column}")
                
                where_parts.append(sql.SQL("{} = %s").format(sql.Identifier(column)))
                parameters.append(value)
            
            if where_parts:
                query_parts.extend([
                    sql.SQL("WHERE"),
                    sql.SQL(" AND ").join(where_parts)
                ])
        
        # Adicionar ORDER BY
        if order_by:
            query_parts.extend([
                sql.SQL("ORDER BY"),
                sql.Identifier(order_by)
            ])
        
        # Adicionar LIMIT
        query_parts.extend([
            sql.SQL("LIMIT %s")
        ])
        parameters.append(min(limit, 1000))  # Máximo 1000 registos
        
        # Construir query final
        final_query = sql.SQL(" ").join(query_parts)
        
        return final_query, parameters
    
    def execute_safe_select(self, 
                           connection,
                           table: str,
                           columns: List[str] = None,
                           where_conditions: Dict[str, Any] = None,
                           order_by: str = None,
                           limit: int = 100) -> Dict[str, Any]:
        """Executar SELECT seguro"""
        
        try:
            # Construir query segura
            query, parameters = self.build_safe_select_query(
                table, columns, where_conditions, order_by, limit
            )
            
            cursor = connection.cursor()
            
            # Executar com prepared statement
            cursor.execute(query, parameters)
            
            if cursor.description:
                columns = [desc[0] for desc in cursor.description]
                rows = cursor.fetchall()
                result = {
                    "columns": columns,
                    "rows": [list(row) for row in rows],
                    "count": len(rows),
                    "table": table,
                    "safe_execution": True,
                    "method": "prepared_statement"
                }
            else:
                result = {
                    "message": "Query executada com sucesso",
                    "count": 0,
                    "table": table,
                    "safe_execution": True,
                    "method": "prepared_statement"
                }
            
            cursor.close()
            
            logger.info(
                "safe_select_executed",
                table=table,
                rows_returned=result.get("count", 0),
                conditions=len(where_conditions) if where_conditions else 0
            )
            
            return result
            
        except Exception as e:
            logger.error(
                "safe_select_error",
                table=table,
                error=str(e)
            )
            raise
    
    def get_query_whitelist(self) -> Dict[str, Dict]:
        """Obter lista de queries aprovadas"""
        return {
            query_type.value: {
                "description": config["description"],
                "max_params": config["max_params"],
                "allowed_tables": config.get("allowed_tables", [])
            }
            for query_type, config in self.approved_queries.items()
        }
    
    def validate_query_hash(self, query: str, expected_hash: str) -> bool:
        """Validar hash de query para queries pré-aprovadas"""
        query_normalized = re.sub(r'\s+', ' ', query.strip().upper())
        actual_hash = hashlib.sha256(query_normalized.encode()).hexdigest()
        return actual_hash == expected_hash

# Instância global
safe_sql_executor = SafeSQLExecutor()

def get_safe_sql_executor() -> SafeSQLExecutor:
    """Obter instância do executor seguro"""
    return safe_sql_executor

if __name__ == "__main__":
    # Teste do executor seguro
    print("🛡️ Teste do Executor Seguro de SQL")
    print("=" * 50)
    
    executor = SafeSQLExecutor()
    
    # Teste 1: Validação de nomes
    print("\n1. 🔍 Testando validação de nomes...")
    
    valid_tables = ["users", "logs", "config"]
    invalid_tables = ["users; DROP TABLE", "../etc/passwd", "users--"]
    
    for table in valid_tables:
        valid = executor.validate_table_name(table)
        print(f"   {table}: {'✅ Válido' if valid else '❌ Inválido'}")
    
    for table in invalid_tables:
        valid = executor.validate_table_name(table)
        print(f"   {table}: {'❌ Aceito (erro!)' if valid else '✅ Rejeitado (correto)'}")
    
    # Teste 2: Construção de query segura
    print("\n2. 🔧 Testando construção de query...")
    try:
        query, params = executor.build_safe_select_query(
            table="users",
            columns=["id", "username", "email"],
            where_conditions={"role": "admin", "is_active": True},
            order_by="created_at",
            limit=10
        )
        print(f"   Query construída: {query.as_string(None)}")
        print(f"   Parâmetros: {params}")
        print("   ✅ Query segura construída")
    except Exception as e:
        print(f"   ❌ Erro: {e}")
    
    # Teste 3: Tentativa de injection
    print("\n3. 🚨 Testando proteção contra injection...")
    malicious_inputs = [
        "users; DROP TABLE users",
        "users' OR '1'='1",
        "../etc/passwd",
        "users UNION SELECT * FROM passwords"
    ]
    
    for malicious_input in malicious_inputs:
        try:
            valid = executor.validate_table_name(malicious_input)
            print(f"   {malicious_input[:20]}...: {'❌ Aceito (VULNERÁVEL!)' if valid else '✅ Rejeitado (seguro)'}")
        except Exception as e:
            print(f"   {malicious_input[:20]}...: ✅ Exceção (seguro) - {e}")
    
    print("\n✅ Teste do executor seguro concluído!")
