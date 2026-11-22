# Pesquisa: Integration Hub da Pipefy

Leitura da Central de Ajuda e da Comunidade da Pipefy, feita em 21/11/2026, e visitas à aba Integrations do pipe 307434674 em 21 e 22/11/2026. Serve para embasar a modelagem do Case 2.

Tudo aqui vem da documentação, **salvo o que está marcado como "visto na org"**. Em 22/11, dois flows de rascunho foram criados só para abrir a configuração das ações e apagados em seguida. Nenhum flow foi executado. Quando a documentação não cobre um ponto, isso está dito como "não documentado".

---

## 1. O que decide a arquitetura

### 1.1. As receitas são "flows" e ficam dentro de um pipe

- A unidade é o **flow**: um gatilho, condições e ações. O enunciado chama de "receita".
- **Visto na org:** a aba **Integrations** do pipe 307434674 tem as abas Flows, Runs, Connections e Variables. Estão todas vazias.
  - A tela de início oferece "Build a Flow", a partir do zero, por import ou por template.
  - Também oferece "Create a Table".
- **Visto na org:** o menu de cada flow tem Rename, Move To, Duplicate, Versions, **Import**, **Export** e Delete. As receitas podem, portanto, ser exportadas e versionadas neste repositório. O formato do arquivo ainda não foi aberto.
- O Hub é construído sobre o **Activepieces**. A Comunidade anunciou isso em agosto de 2025, e o catálogo de conectores lista "Activepieces Platform". Os nomes das peças (Router, Loop, Storage, Tables, Sub Flows) são os do Activepieces.

### 1.2. Gatilhos que servem ao torneio

| Gatilho | Uso no torneio |
| --- | --- |
| **Catch Webhook** | É o `url_retorno` do simulador. A URL é gerada pelo Hub, e o sufixo `/test` gera dados de exemplo sem executar o flow publicado. |
| **Manual Trigger** | Pode iniciar o torneio sob demanda (consta no catálogo). |
| Gatilhos de card do conector Pipefy | Card created, moved, done, field updated e outros. Podem iniciar o torneio quando alguém cria ou move um card. |
| **Callable Flow** | Gatilho de um subflow, chamado por outro flow. |
| Schedule | Execução agendada. Não parece necessária. |

**Sobre o webhook:**
- O Hub responde 200 OK na hora e processa o flow **em segundo plano**. Isso bate com o 200 `{}` que o simulador devolve, o que indica que o simulador também é um flow do Hub.
- Com a ação **Return Response** e o sufixo `/sync`, o webhook passa a ser síncrono, com limite de 30 s. Não se aplica ao torneio: o simulador não espera resposta.
- **Autenticação do webhook:** None, Basic Auth, Header Auth ou assinatura HMAC. O simulador não manda cabeçalho nenhum, então o webhook de retorno precisa ficar com **None**. A validação por estado, descrita nas diretrizes de [decisoes.md](decisoes.md), é a defesa possível.

### 1.3. Peças de ação

| Peça | O que faz | Observação |
| --- | --- | --- |
| **HTTP** | Chamada a qualquer endpoint. É a peça que dispara o simulador (POST). | Tem política de falha: retry em 5xx ou em tudo, continuar ou parar o flow. A credencial vai no header, vinda de uma Variable. |
| **Pipefy** (conector) | Triggers e ações de cards e de **records de database**. Busca card por id, por valor de campo, por fase ou por título. Também tem **Custom API Call** para qualquer query ou mutation GraphQL. | Autentica por **Service Account** (Client ID e Client Secret), que precisa ser autorizada em cada pipe. |
| **Storage** | Chave-valor persistente. Operações Get, Put, Append, Remove e Add To List. | Veja a seção 1.4. |
| **Tables** | Tabelas de dados dentro do Hub. | Documentação não consultada. A tela "Create a Table" aparece na aba Integrations. |
| **Code** | JavaScript ou TypeScript. | Limite de 90 s por etapa. A documentação recomenda preferir peças nativas. **Visto na org:** aparece nos destaques do seletor de peças, junto com Router, HTTP e AI. |
| **Router** (Branch) | Condições e caminhos. | **Não conta tarefa.** |
| **Loop** (For Each) | Itera uma lista. | O nó não conta, mas cada ação dentro dele conta por iteração. |
| **Sub Flows** | Chama um Callable Flow, síncrono ou assíncrono. | O subflow precisa estar publicado e ativo. |
| Delay, Data Mapper, JSON, Text Helper, Math Helper, Date Helper | Utilitários. | Contam tarefa como Data Helpers. |

**O conector Pipefy visto na org (22/11/2026):**
- **Ações disponíveis:**
  - cards: Create card, Move card, Update card, Delete card, Get card by id, Get cards by field value, Get cards by phase e Get cards by title;
  - records: Create record, Update record, Update record status, Delete record, Get record by id, Get records by field value e Get records by filter;
  - Custom API Call;
  - outras: Batch export, Batch upsert, Reprocess batch operation, Card PDF Generate, Upload e Delete attachment, Update items in list type fields, Configure public phase form link e convites (Invite user to pipe, database ou organization).
- **A ação pede Connection, Organization, Pipe e Phase.** O seletor de Pipe lista os pipes que a **Service Account** enxerga, e não o pipe que hospeda o flow. Com a conta membro só de um pipe de teste, o seletor listou só esse pipe, e não o 307434674, onde o flow estava. Um flow pode, portanto, agir em qualquer pipe autorizado para a conta.
- **Retorno do "Get cards by phase":** sempre traz `id`, `fields`, `fields_by_phase` e `pipe`. Seções opcionais, marcadas por padrão, acrescentam Card Information, **Phases History** (`phase`, `firstTimeIn`, `lastTimeIn`, `lastTimeOut`, `duration`, `created_at`, `became_late`), Attachments, Comments e outras.
- A Central de Ajuda avisa que a peça **HTTP não reaproveita credenciais** entre flows diferentes, nem dentro do mesmo pipe. A conexão do conector Pipefy é reaproveitada.

### 1.4. Storage: o estado sem sair do Hub

- **Escopos:**
  - **Run:** só durante a execução.
  - **Flow:** persiste entre execuções do mesmo flow.
  - **Project:** compartilhado por **todos os flows do pipe**. É o que permite o flow de início e o flow de resultado lerem o mesmo estado.
- **Limites:** a chave tem até 128 caracteres e o valor até 512 KB.
- **O Put sobrescreve.** A documentação **não menciona** operação atômica, compare-and-set nem trava. Por isso, dois callbacks concorrentes que façam ler, alterar e gravar o mesmo valor podem perder uma atualização.
  - **Implicação:** uma chave por slot (por exemplo, `T3:SF-1:p1`), e não um JSON único com o torneio inteiro. Cada callback grava só a própria chave e nunca sobrescreve a de outro.
- Dentro de um Loop ou Branch, depois de um Put é preciso fazer um novo Get para ver o valor atualizado.
- Um Get em chave vazia precisa de tratamento: use um Router para a primeira execução.
- O estado no Storage **não aparece na interface da Pipefy**. Para a demo, isso pesa contra ele quando comparado a cards ou records.

### 1.5. Cobrança: o que "otimizar o fluxo" quer dizer

O plano tem uma cota mensal de **tarefas**. Isso dá uma métrica objetiva para o requisito R9.

| Conta tarefa | Não conta tarefa |
| --- | --- |
| Ação de conector (Pipefy, Slack...) | Gatilho (webhook, schedule) |
| Requisição HTTP | Router (Branch/If-Else) |
| Etapa de Code | O nó do Loop em si |
| Data Helpers (listas, objetos, strings) | Execução que falha ou estoura o tempo |
| Get, Put e Delete do Storage | |
| Cada ação dentro de Loop, **por iteração** | |

**Consequências para o desenho:**
- Validações em Router saem de graça. Uma etapa de Code faz várias coisas e conta uma vez só.
- Quatro POSTs das quartas dentro de um Loop custam 4 tarefas, a mesma coisa que quatro etapas HTTP separadas.

### 1.6. Limites operacionais

| Limite | Valor |
| --- | --- |
| Execução de um flow | 5 min (outra página fala em 10 min de *hard timeout*) |
| Etapa de Code | 90 s |
| Memória por execução | 512 MB |
| **Execuções simultâneas** | **10 por pipe** |
| Payload do webhook | 5 MB (até 512 KB é processado em memória) |
| Resposta síncrona do webhook | 30 s |
| Retry manual de execução que falhou | até 24 h |
| Logs (aba Runs) | 30 dias |
| Flows e etapas por flow | ilimitados |

Sete callbacks num torneio inteiro ficam bem abaixo das 10 execuções simultâneas. Mesmo assim, as quatro quartas podem voltar ao mesmo tempo, e **a concorrência é real**.

---

## 2. Pré-requisitos na org

- **Service Account:** o conector Pipefy exige uma, com Client ID e Client Secret.
  - **Onde criar:** nome da empresa ou foto de perfil → **Members and Permissions** → aba **Service Accounts** → **Create Service Account**. Só um **Super Admin** da org consegue.
  - O nome vira o e-mail da conta e tem até 20 caracteres.
  - A validade do token vai de 5 minutos a 30 dias e **não pode ser alterada** depois da criação.
  - A conta precisa ser membro de cada pipe e database que o flow usa. Sem isso, as chamadas voltam com `PERMISSION_DENIED`. A ajuda recomenda não convidá-la como membro comum da empresa, por causa da cobrança.
  - **Conexão no Hub:** aba Integrations → **Connections** → **+ New Connection** → conector Pipefy, com o Client ID e o Client Secret.
  - A alternativa sem conector é chamar a API GraphQL pela peça HTTP, com um token guardado em Variables.
- **O add-on de Integrations está ativo:** visto na org, a aba aparece no pipe 307434674.

## 3. Pipe do card final (visto na org)

- **Pipe:** 307434674, "Tech. Consultants (Case 2)", com uma fase, **Champions**, e 0 cards.
- **Formulário inicial**, com dois campos obrigatórios:
  - **Process Participant Name**: o nome do candidato;
  - **Champion Name**: o campeão.
- Os `field.id` ainda não foram conferidos pela API.

## 4. Ainda não verificado

- Como a peça Code recebe os dados das etapas anteriores.
- O formato do export de um flow e se ele inclui segredos.
- A precisão do `lastTimeIn` (segundos ou milissegundos).
- Se a busca de cards reflete na hora um card que acabou de ser movido.
- Se o `createCard` aceita `phase_id` e se a API exige os campos obrigatórios do formulário inicial.
- Se o Storage tem alguma garantia de atomicidade.
- O que a peça **Tables** oferece: busca, update por linha e visualização.
- Se a ação de record do conector Pipefy permite atualizar um único campo sem regravar o registro.
- Se o webhook entrega o body JSON já interpretado para as etapas seguintes.

## Fontes

- [Introduction to Pipefy's Integrations](https://help.pipefy.com/en/articles/12587595-introduction-to-pipefy-s-integrations)
- [Getting Started with Pipefy's Integrations](https://help.pipefy.com/en/articles/12589348-getting-started-with-pipefy-s-integrations)
- [Receiving Data with Webhooks](https://help.pipefy.com/en/articles/14693313-receiving-data-with-webhooks-in-pipefy-integrations)
- [Working with Persistent Storage](https://help.pipefy.com/en/articles/14693415-working-with-persistent-storage-in-pipefy-integrations)
- [Best Practices for High-Performance Flows](https://help.pipefy.com/en/articles/13791558-best-practices-for-high-performance-flows)
- [Service Accounts](https://help.pipefy.com/en/articles/9027789-service-accounts)
- [How to read your Integrations Usage Stats](https://help.pipefy.com/en/articles/15399913-how-to-read-your-integrations-usage-stats)
- [Integrations Connectors Catalog (A-Z)](https://help.pipefy.com/en/articles/12685184-integrations-connectors-catalog-a-z)
- Comunidade: [Integrations Hub: what it is](https://community.pipefy.com/getting-started-146/pipefy-integrations-hub-what-it-is-and-when-to-use-it-5310), [Webhooks](https://community.pipefy.com/integrations-and-api-155/webhooks-receive-and-respond-to-events-in-real-time-5315), [The Pipefy connector](https://community.pipefy.com/integrations-and-api-155/the-pipefy-connector-triggers-actions-and-decisions-5325), [Sub-flows](https://community.pipefy.com/pipes-and-phases-147/sub-flows-how-to-modularize-your-main-flow-5311), [The HTTP action](https://community.pipefy.com/integrations-and-api-155/the-http-action-connect-any-api-to-your-flow-5314), [Best Practices & Usage Limits](https://community.pipefy.com/integrations-and-api-155/pipefy-integration-best-practices-usage-limits-guide-5836)
- Trilha do enunciado: [Jornada Integration Hub](https://community.pipefy.com/p/jornada-integration-hub)
