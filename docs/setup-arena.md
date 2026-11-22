# Montagem da Arena

Como o pipe Arena (307434666) foi configurado em 22/11/2026, pela API GraphQL, no GraphiQL da Pipefy (https://app.pipefy.com/graphiql). As mutations abaixo recriam a mesma estrutura num pipe novo. Os ids são os da Arena e mudam num pipe novo.

O pipe foi criado pela interface com as três fases padrão (Inbox, Doing e Done). As fases padrão foram renomeadas, e as demais foram criadas com `index` entre elas, para ficarem na ordem certa.

## Estrutura

| Fase | Id | `done` | Pode mover para |
| --- | --- | --- | --- |
| Não iniciada | 344739162 | não | Quartas de final |
| Quartas de final | 344739163 | não | Semifinal, Cemitério das quartas |
| Cemitério das quartas | 344803533 | sim | — |
| Semifinal | 344803534 | não | Final, Cemitério da semifinal |
| Cemitério da semifinal | 344803535 | sim | — |
| Final | 344803536 | não | Campeões, Cemitério da final |
| Cemitério da final | 344803537 | sim | — |
| Campeões | 344739164 | sim | — |

Formulário inicial (fase 344739161), todos obrigatórios:

| `field.id` | Rótulo | Tipo | Conteúdo |
| --- | --- | --- | --- |
| `titulo` | Título | `short_text` | "Wakanda #4 · Batman". É o campo de título do card. |
| `heroi` | Herói | `short_text` | Nome do herói, igual ao enviado ao simulador |
| `torneio` | Torneio | `short_text` | Slug do torneio, como `wakanda-4` |
| `posicao` | Posição | `number` | Posição fixa na chave, de 1 a 8 |

## Pontos da API que pesaram

- **Transições entre fases.** Cada fase tem a lista de fases para onde um card pode ser movido (`cards_can_be_moved_to_phases`). O padrão liga só as fases vizinhas. Sem configurar as transições, o flow não conseguiria mover um card das quartas direto para a semifinal.
- **O título do card vem de um único campo** (`title_field_id` no `updatePipe`). Por isso existe o campo Título, montado pelo flow Início.
- **O `field.id` nasce do rótulo.** Os campos foram criados com rótulos sem acento (`Heroi`, `Posicao`, `Titulo`), para gerar ids limpos, e depois renomeados com acento. O id não muda quando o rótulo muda.
- **O `updatePhase` exige o `name`,** mesmo quando só a descrição muda.

## Mutations

Fases: renomear as padrão e criar as demais.

```graphql
mutation {
  a: updatePhase(input: {id: 344739162, name: "Não iniciada", done: false}) { phase { id } }
  b: updatePhase(input: {id: 344739163, name: "Quartas de final", done: false}) { phase { id } }
  c: updatePhase(input: {id: 344739164, name: "Campeões", done: true}) { phase { id } }
  d: createPhase(input: {pipe_id: 307434666, name: "Cemitério das quartas", done: true, index: 2.1, connectNeighbors: false}) { phase { id } }
  e: createPhase(input: {pipe_id: 307434666, name: "Semifinal", done: false, index: 2.2, connectNeighbors: false}) { phase { id } }
  f: createPhase(input: {pipe_id: 307434666, name: "Cemitério da semifinal", done: true, index: 2.3, connectNeighbors: false}) { phase { id } }
  g: createPhase(input: {pipe_id: 307434666, name: "Final", done: false, index: 2.4, connectNeighbors: false}) { phase { id } }
  h: createPhase(input: {pipe_id: 307434666, name: "Cemitério da final", done: true, index: 2.5, connectNeighbors: false}) { phase { id } }
}
```

Transições:

```graphql
mutation {
  a: updatePhaseJumps(input: {phaseId: 344739162, targetPhaseIds: [344739163]}) { clientMutationId }
  b: updatePhaseJumps(input: {phaseId: 344739163, targetPhaseIds: [344803534, 344803533]}) { clientMutationId }
  c: updatePhaseJumps(input: {phaseId: 344803534, targetPhaseIds: [344803536, 344803535]}) { clientMutationId }
  d: updatePhaseJumps(input: {phaseId: 344803536, targetPhaseIds: [344739164, 344803537]}) { clientMutationId }
  e: updatePhaseJumps(input: {phaseId: 344739164, targetPhaseIds: []}) { clientMutationId }
}
```

Campos do formulário inicial e campo de título:

```graphql
mutation {
  a: createPhaseField(input: {phase_id: 344739161, type: "short_text", label: "Titulo", required: true}) { phase_field { id uuid } }
  b: createPhaseField(input: {phase_id: 344739161, type: "short_text", label: "Heroi", required: true}) { phase_field { id uuid } }
  c: createPhaseField(input: {phase_id: 344739161, type: "short_text", label: "Torneio", required: true}) { phase_field { id uuid } }
  d: createPhaseField(input: {phase_id: 344739161, type: "number", label: "Posicao", required: true}) { phase_field { id uuid } }
}
```

```graphql
mutation {
  a: updatePhaseField(input: {id: "titulo", uuid: "<uuid do campo>", label: "Título"}) { phase_field { id label } }
  b: updatePhaseField(input: {id: "heroi", uuid: "<uuid do campo>", label: "Herói"}) { phase_field { id label } }
  c: updatePhaseField(input: {id: "posicao", uuid: "<uuid do campo>", label: "Posição"}) { phase_field { id label } }
  t: updatePipe(input: {id: 307434666, title_field_id: "titulo"}) { pipe { title_field { id } } }
}
```

As descrições das fases foram preenchidas com `updatePhase` (com `name`, `done` e `description`).
