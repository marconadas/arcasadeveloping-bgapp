# gfw-integration - Contratos e Interfaces

## 🔌 APIs
### GFW Proxy Endpoints
```yaml
openapi: 3.0.0
info:
  title: GFW Integration API
  version: 1.0.0
  description: Proxy para Global Fishing Watch API v3
servers:
  - url: https://bgapp-gfw-proxy.majearcasa.workers.dev
paths:
  /gfw/vessels:
    get:
      summary: Buscar embarcações nas águas angolanas
      parameters:
        - name: datasets
          in: query
          schema:
            type: string
            default: "public-global-vessels:v3.0"
        - name: where
          in: query
          schema:
            type: string
            default: 'flag = "AO"'
        - name: limit
          in: query
          schema:
            type: integer
            default: 50
      responses:
        '200':
          description: Lista de embarcações
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/VesselResponse'
        '403':
          description: Sem permissão para dataset
        '503':
          description: Token GFW não configurado

  /gfw/4wings/report/ais-vessel-presence:
    get:
      summary: Relatório de presença de embarcações
      parameters:
        - name: region
          in: query
          schema:
            type: string
            default: "angola"
      responses:
        '200':
          description: Dados de presença de embarcações
```

### WebSockets
```yaml
# Exemplo de eventos WebSocket
events:
  - name: [evento]
    description: [Descrição]
    payload:
      type: object
      properties:
        [propriedade]: [tipo]
```

## 📋 Contratos de Dados
### Schemas
```yaml
components:
  schemas:
    VesselResponse:
      type: object
      properties:
        entries:
          type: array
          items:
            $ref: '#/components/schemas/Vessel'
        total:
          type: integer
        limit:
          type: integer

    Vessel:
      type: object
      properties:
        id:
          type: string
          description: ID único da embarcação
        vesselId:
          type: string
          description: ID interno da embarcação
        name:
          type: string
          description: Nome da embarcação
        flag:
          type: string
          description: Bandeira da embarcação (ISO 2)
        vesselType:
          type: string
          enum: [fishing, carrier, support, passenger]
        imo:
          type: string
          description: Número IMO
        callsign:
          type: string
          description: Sinal de chamada
        firstTransmissionDate:
          type: string
          format: date-time
        lastTransmissionDate:
          type: string
          format: date-time
        geom:
          type: object
          description: Geometria GeoJSON da localização

    GFWAlert:
      type: object
      properties:
        id:
          type: string
        type:
          type: string
          enum: [illegal_fishing, protected_area, encounters]
        severity:
          type: string
          enum: [low, medium, high]
        location:
          type: object
          properties:
            lat:
              type: number
              format: float
            lon:
              type: number
              format: float
        timestamp:
          type: string
          format: date-time
        vesselCount:
          type: integer
        description:
          type: string

    GFWStats:
      type: object
      properties:
        totalVessels:
          type: integer
        activeAlerts:
          type: integer
        protectedAreaViolations:
          type: integer
        lastUpdate:
          type: string
          format: date-time
        dataUsage:
          type: object
          properties:
            current:
              type: integer
            limit:
              type: integer
```

## 🔄 Fluxos de Integração
### Fluxo de Carregamento de Dados
1. **Inicialização do Dashboard**
   - Dashboard solicita dados ao componente GFWManagement
   - Componente verifica token GFW válido
   - Inicia carregamento com estado loading=true

2. **Busca de Embarcações**
   - Chama `/gfw/vessels` com parâmetros Angola
   - Proxy encaminha para GFW API v3 com autenticação
   - Recebe lista de embarcações ativas

3. **Busca de Alertas**
   - Chama `/gfw/4wings/report/ais-vessel-presence`
   - Analisa dados para detectar atividades suspeitas
   - Gera alertas baseados em padrões

4. **Processamento de Dados**
   - Transforma dados GFW para formato interno
   - Calcula estatísticas (total embarcações, alertas)
   - Atualiza estado do componente

5. **Tratamento de Erros**
   - 403: Exibe mensagem sobre permissões limitadas
   - 503: Mostra erro de configuração de token
   - Timeout: Implementa retry automático

### Fluxo de Atualização Automática
1. Timer dispara a cada 5 minutos (configurável)
2. Repete fluxo de carregamento em background
3. Atualiza UI apenas se há dados novos
4. Mantém estado de loading=false durante atualizações

## 📝 Notas de Implementação
- **Rate Limiting:** Máximo 120 requests/hora para não exceder limite GFW
- **Cache:** Implementar cache local de 2 minutos para requests repetidos
- **Fallback:** Se API falha, manter últimos dados válidos
- **Permissões:** Sistema deve funcionar com datasets públicos se privados não disponíveis
- **Angola Focus:** Todos os requests filtrados para águas territoriais angolanas
