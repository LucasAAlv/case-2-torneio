# Decisões

Registro das decisões do Case 2, com data, opção escolhida, alternativas e motivo.

---

## Diretrizes já definidas (18/11/2026)

Estas diretrizes vieram da análise do simulador e valem para qualquer modelagem que for escolhida.

- **O identificador codifica a posição na chave.** As partidas são `QF-1` a `QF-4`, `SF-1`, `SF-2` e `F-1`.
- **Regra de avanço:** o vencedor de `QF-n` vai para `SF-⌈n/2⌉`, como `player1` se n for ímpar e como `player2` se n for par. A mesma regra leva das semifinais para a final. Isso dispensa uma tabela de chaveamento.
- **Cada callback grava só o seu slot.** A partida seguinte só é disparada quando os dois slots estão preenchidos. Assim, a ordem de chegada dos resultados não importa.
- **Validação por estado:** só é aceito resultado de partida existente, em andamento e com vencedor entre os dois jogadores dela. Essa regra resolve três problemas de uma vez:
  - a falta de autenticação no callback;
  - os callbacks duplicados;
  - o disparo duplicado de uma partida por concorrência.
- **Economia:** poucas receitas e poucas tarefas. O Hub cobra por tarefa bem-sucedida, e o Router não conta (veja [pesquisa-integration-hub.md](pesquisa-integration-hub.md#15-cobrança-o-que-otimizar-o-fluxo-quer-dizer)).

---

## Em aberto

Decisões ainda não tomadas. Cada uma vira uma entrada D1, D2... quando for tomada.

1. **Onde guardar o estado das partidas.**

   | Opção | A favor | Contra |
   | --- | --- | --- |
   | Pipe de partidas, com a fase do card sendo o estado | Visual na demo, e o estado aparece no kanban | Exige criar o pipe, e cada leitura e escrita é uma tarefa do conector |
   | Database de partidas | Simples, visível na Pipefy | Cada leitura e escrita é uma tarefa |
   | Storage do Hub (chave-valor, escopo Project) | Nativo do Hub, não cria estrutura na Pipefy, chave por slot evita conflito | Fica invisível fora do Hub e sem operação atômica documentada |
   | Tables do Hub | Nativo e tabular | Ainda não verificado |

2. **Quantos flows usar e o que cada um faz.**
3. **Como o torneio começa e como a chave das quartas é montada.**
4. **Como separar um torneio do outro,** para que callbacks atrasados de um teste anterior não contaminem o seguinte.
5. **Como o conector Pipefy se autentica:** Service Account ou token na peça HTTP.
