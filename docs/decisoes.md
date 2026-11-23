# Decisões

Registro das decisões do Case 2, com data, opção escolhida, alternativas e motivo.

---

## Diretrizes já definidas (18/11/2026)

Estas diretrizes vieram da análise do simulador e valem para qualquer modelagem que for escolhida.

- **O identificador codifica a posição na chave.** As partidas são `QF-1` a `QF-4`, `SF-1`, `SF-2` e `F-1`.
- **Regra de avanço:** o vencedor de `QF-n` vai para `SF-⌈n/2⌉`, como `player1` se n for ímpar e como `player2` se n for par. A mesma regra leva das semifinais para a final. Isso dispensa uma tabela de chaveamento.
- **Cada callback mexe só na própria partida.** A partida seguinte só é disparada quando os dois jogadores dela estão definidos. Assim, a ordem de chegada dos resultados não importa. Na Arena (D1), isso significa mover só os dois cards da partida.
- **Validação por estado:** só é aceito resultado de partida existente, em andamento e com vencedor entre os dois jogadores dela. Essa regra reduz três problemas de uma vez:
  - a falta de autenticação no callback;
  - os callbacks duplicados, quando o segundo chega depois de o primeiro mover os cards;
  - o disparo duplicado de uma partida por concorrência, que a D9 completa.

  Ela não é uma trava: ler e escrever não é atômico, e dois callbacks iguais que chegam ao mesmo tempo passam os dois (veja as [limitações](arquitetura.md#limitações-conhecidas)).
- **Economia:** poucas receitas e poucas tarefas. O Hub cobra por tarefa bem-sucedida, e o Router não conta (veja [pesquisa-integration-hub.md](pesquisa-integration-hub.md#15-cobrança-o-que-otimizar-o-fluxo-quer-dizer)).

---

## D1. O estado fica no pipe Arena, com um card por herói (22/11/2026)

**Escolha:** o pipe **Arena** (307434666) guarda o estado do torneio. Cada torneio cria 8 cards, um por herói, e a fase do card diz onde o herói está:

```
Não iniciada → Quartas de final → Semifinal → Final → Campeões
                     ↓                ↓          ↓
        Cemitério das quartas  Cemitério da semifinal  Cemitério da final
```

O vencedor de cada partida avança para a fase da rodada seguinte, e o perdedor vai para o cemitério da rodada. O estado de cada rodada sai da ocupação das fases:

| Rodada | Não iniciada | Em andamento | Concluída |
| --- | --- | --- | --- |
| Quartas | os cards do torneio estão em "Não iniciada" | há cards do torneio em "Quartas de final" | "Quartas de final" não tem mais cards do torneio |
| Semifinal e final | a fase da rodada ainda não recebeu cards do torneio | há cards do torneio na fase | a fase não tem mais cards do torneio |

**Alternativas:**
- Pipe com um card por partida (7 por torneio), com a fase como estado da partida: também é visual, mas o card representa uma abstração (a partida), e o perdedor não aparece em lugar nenhum.
- Database de partidas: simples, mas menos visual que um kanban, e cada leitura e escrita é uma tarefa.
- Storage do Hub, com uma chave por slot: nativo e sem estrutura nova na Pipefy, mas o estado só aparece dentro do Hub, nos logs das execuções.
- Tables do Hub: não verificada a tempo.
- Campos de estado no database dos heróis: o estado é da partida, não do herói, e o database pertence à banca.

**Motivo:** o enunciado pede um uso criativo do estado das rodadas. Com a fase como estado, o torneio aparece no kanban enquanto roda, com os eliminados em cemitérios por rodada e os campeões acumulados. A validação por estado também sai de graça: um resultado de `QF-1` só vale se o vencedor e o adversário estiverem os dois na fase "Quartas de final".

---

## D2. A Arena é separada do pipe do card final (22/11/2026)

**Escolha:** os cards dos heróis ficam na Arena. O pipe 307434674 continua como foi entregue, com uma fase e o mesmo formulário, e recebe exatamente um card por torneio, criado no fim.

**Alternativa:** acrescentar as fases do torneio ao pipe 307434674, antes de "Champions".

**Motivo:**
- Na Pipefy, cada pipe tem **um único formulário inicial**, e todo card nasce dele. Os cards dos heróis teriam de passar pelos dois campos obrigatórios ("Process Participant Name" e "Champion Name"), e "Champion Name" num herói eliminado não faz sentido.
- O card nasce na primeira fase, que hoje é "Champions". Reordenar as fases obrigaria o card final a nascer com `phase_id`, e esse parâmetro do `createCard` não foi conferido.
- O R6 pede que, no fim, *seja criado* um card no 307434674. Mover o card do herói campeão para lá seria mover, não criar.
- O 307434674 é o critério de aceite da banca. Mantê-lo intacto evita alterar a estrutura e acumular 8 cards de teste por torneio nele.

Um flow no 307434674 consegue agir na Arena: o seletor de pipe das ações do conector lista os pipes que a Service Account enxerga, e não o pipe que hospeda o flow (visto na org em 22/11/2026, veja [pesquisa-integration-hub.md](pesquisa-integration-hub.md)).

---

## D3. A partida sai da posição fixa do herói na chave (22/11/2026)

**Escolha:** cada card recebe na criação o campo **Posição**, de 1 a 8, que nunca muda. Nas quartas, a partida de um card é `QF-⌈posição/2⌉`; na semifinal, `SF-⌈posição/4⌉`; na final, `F-1`. O slot (`player1` ou `player2`) sai da metade do intervalo em que a posição cai.

**Alternativa:** um campo "partida" atualizado a cada rodada (`QF-1`, depois `SF-1`...).

**Motivo:** com a posição fixa, o callback só move cards e não atualiza nenhum campo. Uma partida é sempre "os cards do torneio X, na fase da rodada, com posição no intervalo da partida".

---

## D4. Dois flows: início e resultado (22/11/2026)

**Escolha:**
- **Início:** sorteia a chave, cria os 8 cards na Arena e dispara as quatro quartas.
- **Resultado:** é o webhook do `url_retorno`. Valida o callback, move os cards, dispara a partida seguinte e, depois da final, cria o card no 307434674.

**Alternativas:**
- Um flow só, com um Router pelo tipo de evento: exigiria que o início também chegasse pelo webhook, por um POST externo.
- Dois flows e um subflow "disparar partida": centraliza o POST ao simulador, mas acrescenta uma peça para publicar e manter ativa, e a chamada ao subflow pode contar tarefa.

**Motivo:** cada flow tem um gatilho e uma responsabilidade. O POST ao simulador aparece nos dois flows, mas é uma etapa HTTP simples.

**Ajuste na implementação (22/11/2026):** o POST não usa a peça HTTP. Ele sai de dentro das etapas Code, com `fetch` (D13).

---

## D5. O torneio começa pelo Manual Trigger (22/11/2026)

**Escolha:** o flow de início usa o Manual Trigger. Depois do clique em **Run Flow**, o torneio segue sozinho até o card final.

**Alternativas:**
- Gatilho de card criado num pipe: exigiria um pipe de "pedidos de torneio" só para isso.
- POST manual no webhook: o início dependeria de uma ferramenta fora da Pipefy.

**Motivo:** sem efeito colateral e com um clique na demo.

**Visto no Hub (22/11/2026):** o flow publicado abre em modo de leitura, e o Run Flow só aparece depois do clique em **Edit flow**.

---

## D6. A chave das quartas é sorteada numa etapa Code (22/11/2026)

**Escolha:** uma única etapa Code embaralha os 8 heróis, atribui as posições de 1 a 8 e sorteia o lugar do nome do torneio (D7). Custa 1 tarefa.

**Alternativas:**
- Ordem fixa pelo `id_participante`: determinística, mas a chave seria a mesma em todo torneio.
- Ordem de leitura do database: a ordem que a API devolve não está garantida.

**Motivo:** um torneio com chave sorteada é mais fiel ao formato, e o sorteio fica registrado nas posições dos cards.

---

## D7. O id do torneio é lugar + número (22/11/2026)

**Escolha:** cada torneio recebe um nome como **"Batalha em Wakanda #4"**. O lugar é sorteado de uma lista de locais dos universos dos heróis, e o número vem de um contador no Storage do Hub (escopo Project). O `identificador_da_rodada` leva o slug do torneio e a partida: `wakanda-4:QF-1`.

Lista de locais: Gotham, Metrópolis, Asgard, Wakanda, Themyscira, Nova York, Sokovia, Latvéria, Atlântida, Kamar-Taj, Star City, Central City, Coast City, Blüdhaven, Hell's Kitchen, Xandar, Lugar Nenhum, Apokolips, Krypton, Oa, Genosha, Madripoor, Terra Selvagem, Arkham, Westchester, Fortaleza da Solidão, Batcaverna, Salão da Justiça, Torre dos Vingadores, Zona Negativa, Mundo Bizarro, Monte Olimpo, Nova Gênesis, Thanagar, Sakaar, Jotunheim, Nidavellir, Ilha da Caveira, Triskelion e Quinta Dimensão.

**Alternativas:**
- Limpar o estado a cada início: um callback atrasado com o mesmo identificador e os mesmos jogadores poderia ser aceito no torneio novo.
- Sem separação: dependeria de disciplina nos testes.
- Só o lugar, percorrendo a lista: o nome se repetiria quando a lista acabasse.

**Motivo:** o número garante que o nome nunca se repete, então um callback de outro torneio nunca encontra cards do torneio ativo. O lugar deixa o kanban legível. O contador custa 2 tarefas por torneio (Get e Put), sem risco de concorrência, porque o início é manual.

**Ajuste na implementação (22/11/2026):** o número não vem do Storage. Como todo torneio cria exatamente 8 cards na Arena e nenhum card é apagado (D11), o número é `⌈cards da Arena ÷ 8⌉ + 1`, lido na mesma consulta que traz os heróis. Isso economiza as 2 tarefas do Storage e tira o Storage do desenho. Se alguém apagar cards da Arena, o número pode se repetir. Nesse caso, o lugar sorteado ainda torna improvável que o slug se repita.

---

## D8. A Pipefy é acessada por Service Account, pelo conector (22/11/2026)

**Escolha:** os flows usam o conector Pipefy com uma conexão autenticada por Service Account. A conta é membro só dos recursos de que o torneio precisa: a Arena, o pipe 307434674 e o database 307434675. Para o que as ações prontas não cobrirem, a Custom API Call usa a mesma conexão.

**Alternativas:**
- Peça HTTP com GraphQL e token pessoal guardado em Variables: dispensa a Service Account, mas a automação passaria a agir como uma pessoa, com todas as permissões dela, e o token valeria para a conta inteira, não só para estes recursos. A peça HTTP também não reaproveita credenciais entre flows.

**Motivo:** o flow roda no servidor, disparado pelo webhook do simulador, sem nenhum usuário logado. A identidade precisa ser da automação, com acesso restrito ao que ela usa e revogável sem afetar uma pessoa. É o caminho que a própria Pipefy desenhou para o conector. No Case 1 o princípio é o mesmo (cada chamada roda com a identidade a quem ela pertence), mas lá essa identidade é o usuário logado.

**Limitação:** o token da Service Account tem validade fixa, escolhida na criação, de 5 minutos a 30 dias. Ela não pode ser alterada depois.

---

## D9. A próxima partida é disparada por quem entrou por último na fase (22/11/2026)

**Escolha:** depois de mover o vencedor, o flow de resultado lê os cards do torneio, com o `phases_history`. Ele só dispara a partida seguinte se o adversário já estiver na fase **e** o `lastTimeIn` do card que ele acabou de mover for maior que o do adversário. Se os dois horários forem iguais, dispara o flow do card de posição par.

**Alternativa:** disparar sempre que o adversário estiver na fase e confiar na validação por estado para descartar o resultado duplicado.

**Motivo:** quando duas quartas voltam juntas, os dois flows podem ver os dois cards na semifinal e disparar a mesma partida duas vezes. Se os dois callbacks dessa partida duplicada também chegassem juntos, com vencedores diferentes, a validação poderia aceitar os dois. Com o desempate, no máximo um dos dois flows dispara. Como cada flow move antes de ler, pelo menos um deles enxerga o adversário, desde que a leitura reflita o movimento do outro na hora. Isso não garante que a partida sempre saia (veja o limite conhecido). O "Get cards by phase" oferece a seção Phases History com `lastTimeIn` (visto na org em 22/11/2026).

**Ajuste na implementação (22/11/2026):**
- O horário usado é o `started_current_phase_at` do card, que é a hora de entrada na fase atual e vem direto na resposta da mutation que move o vencedor. Assim, a leitura depois do movimento não custa uma tarefa a mais (veja D13).
- O desempate no mesmo segundo é pela **maior posição**, e não pela posição par: numa semifinal, os dois cards podem ter posição par (por exemplo, 2 e 4).

**Verificado no teste (22/11/2026):** o horário tem precisão de **segundo**, e dois cards de partidas diferentes entraram na semifinal no mesmo segundo. O empate dentro de uma mesma partida não foi observado na org e foi conferido num teste local (veja [testes.md](testes.md)). A resposta da mutation já mostra o card que o outro flow acabou de mover. No `mundo-bizarro-2`, cada semifinal e a final foram disparadas exatamente uma vez. No `triskelion-1`, as semifinais foram reenviadas à mão, e o flow disparou a final uma vez.

**Limite conhecido (22/11/2026):** a regra evita o disparo duplicado, mas não garante que a partida sempre saia. Num empate no mesmo segundo, se a resposta do primeiro movimento ainda não mostrar o card do adversário, o flow que enxerga o outro card pode ser justamente o que perde o desempate. Nesse caso, nenhum dos dois dispara, e a partida fica parada. Não é preciso haver atraso na leitura: basta o card de maior posição ser movido primeiro e o outro ser movido no mesmo segundo, depois dessa resposta. O mesmo pode acontecer se a ordem dos horários de entrada não for a ordem em que os movimentos foram gravados.

- **Por que não há garantia:** o flow só move e lê. Sem uma operação atômica, não é possível garantir ao mesmo tempo que a partida dispara uma vez só e que ela sempre dispara. A D9 escolheu não duplicar, porque uma partida parada aparece no kanban e tem conserto, e uma partida duplicada pode levar os dois heróis adiante.
- **Recuperação:** reenviar a partida ao simulador com o mesmo identificador.
- **Em produção:** um flow agendado acharia partidas com os dois cards parados há mais de N minutos e as reenviaria. Outra opção é reler a fase alguns segundos depois, quando o flow não enxerga o adversário, e reaplicar a regra. Isso cobriria o empate, com mais tarefas por partida. Nenhuma das duas foi implementada.
- **Nos testes:** o caso não aconteceu na org. O teste local de 22/11 partia de os dois flows enxergarem os dois cards. Sem esse pressuposto, o caso foi reproduzido localmente (veja [testes.md](testes.md)).

---

## D10. Campos e título dos cards da Arena (22/11/2026)

**Escolha:** o formulário inicial da Arena tem **Herói** (texto), **Torneio** (texto, com o slug, como `wakanda-4`) e **Posição** (número de 1 a 8). O título do card é "Wakanda #4 · Batman". Como a Pipefy tira o título de um único campo, há também um campo **Título**, que o flow Início monta e que é o campo de título do pipe. A estrutura está em [setup-arena.md](setup-arena.md).

**Alternativa:** Herói como conexão com o record do database 307434675, ligando o card ao herói de origem.

**Motivo:** o simulador recebe e devolve o nome em texto, e a validação do `winner` compara texto de qualquer jeito. O título começando pelo torneio agrupa visualmente os cards de cada torneio no kanban.

---

## D11. Os torneios antigos ficam na Arena (22/11/2026)

**Escolha:** os cards de torneios terminados não são apagados. "Campeões" vira um hall da fama, e os cemitérios guardam o histórico de cada rodada.

**Alternativa:** limpar a Arena entre torneios, deixando o kanban vazio para a demo ao custo de tarefas ou de trabalho manual.

**Motivo:** o histórico mostra o torneio funcionando em várias execuções, e não custa nada. Como todo torneio termina com as fases de rodada vazias, os cards antigos não se misturam com os do torneio em andamento nas fases que o flow consulta.

---

## D12. O repositório versiona os docs e o export dos flows (22/11/2026)

**Escolha:** o repositório guarda a documentação, os payloads de exemplo e o export dos flows. O código da etapa Code vive dentro do export.

**Alternativas:**
- Código das etapas Code em TypeScript, com Vitest e CI: mesmo padrão do Case 1, mas o código seria copiado à mão para o Hub e poderia divergir. Não cabia no prazo.
- Scripts que simulam callbacks (duplicados e fora de ordem): testariam a concorrência de ponta a ponta, mas também não cabiam no prazo.

**Motivo:** o entregável do Case 2 são as receitas no Hub. O export espelha exatamente o que roda lá. Antes de versionar um export, é preciso abrir o arquivo e conferir que ele não traz segredo.

**Ajuste na implementação (22/11/2026):** a pasta [flows/](../flows/) guarda o código de cada etapa Code, igual ao colado no Hub, e a configuração de cada etapa (consultas, referências e Router). Com isso, os flows podem ser conferidos e remontados mesmo sem o export.

---

## D13. As chamadas à Pipefy são GraphQL montado nas etapas Code (22/11/2026)

**Escolha:** cada flow lê o estado com uma consulta GraphQL e escreve com uma única mutation. As duas passam pela ação Custom API Call do conector, com a Service Account. As etapas Code leem a resposta e montam a mutation seguinte:
- **Início:** 1 consulta (heróis e total de cards da Arena), 1 mutation com as 8 criações e 1 mutation com as 8 movimentações.
- **Resultado:** 1 consulta (as fases de rodada da Arena) e 1 mutation que move vencedor e perdedor. Na final, a mesma mutation cria o card no 307434674. A resposta da mutation já traz os cards da fase de destino, que a regra de disparo (D9) usa.
- Os POSTs ao simulador saem de dentro das etapas Code (`fetch`), com até 3 tentativas em erro de rede ou 5xx.

**Alternativa:** as ações prontas do conector (Get cards by phase, Move card, Create card) e a peça HTTP. Cada ação faz uma operação, então o torneio custaria cerca de 68 tarefas, em vez de cerca de 34.

**Motivo:** o R9 pede poucas chamadas, e o Hub cobra por tarefa. Agrupar as operações numa mutation e os POSTs numa etapa Code divide o custo pela metade. O custo é mais código para manter: as consultas e mutations ficam versionadas em [flows/](../flows/).

