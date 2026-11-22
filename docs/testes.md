# Testes de ponta a ponta

Registro dos testes feitos na org em 22/11/2026, com os flows publicados.

## 1. Callback inválido

- **Envio:** `POST` no webhook do flow Resultado com `{"winner": "Thanos", "identificador": "teste-1:QF-1"}`.
- **Resultado:** a execução terminou com sucesso em 750 ms, pelo caminho Otherwise do Router. Nenhum card foi alterado.
- **Custo:** 2 tarefas (consulta e Code).

## 2. Torneio "Batalha em Triskelion #1" (`triskelion-1`)

Primeiro torneio, iniciado pelo Run Flow do flow Início.

- **Início:** a execução levou 6 s e criou os 8 cards, levou-os para as quartas e enviou as 4 partidas.
- **Quartas:** os 4 callbacks chegaram, e os vencedores e perdedores foram movidos certo.
- **Falha:** nas 4 execuções, a etapa "Disparar próxima partida" falhou com `Unexpected end of JSON input`. A entrada `moved` chegava vazia, porque a referência à resposta de "Mover cards" tinha sido digitada à mão e não apontava para a etapa certa.
- **Correção:** a referência foi inserida pelo seletor de dados, e o flow Resultado foi republicado.
- **Recuperação:** as duas semifinais foram reenviadas ao simulador à mão (`triskelion-1:SF-1` e `triskelion-1:SF-2`), com os jogadores que estavam na fase Semifinal. A partir daí, o flow corrigido seguiu sozinho: disparou a final, moveu os cards e criou o card do campeão.
- **Campeão:** Hulk. Card criado no pipe 307434674 com "Lucas Alves / Hulk".

**Observado:** o `started_current_phase_at` tem precisão de segundo. Dois cards entraram na Semifinal no mesmo segundo (`05:40:48Z`), o que confirma a necessidade do desempate por posição (D9).

## 3. Torneio "Batalha em Mundo Bizarro #2" (`mundo-bizarro-2`)

Segundo torneio, com os dois flows já corrigidos e sem nenhuma intervenção.

- **Início:** a execução levou 7 s. O número 2 veio da contagem dos 8 cards do primeiro torneio (D7).
- **Execuções:** 1 do Início e 7 do Resultado, todas com sucesso.
- **Disparos:** cada semifinal e a final foram disparadas exatamente uma vez.
- **Tempo:** menos de 50 s do Run Flow ao card do campeão.
- **Campeão:** Wonder Woman. Card criado no pipe 307434674 com "Lucas Alves / Wonder Woman".

Estado final da Arena para esse torneio:

| Fase | Cards |
| --- | --- |
| Cemitério das quartas | Captain America, Batman, Iron Man, Black Widow |
| Cemitério da semifinal | Hulk, Hawkeye |
| Cemitério da final | Spiderman |
| Campeões | Wonder Woman |

## Como repetir

1. No Hub do pipe 307434674, abra o flow **Torneio - Início**, clique em **Edit flow** (ele abre em modo de leitura) e depois em **Run Flow**.
2. Acompanhe a Arena (https://app.pipefy.com/pipes/307434666). Os cards andam pelas fases em cerca de um minuto.
3. Confira o card do campeão no pipe 307434674 e as execuções na aba **Runs**.
