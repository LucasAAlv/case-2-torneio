# Case 2: Torneio mata-mata

Receitas do Integration Hub da Pipefy que conduzem sozinhas um torneio mata-mata entre 8 super-heróis. Elas disparam as batalhas num simulador externo, recebem os resultados assíncronos por webhook, levam cada vencedor à chave seguinte e, no fim, criam um card com o campeão.

- Requisitos do enunciado: [docs/enunciado.md](docs/enunciado.md)
- Arquitetura, chave, estado na Arena, os dois flows, concorrência, custo e limitações: [docs/arquitetura.md](docs/arquitetura.md)
- Decisões, com alternativas e motivos: [docs/decisoes.md](docs/decisoes.md)
- Estrutura do pipe Arena e as mutations que a montaram: [docs/setup-arena.md](docs/setup-arena.md)
- Leitura da documentação do Integration Hub: [docs/pesquisa-integration-hub.md](docs/pesquisa-integration-hub.md)
- Contrato do Simulador de Batalhas: [docs/simulador.md](docs/simulador.md)
- Os dois flows, etapa por etapa, com o código das etapas Code: [flows/](flows/)
- Testes de ponta a ponta: [docs/testes.md](docs/testes.md)

**Onde roda:** os flows ficam no Integration Hub, dentro do pipe 307434674 da org do case. O estado do torneio fica no pipe Arena, onde cada herói é um card que anda pelas fases até o título ou o cemitério. Este repositório versiona o que dá para versionar fora do Hub: documentação, exemplos de payload e o código e a configuração dos flows.

## Como rodar um torneio

1. No pipe 307434674, abra **Integrations → Flows → Torneio - Início** e clique em **Run Flow**.
2. Acompanhe os heróis andando pelas fases da Arena (https://app.pipefy.com/pipes/307434666). O torneio termina em cerca de um minuto.
3. O card do campeão aparece na fase Champions do pipe 307434674, com o nome do candidato e o do campeão.

O flow **Torneio - Resultado** é acionado sozinho pelos callbacks do simulador. Um torneio completo custa 34 tarefas do Hub.

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `docs/` | Documentação do case |
| `flows/` | Configuração dos dois flows e o código das etapas Code |
| `payloads/simulator/` | Exemplo da requisição enviada ao simulador e do callback recebido |

## Recursos na Pipefy

| Recurso | Id |
| --- | --- |
| Database dos heróis | 307434675 |
| Pipe do card final, onde ficam os flows | 307434674 |
| Pipe Arena, com o estado do torneio | 307434666 |
| Simulador de Batalhas | `POST https://ipaas.pipefy.com/api/v1/webhooks/PcRpsKsO0mvhKEpimpZ9i` |
