# Modelo conceitual e MER inicial — AçaíConecta

**Status:** Rascunho para revisão humana. Não representa decisão de arquitetura encerrada nem conclusão da Fase 2.
**Base:** [PRD 2.5](PRD.md), [decisions.md](decisions.md), [flows.md](flows.md) e a estrutura de dados já implícita no protótipo (`prototypes/web/lib/mock-data.ts`, `customer-session.ts`, `order-presentation.ts`).
**Próximo passo previsto:** revisão conjunta com o modelo EER (com tipos de dados de banco, chaves e índices) antes da especificação de engenharia da Fase 3, conforme o roadmap.

Este documento propõe entidades e relacionamentos a partir das regras do MVP. Ele não substitui o PRD: qualquer conflito entre este modelo e o PRD ou o `decisions.md` deve ser resolvido nessas fontes antes de virar schema de banco.

---

## 1. Modelo conceitual (visão geral)

Entidades centrais e como se relacionam:

- **Usuário** é a superclasse de **Cliente**, **Operador** e **Administrador** (um papel por usuário no MVP, DEC-033 / PRD §16.1).
- **Batedeira** tem um único **Operador** responsável (DEC-033) e mantém um **Catálogo** de **Produtos**.
- **Batedeira** define **Horário de funcionamento**, **Bairros atendidos** (no piloto, somente Centro) e **Taxa de entrega** por bairro (DEC-036).
- **Cliente** possui **Endereços salvos** (0..N, um principal) — funcionalidade adicionada ao protótipo em 16/09/2026, ainda não coberta pelo PRD 2.5 explicitamente; tratada aqui como extensão razoável de "cadastrar endereço de entrega" (PRD §8.1).
- **Pedido** pertence a um **Cliente** e a uma **Batedeira**, contém **Itens do pedido** (cópia imutável de produto/preço/volume no momento da compra, PRD §11.1) e um **Endereço de entrega** (snapshot, não referência ao endereço salvo, para preservar o pedido mesmo se o endereço for editado depois).
- **Pedido** tem uma **Linha do tempo** (1..N eventos de transição de estado) — é o registro de auditoria operacional do pedido.
- **Administrador** registra **Intervenções administrativas** (auditoria de ações como ativar/suspender batedeira, bloquear/reativar cliente, cancelar pedido, mensagens de suporte) — distintas da linha do tempo do pedido, pois nem toda intervenção está ligada a um pedido.
- **Notificação** é derivada de eventos do pedido ou de mensagens predefinidas, direcionada a um usuário.

Fora do modelo (explicitamente fora do escopo do MVP, PRD §9): pagamento processado pela plataforma, avaliações públicas, fidelidade, chat livre, documentos de cadastro da batedeira.

---

## 2. Diagrama entidade-relacionamento (notação textual)

```
USUARIO (1) ──────< (0..1) CLIENTE
USUARIO (1) ──────< (0..1) OPERADOR
USUARIO (1) ──────< (0..1) ADMINISTRADOR

BATEDEIRA (1) ────< (1) OPERADOR              [um operador responsável por batedeira, DEC-033]
BATEDEIRA (1) ────< (0..N) PRODUTO
BATEDEIRA (1) ────< (0..N) HORARIO_FUNCIONAMENTO
BATEDEIRA (1) ────< (0..N) BAIRRO_ATENDIDO     [com taxa de entrega própria]

CLIENTE (1) ──────< (0..N) ENDERECO_SALVO
CLIENTE (1) ──────< (0..N) PEDIDO
BATEDEIRA (1) ────< (0..N) PEDIDO

PEDIDO (1) ───────< (1..N) ITEM_PEDIDO ───────> (1) PRODUTO   [cópia de nome/preço/volume no momento]
PEDIDO (1) ───────< (1..N) EVENTO_LINHA_DO_TEMPO
PEDIDO (1) ───────< (0..N) INTERVENCAO_ADMINISTRATIVA
PEDIDO (1) ───────< (0..N) NOTIFICACAO

ADMINISTRADOR (1) ─< (0..N) INTERVENCAO_ADMINISTRATIVA
USUARIO (1) ───────< (0..N) NOTIFICACAO
```

Cardinalidades seguem as regras do MVP: um pedido pertence a exatamente um cliente e uma batedeira; um item de pedido referencia um produto mas não depende dele após a criação (dados copiados); uma batedeira tem exatamente um operador responsável durante o piloto.

---

## 3. Dicionário de dados inicial

Tipos são sugestões conceituais (não SQL definitivo); revisão do EER deve mapeá-los para tipos concretos do banco escolhido (DEC-023: MySQL via Prisma).

### 3.1 Usuário (superclasse)

| Atributo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | identificador | Sim | Chave primária. |
| nome | texto | Sim | Nome de exibição. |
| email | texto | Sim | Único; usado para login do cliente (PRD §16.2). |
| senha_hash | texto | Sim | Nunca armazenar em texto puro. |
| papel | enum(cliente, operador, admin) | Sim | Um papel por usuário no MVP (PRD §16.1). |
| criado_em | data/hora | Sim | |
| tentativas_login_falhas | inteiro | Sim | Suporta limitação de tentativas (PRD §16.2). |
| sessao_encerrada_em | data/hora | Não | Suporta encerramento de sessões (PRD §16.2). |

### 3.2 Cliente (especialização de Usuário)

| Atributo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| usuario_id | identificador | Sim | Chave estrangeira/primária compartilhada com Usuário. |
| telefone | texto | Sim | Validado como DDD + número (`customer-session.ts`, `validateCheckout`). |
| bloqueado | booleano | Sim | Bloqueio administrativo (visto em `customer-account.tsx`, `customerBlocked`); implica negar novo pedido e login. |
| bloqueado_motivo | texto | Não | Motivo do bloqueio, para auditoria. |

### 3.3 Endereço salvo

| Atributo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | identificador | Sim | |
| cliente_id | identificador (FK) | Sim | |
| rua | texto (até 180) | Sim | |
| numero | texto (até 20) | Sim | |
| complemento | texto (até 100) | Não | |
| bairro | texto | Sim | Restrito a bairros atendidos (Centro, no piloto). |
| referencia | texto (até 255) | Não | |
| principal | booleano | Sim | Exatamente um endereço principal por cliente quando houver ao menos um salvo. |

### 3.4 Operador (especialização de Usuário)

| Atributo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| usuario_id | identificador | Sim | |
| batedeira_id | identificador (FK) | Sim | Acesso limitado à própria batedeira (PRD §16.2). |

### 3.5 Administrador (especialização de Usuário)

| Atributo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| usuario_id | identificador | Sim | |

### 3.6 Batedeira

| Atributo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | identificador | Sim | |
| nome | texto | Sim | |
| responsavel_nome | texto | Sim | Dono/responsável (cadastro assistido, DEC-033). |
| endereco | texto | Sim | Endereço do estabelecimento. |
| bairro | texto | Sim | No piloto, sempre Centro (DEC-019). |
| imagem | texto (URL) | Não | Foto ilustrativa ou do estabelecimento. |
| status_admin | enum(em_analise, ativa, suspensa, desativada) | Sim | PRD §10.1. |
| aberta | booleano | Sim | Estado do estabelecimento, independente da entrega. |
| entrega_disponivel | booleano | Sim | Independente de `aberta` (PRD §10.1). |
| faixa_estimada | texto | Sim | Ex.: "25–35 min"; não é horário exato (PRD §12.6). |
| criado_em | data/hora | Sim | |

### 3.7 Horário de funcionamento

| Atributo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | identificador | Sim | |
| batedeira_id | identificador (FK) | Sim | |
| dia_semana | inteiro (0–6) | Sim | |
| abre | hora | Sim | |
| fecha | hora | Sim | |
| ativo | booleano | Sim | Permite desativar um dia sem apagar o registro. |

Fechamento manual (`aberta = false` em Batedeira) prevalece sobre este horário regular (PRD §10.2).

### 3.8 Bairro atendido

| Atributo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | identificador | Sim | |
| batedeira_id | identificador (FK) | Sim | |
| bairro | texto | Sim | No piloto, somente "Centro" é ativo. |
| taxa_entrega_centavos | inteiro | Sim | Pode ser zero (DEC-036). |
| ativo | booleano | Sim | |

### 3.9 Produto

| Atributo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | identificador | Sim | |
| batedeira_id | identificador (FK) | Sim | |
| nome | texto | Sim | |
| descricao | texto | Não | |
| imagem | texto (URL) | Não | |
| volume_ml | inteiro | Sim | Usado para validar o mínimo de 1.000 ml por pedido (PRD §10.3, DEC-020). |
| preco_centavos | inteiro | Sim | Preço armazenado em centavos (PRD §11.1). |
| ativo | booleano | Sim | Exclusão lógica; produto com histórico é arquivado, não apagado (PRD §11.1). |
| disponivel | booleano | Sim | Disponibilidade momentânea, distinta de `ativo`. |
| exibir_indisponivel | booleano | Sim | Batedeira decide se produto indisponível continua visível. |
| atualizado_em | data/hora | Sim | |

### 3.10 Pedido

| Atributo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | identificador | Sim | Formato amigável (ex. `AC-XXXX`), não sequencial previsível. |
| chave_idempotencia | texto | Sim | Evita duplicação em reenvio da mesma requisição (PRD §18.3, `flows.md`). |
| cliente_id | identificador (FK) | Sim | |
| batedeira_id | identificador (FK) | Sim | |
| subtotal_centavos | inteiro | Sim | |
| taxa_entrega_centavos | inteiro | Sim | Cópia da taxa vigente no momento do pedido. |
| total_centavos | inteiro | Sim | |
| endereco_rua, numero, complemento, bairro, referencia | texto | Sim (exceto complemento/referência) | Snapshot do endereço, não referência a `endereco_salvo`. |
| telefone | texto | Sim | Snapshot do telefone de contato. |
| forma_pagamento | enum(dinheiro, pix) | Sim | |
| troco_para_centavos | inteiro | Não | Somente quando `forma_pagamento = dinheiro`. |
| observacao | texto (até 500) | Não | |
| status | enum (10 valores, PRD §12.2) | Sim | Ver seção 4. |
| faixa_estimada | texto | Sim | Cópia da estimativa da batedeira no momento do pedido. |
| prazo_aceite | data/hora | Sim | `criado_em` + 5 minutos (PRD §12.4). |
| criado_em | data/hora | Sim | |
| atualizado_em | data/hora | Sim | |

### 3.11 Item do pedido

| Atributo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | identificador | Sim | |
| pedido_id | identificador (FK) | Sim | |
| produto_id | identificador (FK) | Sim | Referência histórica; não implica que o produto ainda exista/esteja ativo. |
| nome | texto | Sim | Cópia do nome do produto no momento da compra. |
| quantidade | inteiro | Sim | |
| volume_ml | inteiro | Sim | Cópia do volume do produto. |
| preco_unitario_centavos | inteiro | Sim | Cópia do preço do produto. |
| observacao | texto (até 300) | Não | |

### 3.12 Evento da linha do tempo

| Atributo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | identificador | Sim | |
| pedido_id | identificador (FK) | Sim | |
| estado_anterior | enum | Não | Nulo no primeiro evento (criação). |
| estado_novo | enum | Sim | |
| em | data/hora | Sim | |
| autor | texto | Sim | Nome do usuário ou "sistema" (expiração automática). |
| autor_usuario_id | identificador (FK) | Não | Nulo quando autor é o sistema. |
| motivo | texto (até 255) | Não | Obrigatório para recusa, falha de entrega e cancelamento após aceite (PRD §12.3, §13.2). |

### 3.13 Intervenção administrativa (auditoria)

| Atributo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | identificador | Sim | |
| administrador_id | identificador (FK) | Sim | |
| pedido_id | identificador (FK) | Não | Nulo quando a intervenção não está ligada a um pedido (ex.: bloqueio de cliente, ativação de batedeira). |
| batedeira_id | identificador (FK) | Não | Preenchido em ações sobre batedeira (ativar/suspender/reativar). |
| cliente_id | identificador (FK) | Não | Preenchido em ações sobre cliente (bloquear/reativar conta). |
| acao | texto | Sim | Ex.: "Consulta de indicadores", "Bloqueio de conta", "Cancelamento administrativo". |
| motivo | texto | Não | |
| em | data/hora | Sim | |

### 3.14 Notificação

| Atributo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | identificador | Sim | |
| usuario_id | identificador (FK) | Sim | Destinatário (cliente ou operador). |
| pedido_id | identificador (FK) | Não | Nulo para notificações não ligadas a pedido. |
| mensagem | texto | Sim | Predefinida (PRD §13.4) ou gerada por evento de estado. |
| criado_em | data/hora | Sim | |
| lida | booleano | Sim | |

---

## 4. Enumerações de referência

- **status do pedido:** `AGUARDANDO_ACEITE`, `ACEITO`, `EM_PREPARO`, `PRONTO`, `SAIU_PARA_ENTREGA`, `ENTREGUE`, `RECUSADO`, `EXPIRADO`, `CANCELADO`, `FALHA_NA_ENTREGA` (PRD §12.2; transições permitidas em §12.3).
- **status administrativo da batedeira:** `EM_ANALISE`, `ATIVA`, `SUSPENSA`, `DESATIVADA` (PRD §10.1).
- **forma de pagamento:** `DINHEIRO`, `PIX` (PRD §14).

---

## 5. Decisões e suposições assumidas neste rascunho

Estas são interpretações feitas para preencher lacunas do PRD e devem ser confirmadas antes da especificação de engenharia:

1. **Endereço salvo** (múltiplos endereços por cliente, com um principal) não está no PRD 2.5 — foi adicionado ao protótipo em 16/09/2026. Modelado aqui como entidade própria por ser consistente com "cadastrar endereço de entrega" (PRD §8.1), mas precisa de decisão registrada em `decisions.md` se for mantido no MVP formal.
2. **Bloqueio de conta do cliente** (`customerBlocked` no protótipo) também não está explícito no PRD — modelado como atributo do Cliente mais um tipo de Intervenção administrativa, por analogia com suspensão de batedeira. Requer a mesma confirmação.
3. **Painel de ajuda/suporte** do protótipo (`support-panel.tsx`) não gerou uma entidade de dados própria aqui: o PRD trata suporte como canal humano fora do sistema (§13.3, §13.4), não como ticket estruturado. Se o painel evoluir para registrar solicitações de suporte estruturadas, será necessária uma entidade adicional (ex.: `SOLICITACAO_SUPORTE`).
4. **Chave de idempotência do pedido** foi modelada como atributo simples do Pedido (visto em `appendOrder` no protótipo, que compara `customerId` + `requestId`); a unicidade real (índice único composto) é decisão de engenharia, não de modelo conceitual.
5. Não modelei uma entidade separada para "Avaliação" ou "Fidelidade" pois estão explicitamente fora do escopo do MVP (PRD §9).

---

## 6. Pendências para a revisão EER

- Definir tipos de coluna concretos (ex. `DECIMAL` vs `INT` para centavos, `VARCHAR` com tamanhos) no MySQL via Prisma (DEC-023).
- Definir índices (ex. índice único em `pedido.chave_idempotencia` + `cliente_id`; índice em `pedido.status` para a fila do operador).
- Decidir se `endereco_salvo` e `bloqueado` (cliente) entram no MVP formal ou ficam como extensão de protótipo não migrada (ver seção 5).
- Confirmar política de retenção/exclusão de dados pessoais (PRD §17) e seu efeito no modelo (exclusão lógica vs física).
