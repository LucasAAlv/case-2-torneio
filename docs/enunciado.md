# Enunciado e requisitos

Resumo do enunciado do Case 2 do processo seletivo, recebido em novembro de 2026. O texto abaixo é uma paráfrase organizada em requisitos, para servir de checklist da entrega.

## Objetivo

Criar **receitas** (Integration Hub da Pipefy) que gerenciem de forma automatizada um campeonato de super-heróis no formato mata-mata, do início ao fim.

## Recursos fornecidos

| Recurso | Id | Observação |
| --- | --- | --- |
| Organização | 302573874 | |
| Database dos heróis | 307434675 | 8 heróis, campos `nome_participante` e `id_participante` |
| Pipe do card final | 307434674 | recebe o card com o nome do candidato e o do campeão |
| Simulador de Batalhas | `POST https://ipaas.pipefy.com/api/v1/webhooks/PcRpsKsO0mvhKEpimpZ9i` | contrato em [simulador.md](simulador.md) |

Links de apoio citados no enunciado:
- https://community.pipefy.com/p/jornada-integration-hub
- https://academy.pipefy.com/program/pipefy-onboarding

## Requisitos

| # | Requisito | Origem no enunciado |
| --- | --- | --- |
| R1 | Os 8 heróis do database disputam 3 rodadas: quartas, semifinais e final. | Cenário |
| R2 | Quem decide cada batalha é o simulador externo, não a integração. | O campeonato |
| R3 | O resultado é assíncrono: chega depois de um tempo indeterminado, num webhook da integração informado em `url_retorno`. | Regras de integração |
| R4 | A integração identifica a qual batalha cada resultado se refere. | Gestão de chaves |
| R5 | O vencedor é alocado **automaticamente** na próxima chave correta, até haver um campeão. | Gestão de chaves |
| R6 | No fim, é criado um card no pipe 307434674 com o nome do candidato e o nome do campeão. | Regras de integração |
| R7 | O estado das rodadas (não iniciada, em andamento, concluída) fica guardado de forma criativa e controla o torneio. | Requisitos técnicos |
| R8 | A integração trata os dados recebidos do simulador. | Requisitos técnicos |
| R9 | O máximo possível é automatizado, incluindo o resultado final no card, com atenção à otimização do fluxo (poucas receitas, poucas chamadas). | Requisitos técnicos |

## Avaliação e entrega

- A apresentação é em **23/11/2026, às 14h**. Alterações depois dela desconsideram o case, então o repositório congela em 22/11 à noite.
- O enunciado pede o repositório público e o e-mail com as instruções para o Case 1. Para o Case 2, o entregável principal são as receitas no Integration Hub. Este repositório guarda a documentação, os payloads e os scripts de teste, para a banca consultar o raciocínio e o histórico.
- A apresentação mostra as receitas, um torneio rodando de ponta a ponta e as decisões de desenho registradas em [decisoes.md](decisoes.md).
