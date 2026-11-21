# Case 2: Torneio mata-mata

Receitas do Integration Hub da Pipefy que conduzem sozinhas um torneio mata-mata entre 8 super-heróis. Elas disparam as batalhas num simulador externo, recebem os resultados assíncronos por webhook, levam cada vencedor à chave seguinte e, no fim, criam um card com o campeão.

- Requisitos do enunciado: [docs/enunciado.md](docs/enunciado.md)
- Arquitetura, chave, ciclo de vida das partidas, concorrência e limitações: [docs/arquitetura.md](docs/arquitetura.md)
- Decisões, com alternativas e motivos: [docs/decisoes.md](docs/decisoes.md)
- Leitura da documentação do Integration Hub: [docs/pesquisa-integration-hub.md](docs/pesquisa-integration-hub.md)
- Contrato do Simulador de Batalhas: [docs/simulador.md](docs/simulador.md)

**Onde roda:** os flows ficam no Integration Hub, dentro do pipe 307434674 da org do case. Este repositório versiona o que fica fora do Hub: documentação, exemplos de payload e scripts de teste.

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `docs/` | Documentação do case |
| `payloads/simulator/` | Exemplo da requisição enviada ao simulador e do callback recebido |

## Recursos na Pipefy

| Recurso | Id |
| --- | --- |
| Database dos heróis | 307434675 |
| Pipe do card final, onde ficam os flows | 307434674 |
| Simulador de Batalhas | `POST https://ipaas.pipefy.com/api/v1/webhooks/PcRpsKsO0mvhKEpimpZ9i` |
