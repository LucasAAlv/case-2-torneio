# CLAUDE.md

Guia para agentes (Claude Code) que trabalham neste repositório. Documentação, comentários e mensagens em **português do Brasil**; nomes no código (variáveis, funções, arquivos) em inglês.

## Objetivo

Receitas (flows) do **Integration Hub** da Pipefy que conduzem sozinhas um torneio mata-mata entre os 8 heróis do database 307434675:

- disparam as batalhas no Simulador de Batalhas externo;
- recebem os resultados assíncronos num webhook;
- alocam cada vencedor na chave seguinte;
- no fim, criam um card no pipe 307434674 com o nome do Lucas e o do campeão.

Os flows vivem no Hub, dentro do pipe 307434674. O estado do torneio fica no pipe **Arena** (307434666), com um card por herói em cada torneio (D1 em [docs/decisoes.md](docs/decisoes.md)). Este repositório guarda o que dá para versionar: documentação, payloads e o export dos flows (D12).

Antes de propor qualquer mudança de desenho, leia:

- [docs/enunciado.md](docs/enunciado.md): requisitos R1 a R9;
- [docs/decisoes.md](docs/decisoes.md): diretrizes e decisões, com alternativas e motivos;
- [docs/arquitetura.md](docs/arquitetura.md): chave, estado na Arena, os dois flows, concorrência, custo e limitações;
- [docs/setup-arena.md](docs/setup-arena.md): fases, transições e campos da Arena, com os ids;
- [docs/pesquisa-integration-hub.md](docs/pesquisa-integration-hub.md): o que o Hub oferece, a cobrança por tarefa e os limites;
- [docs/simulador.md](docs/simulador.md): contrato do simulador e comportamento observado;
- [docs/testes.md](docs/testes.md): torneios de teste e o que aconteceu em cada um.

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `docs/` | Documentação. Ela é atualizada junto com cada mudança, e não só no fim. |
| `flows/` | Configuração dos dois flows e código das etapas Code, igual ao que está colado no Hub |
| `payloads/simulator/` | Exemplos da requisição ao simulador e do callback |

Pastas novas (scripts de teste, export dos flows, código de etapas Code) entram com a decisão que as justifica.

## Fatos que não podem ser quebrados

- **Simulador:**
  - **só aceita POST**; com GET responde 200 `{}` e não processa;
  - o callback chega **fora de ordem**, em até uns 20 s, **sem autenticação**;
  - o campo de volta é **`identificador`**, não `identificador_da_rodada`;
  - o perdedor não vem no callback.
- **Webhook do Hub:** responde 200 na hora e processa em segundo plano. O sufixo `/test` gera dados de exemplo sem executar o flow publicado.
- **Cobrança:** o Hub cobra por **tarefa bem-sucedida**. Gatilho, Router e o nó do Loop não contam; HTTP, conector, Code, Storage e Data Helpers contam.
- **Flows publicados:** "Torneio - Início" (Manual Trigger) e "Torneio - Resultado" (webhook `https://ipaas.pipefy.com/api/v1/webhooks/kWlKlvHypIipDk8w7Gyq9`, que é o `url_retorno`). O código em `flows/` é igual ao colado no Hub: toda mudança entra nos dois lugares, e o flow precisa ser republicado.
- **Storage:** o desenho não usa. O Put sobrescreve, e não há operação atômica documentada. Nunca faça ler, alterar e gravar num valor que dois callbacks possam tocar ao mesmo tempo.
- **Concorrência:** até 10 execuções simultâneas por pipe. As quatro quartas podem voltar juntas.
- **Pipe 307434674:** uma fase (Champions). O formulário inicial tem dois campos obrigatórios, "Process Participant Name" e "Champion Name". Ele não recebe fases nem campos novos: só o card final de cada torneio (D2).
- **Pipe Arena (307434666):** guarda o estado. A fase de cada card é a posição do herói no torneio, e a Posição (1 a 8) nunca muda (D1, D3).
- **Acesso à Pipefy:** conector Pipefy com a conexão da Service Account (D8). O seletor de pipe das ações lista os pipes que a conta enxerga, e ela é membro só da Arena, do 307434674 e do database 307434675.

## Como trabalhar aqui

- **O Lucas decide e o agente executa.** Para onde guardar o estado, quantos flows usar, peça nova ou mudança no modelo de dados: proponha as opções com os trade-offs e espere a decisão.
- **Não invente comportamento do Hub.** O que não estiver em `docs/` como visto ou testado deve ser conferido na Central de Ajuda (https://help.pipefy.com) ou testado pelo Lucas num flow de rascunho.
- **Os dados da org não são nossos.** Nada de criar, alterar ou apagar cards, pipes, databases ou flows sem pedido explícito. Toda alteração de teste é revertida.
- **Segredos nunca entram no repositório**, que é público. As credenciais da Service Account ficam só na conexão do Hub, e outros tokens ficam nas Variables do Hub ou em `.env` (já no `.gitignore`), com um `.env.example` sem valores. Confira se o export de um flow traz segredo antes de versioná-lo.
- Decisão relevante entra em `docs/decisoes.md` (próximo `D<n>`, com data, escolha, alternativas e motivo). Limitação nova entra em `docs/arquitetura.md`.

## Git

- **Nunca faça commit, push, PR ou merge sem pedido explícito, a cada vez.** Ao fim de uma unidade de trabalho, sugira a mensagem de commit.
- **Congelamento em 22/11/2026, à noite.** A apresentação é em 23/11/2026, às 14h. Nada entra no repositório depois disso.
- O histórico é avaliado: commits pequenos, com uma ideia cada, em Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `ci:`) e mensagem curta em português. Mantenha a linha `Co-Authored-By: Claude` nos commits feitos pelo agente.
- Branches `<tipo>/<assunto>` (`docs/fundacao`). Os PRs têm base `develop` e entram com **merge commit**, nunca squash nem rebase. A `main` recebe a `develop` por um PR de release.
