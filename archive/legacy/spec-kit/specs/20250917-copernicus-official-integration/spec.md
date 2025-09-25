# Especificação: Copernicus Official Integration

## Status
- **Status**: Em Desenvolvimento
- **Criado em**: 2025-09-17
- **Última atualização**: 2025-09-17

## Resumo Executivo

A análise da documentação oficial do Copernicus Data Space Ecosystem (CDSE) revelou importantes discrepâncias na nossa implementação atual:

1. **TOTP não é mencionado na documentação de Subscriptions** - apenas para autenticação manual
2. **Autenticação para APIs usa token simples** sem necessidade de TOTP para chamadas programáticas
3. **Sistema de Subscriptions oficial** oferece PUSH e PULL sem requisitos de TOTP

## Problema Identificado

### Implementação Atual (Instável)
- Usa TOTP em todas as requisições de API
- Depende de geração automática de TOTP via secret Base32
- Falhas frequentes por sincronização de tempo ou expiração de TOTP
- Complexidade desnecessária para integração automatizada

### Documentação Oficial
- TOTP apenas para login manual via interface web
- APIs usam token bearer padrão após autenticação inicial
- Subscriptions funcionam com webhooks (PUSH) ou filas (PULL)
- Método mais estável e confiável

## Requisitos Funcionais

### RF01: Autenticação Simplificada
- Remover dependência de TOTP para chamadas de API
- Implementar autenticação padrão: username + password → access_token
- Cache de tokens com renovação automática antes da expiração

### RF02: Sistema de Subscriptions
- Implementar PUSH subscriptions para receber notificações em tempo real
- Configurar webhook endpoint para receber eventos do Copernicus
- Filtros por área geográfica (Angola EEZ) e tipo de produto

### RF03: Gestão de Tokens
- Implementar refresh token para renovação automática
- Cache distribuído para tokens em ambiente Cloudflare Workers
- Fallback para re-autenticação se necessário

## Requisitos Não-Funcionais

### RNF01: Confiabilidade
- Taxa de sucesso de autenticação > 99.9%
- Recuperação automática de falhas de token
- Logs detalhados para troubleshooting

### RNF02: Performance
- Tempo de autenticação < 2 segundos
- Cache de tokens por pelo menos 50 minutos (token válido por 60 min)
- Renovação proativa 5 minutos antes da expiração

### RNF03: Segurança
- Credenciais armazenadas em variáveis de ambiente
- Tokens nunca expostos em logs ou respostas
- HTTPS obrigatório para todas as comunicações

## Casos de Uso

### UC01: Autenticação Inicial
```
Ator: Sistema BGAPP
Pré-condições: Credenciais configuradas em env vars
Fluxo:
1. Sistema envia POST para /auth/realms/CDSE/protocol/openid-connect/token
2. Payload: client_id=cdse-public, grant_type=password, username, password
3. Recebe access_token e refresh_token
4. Armazena tokens em cache com TTL
Pós-condições: Sistema autenticado e pronto para fazer chamadas
```

### UC02: Criar Subscription
```
Ator: Sistema BGAPP
Pré-condições: Token válido em cache
Fluxo:
1. POST para /odata/v1/Subscriptions
2. Configurar filtros para Angola EEZ e produtos marinhos
3. Tipo: PUSH com webhook endpoint
4. Receber subscription ID
Pós-condições: Sistema recebendo notificações automáticas
```

### UC03: Processar Notificação
```
Ator: Webhook Copernicus
Pré-condições: Subscription ativa
Fluxo:
1. Copernicus envia POST para nosso webhook
2. Validar payload e extrair informações do produto
3. Verificar se produto está dentro da Angola EEZ
4. Processar e armazenar metadados
5. Retornar 200 OK
Pós-condições: Novo produto catalogado no sistema
```

## Definição de Pronto

- [ ] Autenticação sem TOTP implementada e testada
- [ ] Sistema de cache de tokens funcionando
- [ ] PUSH subscriptions configuradas para Angola EEZ
- [ ] Webhook endpoint recebendo e processando notificações
- [ ] Documentação atualizada com novo fluxo
- [ ] Testes de integração passando
- [ ] Monitoramento configurado para taxa de sucesso

## Métricas de Sucesso

1. **Taxa de Disponibilidade**: > 99.9% de uptime na integração
2. **Latência de Notificações**: < 5 segundos entre evento e processamento
3. **Cobertura de Dados**: 100% dos produtos Sentinel na Angola EEZ capturados
4. **Redução de Erros**: < 0.1% de falhas de autenticação

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| API do Copernicus mudar | Baixa | Alto | Monitorar changelog, testes automatizados |
| Limite de rate da API | Média | Médio | Implementar backoff exponencial |
| Webhook não confiável | Baixa | Alto | Implementar retry e dead letter queue |
| Token expirar durante uso | Baixa | Baixo | Renovação proativa, retry automático |

## Notas de Implementação

1. **Remover todo código TOTP** dos workers e clientes
2. **Simplificar fluxo de autenticação** para username/password apenas
3. **Implementar webhook handler** robusto com validação
4. **Configurar Cloudflare Workers** para receber webhooks
5. **Atualizar STAC catalog** com novos produtos automaticamente
