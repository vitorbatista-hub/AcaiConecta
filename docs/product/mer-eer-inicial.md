# Modelo conceitual e MER inicial — AçaíConecta

**Status:** Aprovado em 28/09/2026 (DEC-046), junto com o schema SQL 0.7, o modelo EER (`database/acai_conecta.mwb`) e o dicionário de dados.
**Base:** [PRD 2.6](PRD.md), [decisions.md](decisions.md), [flows.md](flows.md), [`database/schema.sql`](../../database/schema.sql) (versão 0.7, fonte oficial da estrutura) e o protótipo (`prototypes/web/lib/mock-data.ts`, `customer-session.ts`, `order-presentation.ts`).

Este documento descreve entidades, relacionamentos e decisões de modelagem a partir das regras do MVP, alinhado ao schema SQL 0.7. O significado de cada campo e a regra de negócio correspondente ficam somente no [dicionário de dados](../database/data-dictionary.md), para não manter a mesma descrição em dois lugares. Ele não substitui o PRD: qualquer conflito entre este modelo e o PRD ou o `decisions.md` deve ser resolvido nessas fontes; qualquer conflito com o schema deve ser corrigido aqui ou registrado como mudança do schema.

---

## 1. Modelo conceitual (visão geral)

Entidades centrais e como se relacionam:

- **Usuário** é a superclasse de **Cliente**, **Operador** e **Administrador** (um papel por usuário no MVP, DEC-033 / PRD §16.1). No schema, a especialização é implementada em tabela única (`usuarios`), discriminada pela coluna `tipo`; as especializações não têm atributos próprios.
- **Usuário** tem **Sessões** de login; **Tentativas de login** são registradas pelo e-mail informado e pela origem (IP guardado como HMAC), sem vínculo com o usuário, para limitar tentativas (PRD §16.2, ADR-001).
- **Batedeira** tem um único **Operador** responsável (DEC-033), referenciado por `batedeiras.responsavel_id`, e mantém um **Catálogo** de **Produtos**.
- **Bairro** é o vocabulário canônico de áreas (`bairros`), usado pelo endereço da batedeira, pelos endereços dos clientes e pela cobertura de entrega.
- **Batedeira** define **Horário de funcionamento** e **Bairros atendidos** com **Taxa de entrega** própria (DEC-036); no piloto, somente o Centro (DEC-019).
- **Cliente** possui **Endereços salvos** (0..2: um principal e um secundário), desdobramento de "cadastrar endereço de entrega" (PRD §8.1) registrado na DEC-040.
- **Pedido** pertence a um **Cliente** e a uma **Batedeira**, contém **Itens do pedido** (cópia imutável de nome, unidade, volume e preço no momento da compra, PRD §11.1) e uma cópia (snapshot) do endereço de entrega, preservada mesmo se o endereço salvo for editado ou desativado.
- **Pedido** tem uma **Linha do tempo** (1..N eventos) — registro operacional de criação, transições, recusas, cancelamentos, mensagens operacionais e intervenções administrativas sobre o pedido.
- **Administrador** registra **Eventos de auditoria** para ações administrativas sensíveis que não pertencem exclusivamente à linha do tempo de um pedido (ativar/suspender batedeira, bloquear/reativar conta, consultas sensíveis).
- **Notificações** não formam entidade própria: são derivadas dos eventos da linha do tempo e dos campos de estado e prazo do pedido, pois o MVP usa apenas linha do tempo e alertas visuais no painel (PRD §15.2, DEC-035).

Fora do modelo (explicitamente fora do escopo do MVP, PRD §9): pagamento processado pela plataforma, avaliações públicas, fidelidade, chat livre, documentos de cadastro da batedeira.

---

## 2. Diagrama entidade-relacionamento (notação textual)

```
USUARIO {tipo = CLIENTE | OPERADOR | ADMINISTRADOR}   [especialização total e disjunta, tabela única]

OPERADOR (1) ─────── (0..1) BATEDEIRA           [batedeiras.responsavel_id, único; DEC-033]
BAIRRO (1) ───────< (0..N) BATEDEIRA            [localização do estabelecimento]
BATEDEIRA (1) ────< (0..N) PRODUTO
BATEDEIRA (1) ────< (0..N) HORARIO_FUNCIONAMENTO
BATEDEIRA (N) >───< (N) BAIRRO                  [BAIRRO_ATENDIDO, com taxa de entrega própria]

USUARIO (1) ──────< (0..N) SESSAO
TENTATIVA_LOGIN                                 [sem vínculo; e-mail informado e origem como HMAC]

CLIENTE (1) ──────< (0..2) ENDERECO_SALVO >──── (1) BAIRRO   [ativos; um principal]
CLIENTE (1) ──────< (0..N) PEDIDO
BATEDEIRA (1) ────< (0..N) PEDIDO
ENDERECO_SALVO (0..1) ──< (0..N) PEDIDO         [referência opcional; o pedido guarda snapshot]

PEDIDO (1) ───────< (1..N) ITEM_PEDIDO >─────── (0..1) PRODUTO   [cópia de nome/unidade/volume/preço]
PEDIDO (1) ───────< (1..N) EVENTO_PEDIDO >───── (0..1) USUARIO   [autor; nulo quando processo automático]

ADMINISTRADOR (1) ─< (0..N) EVENTO_AUDITORIA    [entidade afetada por referência lógica]
```

Cardinalidades seguem as regras do MVP: um pedido pertence a exatamente um cliente e uma batedeira; um item de pedido pode perder a referência ao produto sem perder os dados copiados; uma batedeira tem exatamente um operador responsável e um operador responde por no máximo uma batedeira durante o piloto.

---

## 3. Decisões e suposições de modelagem

1. **Endereços salvos** (DEC-040, decidida em 28/09/2026): no máximo dois ativos por cliente, um principal e um secundário, com exclusão lógica. O limite e a unicidade do principal são validados pela aplicação na mesma transação da gravação, pois o MySQL não expressa essas regras por restrição simples.
2. **Bloqueio de conta** (PRD §16.2): modelado como `status` de Usuário, com o motivo no evento de auditoria; bloquear encerra as sessões ativas.
3. **Telefone de contato do pedido** (confirmado pelo responsável pelo projeto em 28/09/2026): não é copiado para o pedido; usa-se sempre o telefone atual do cadastro do Cliente. O PRD §12.1 não o lista entre os dados mínimos, e a minimização do PRD §17.1 desaconselha duplicá-lo. Consequência: se o cliente trocar o telefone, os pedidos antigos passam a mostrar o número novo.
4. **Sessões e tentativas de login** persistidas no banco, com token armazenado apenas como hash e tentativas expurgadas após a janela de limitação ([ADR-001](../architecture/ADRs/ADR-001-sessoes-e-tentativas-de-login.md)).
5. **Notificações** não são entidade: derivam de `eventos_pedido` e de `pedidos.expira_aceite_em` (PRD §15.2, DEC-035); não há marcação de leitura.
6. **Ações administrativas sobre um pedido** ficam na linha do tempo do pedido; as demais ações administrativas sensíveis ficam em `eventos_auditoria`.
7. **Painel de ajuda/suporte** do protótipo (`support-panel.tsx`) não gerou entidade: o PRD trata suporte como canal humano fora do sistema (§13.3, §13.4). Se evoluir para solicitações estruturadas, exigirá entidade própria (ex.: `SOLICITACAO_SUPORTE`).
8. Não há entidades para "Avaliação" ou "Fidelidade", explicitamente fora do escopo do MVP (PRD §9).
9. **Tamanhos de produto** (DEC-042): somente 500 ml e 1 L, validados pela aplicação; o banco exige apenas volume positivo, para que um novo tamanho não dependa de migração durante o piloto.
10. **Faturamento do dia** (DEC-043) não é armazenado: é calculado a partir de `pedidos.total_centavos`, `pedidos.status` e `pedidos.criado_em`.

---

## 4. Pendências

- O `.mwb` não representa as restrições `CHECK` nem o charset do banco; por isso o banco deve ser criado sempre a partir do `schema.sql`, nunca pela engenharia direta do Workbench.
- Política de retenção provisória (DEC-047): anonimização dos dados pessoais na exclusão da conta, sem apagar pedidos. A forma de anonimizar `usuarios` (sem violar `uq_usuarios_email` e `ck_usuarios_telefone_cliente`) e os snapshots de endereço de `pedidos` (colunas obrigatórias) deve ser definida na especificação de engenharia.
