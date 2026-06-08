# Modelo de Dados

Este é o núcleo do app de custos para impressão 3D.

## Entidades principais

- `households`
  - agrupa a família/equipe que compartilha os dados

- `users`
  - pessoas que usam o sistema
  - cada usuário pertence a uma `household`

- `printers`
  - impressoras cadastradas
  - guardam preço de compra, potência média e vida útil estimada

- `materials`
  - tipos de material, como PLA, PETG, ABS
  - guardam densidade, diâmetro e temperaturas comuns

- `material_lots`
  - lotes físicos de material, como uma bobina específica
  - permitem custo real por compra, não só preço médio

- `energy_rates`
  - custo do kWh ao longo do tempo

- `cost_settings`
  - parâmetros globais de custo da casa
  - aqui entram mão de obra, overhead, margem padrão e subsídio de frete

- `packaging_items`
  - caixas, etiquetas, saco plástico, fita e itens semelhantes

- `sales_channels`
  - canais de venda, como WhatsApp, Mercado Livre, loja própria
  - guardam taxas fixas e percentuais

- `products`
  - catálogo do que vocês vendem
  - cada item pode ter uma margem alvo

- `print_jobs`
  - execução real ou planejada de uma peça
  - concentra tempo, material, falha, pós-processo e impressora usada

- `print_job_packaging_items`
  - embalagem vinculada a cada trabalho de impressão

- `orders`
  - pedido vendido para um cliente

- `order_items`
  - itens vendidos em cada pedido

- `expenses`
  - despesas gerais fora do custo direto de produção

## Como o custo é pensado

O custo de uma peça pode ser estimado por:

- material usado
- energia consumida
- depreciação da impressora
- pós-processo
- embalagem
- taxa do canal
- frete subsidiado
- despesas gerais

## Views úteis

- `v_print_job_cost_estimate`
  - calcula uma base de custo para cada trabalho
  - já inclui mão de obra, energia, depreciação e parâmetros da casa

- `v_order_profit`
  - resume receita bruta e custo estimado por pedido

## Próxima fase

Depois deste modelo, o passo natural é:

1. gerar o backend com CRUD básico
2. ligar o backend ao Postgres
3. criar telas simples para cadastros e simulação de custo
