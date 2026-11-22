# Flows do Integration Hub

Os dois flows ficam na aba Integrations do pipe 307434674. Esta pasta guarda o código das etapas Code e a configuração de cada etapa, para conferir o que roda no Hub ou para remontar os flows. O código de cada etapa é o mesmo que está colado no Hub.

Todas as chamadas à Pipefy usam a ação **Custom API Call** do conector Pipefy, com a conexão da Service Account (D8): `POST https://api.pipefy.com/graphql`, corpo JSON. As etapas Code montam as mutations, e a Custom API Call só as executa (D13).

As referências entre etapas usam o nome interno do Hub: `trigger` é o gatilho, e as ações são `step_1`, `step_2`... na ordem em que foram criadas.

## Torneio - Início

Gatilho: **Manual Trigger**. Depois de publicado, o torneio começa pelo botão **Run Flow** do editor.

| # | Etapa | Peça | Configuração |
| --- | --- | --- | --- |
| 1 | Manual Trigger | Gatilho | — |
| 2 | Ler heróis e Arena (`step_1`) | Custom API Call | corpo: a consulta abaixo |
| 3 | Sortear chave (`step_2`) | Code | [inicio/sortear-chave.js](inicio/sortear-chave.js); entrada `read` = body da etapa 2 |
| 4 | Criar cards na Arena (`step_3`) | Custom API Call | corpo: `{{step_2['output']['payload']}}` |
| 5 | Preparar quartas (`step_4`) | Code | [inicio/preparar-quartas.js](inicio/preparar-quartas.js); entradas `draw` = saída da etapa 3, `created` = body da etapa 4 |
| 6 | Mover para as quartas (`step_5`) | Custom API Call | corpo: `{{step_4['output']['payload']}}` |
| 7 | Disparar quartas (`step_6`) | Code | [inicio/disparar-quartas.js](inicio/disparar-quartas.js); entradas `draw` = saída da etapa 3, `moved` = body da etapa 6 |

Consulta da etapa 2:

```json
{"query": "{ pipe(id: 307434666) { cards_count } table(id: 307434675) { table_records(first: 50) { edges { node { record_fields { field { id } value } } } } } }"}
```

## Torneio - Resultado

Gatilho: **Catch Webhook**, sem autenticação. A URL do webhook é o `url_retorno` enviado ao simulador e está fixa no código das etapas de disparo.

| # | Etapa | Peça | Configuração |
| --- | --- | --- | --- |
| 1 | Catch Webhook | Gatilho | autenticação: None |
| 2 | Ler partidas em andamento (`step_1`) | Custom API Call | corpo: a consulta abaixo |
| 3 | Validar resultado (`step_2`) | Code | [resultado/validar-resultado.js](resultado/validar-resultado.js); entradas `identificador` e `winner` = body do gatilho, `read` = body da etapa 2 |
| 4 | Router (`step_3`) | Router | branch "Resultado válido": `valid` da etapa 3 é verdadeiro; senão, Otherwise (termina sem efeito) |
| 5 | Mover cards (`step_4`) | Custom API Call | corpo: `{{step_2['output']['payload']}}` |
| 6 | Disparar próxima partida (`step_5`) | Code | [resultado/disparar-proxima-partida.js](resultado/disparar-proxima-partida.js); entradas `decision` = saída da etapa 3, `moved` = body da etapa 5 |

Consulta da etapa 2 (as três fases de rodada da Arena):

```json
{"query": "fragment c on Card { id started_current_phase_at fields { field { id } value } } { q: phase(id: 344739163) { cards(first: 50) { edges { node { ...c } } } } s: phase(id: 344803534) { cards(first: 50) { edges { node { ...c } } } } f: phase(id: 344803536) { cards(first: 50) { edges { node { ...c } } } } }"}
```

## Cuidados ao montar no Hub

- **Referência entre etapas pelo seletor de dados.** Uma referência digitada à mão num campo de texto só vale depois que o campo perde o foco e o flow é salvo. A forma segura é inserir pelo seletor de dados, que exige que a etapa de origem já tenha uma saída de teste.
- **Etapa sem saída de teste.** Para gerar uma saída de exemplo sem efeito colateral, o corpo da Custom API Call pode ser trocado por `{"query": "{ me { id } }"}`, testado e depois restaurado.
- **Colar código.** O editor do Hub autocompleta chaves e indentação ao digitar. O código deve ser colado, não digitado.
- **Saída inteira de uma etapa Code.** Ela pode chegar como o objeto retornado ou embrulhada em `{ output }`. O código trata os dois casos.
