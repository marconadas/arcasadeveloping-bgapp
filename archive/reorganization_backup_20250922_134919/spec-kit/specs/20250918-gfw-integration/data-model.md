# gfw-integration - Modelo de Dados

## 🗄️ Entidades Principais

### [Entidade 1]
```sql
CREATE TABLE [entidade_1] (
    id SERIAL PRIMARY KEY,
    [campo_1] [tipo] NOT NULL,
    [campo_2] [tipo],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Campos:**
- `id`: Identificador único
- `[campo_1]`: [Descrição]
- `[campo_2]`: [Descrição]

### [Entidade 2]
```sql
CREATE TABLE [entidade_2] (
    id SERIAL PRIMARY KEY,
    [entidade_1]_id INTEGER REFERENCES [entidade_1](id),
    [campo_1] [tipo] NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔗 Relacionamentos
- **[Entidade 1]** → **1:N** → **[Entidade 2]**
- **[Entidade 2]** → **N:1** → **[Entidade 1]**

## 📊 Índices
```sql
CREATE INDEX idx_[entidade_1]_[campo] ON [entidade_1]([campo]);
CREATE INDEX idx_[entidade_2]_[campo] ON [entidade_2]([campo]);
```

## 🔄 Migrações
### Migração 001 - Criação inicial
```sql
-- [Descrição da migração]
```

## 📝 Notas
- [Nota 1]
- [Nota 2]
