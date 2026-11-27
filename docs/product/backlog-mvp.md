# Backlog priorizado do MVP — AçaíConecta

**Status:** Aprovado em 28/09/2026 (DEC-046) como ordem de trabalho da Fase 3. Estimativas e divisão em sprints ficam para o planejamento da Fase 3.
**Base:** [PRD 2.8](PRD.md) §8 (escopo funcional), §19 (histórias e critérios de aceite), §25–26 (critérios de prontidão e de lançamento), [decisions.md](decisions.md), [arquitetura-tecnica.md](arquitetura-tecnica.md) e [mer-eer-inicial.md](mer-eer-inicial.md), e a aplicação em `app/`.

> **Nota de 25/11/2026 (DEC-053, DEC-061):** a ordem e as prioridades abaixo continuam sendo a referência, mas a aplicação atual em `app/` cobre apenas parte dos itens, sem banco de dados nem tempo real: o acesso por perfil (login, cadastro de cliente e de batedeira, redefinição de senha) e as telas de cliente, operador e administrador existem com pedidos e catálogo no navegador. Itens que dependem de persistência, SSE, logs, backup e hospedagem seguem **pendentes**. Onde o backlog diz "já prototipado", leia "já implementado em `app/`, ainda sem banco": a lógica deve ser portada, não reescrita.

Convenção de prioridade:

- **P0 — Caminho crítico:** sem isso não existe pedido de ponta a ponta; nenhum outro item tem valor sem estes.
- **P1 — Necessário para o piloto:** exigido pelos critérios de lançamento do PRD (§26) ou pelas decisões já tomadas, mas não bloqueia a primeira transação de pedido em homologação.
- **P2 — Pode entrar depois do primeiro pedido de ponta a ponta:** melhora a operação do piloto, mas o piloto sobrevive sem isso no primeiro dia.
- **Fora do MVP:** mencionado aqui só para não ser confundido com um item esquecido — já está excluído pelo PRD §9.

Cada item referencia a história de usuário (US-xx) ou a seção do PRD que o origina, e a entidade correspondente no MER quando aplicável, para que a rastreabilidade não dependa deste documento sozinho.

---

## Épico 1 — Fundação técnica (pré-requisito de qualquer história)

| # | Item | Prioridade | Origem | Notas |
|---|---|---|---|---|
| 1.1 | Projeto Next.js + TypeScript + Prisma + MySQL provisionado em homologação, a partir da aplicação atual em `app/` | P0 | DEC-023, [arquitetura-tecnica.md §2](arquitetura-tecnica.md#2-visão-geral-da-arquitetura) | Reaproveitar estrutura de `app/`, não recomeçar do zero. |
| 1.2 | Migrações Prisma a partir de [`database/schema.sql`](../../database/schema.sql) e [mer-eer-inicial.md](mer-eer-inicial.md), que já define tipos, índices e a constraint de idempotência (`uq_pedidos_cliente_idempotencia`), com as pendências de [mer-eer-inicial.md §4](mer-eer-inicial.md#4-pendências) fechadas | P0 | PRD §18.3, §24.3 | Bloqueia qualquer persistência real. Abordagem e ordem em [ADR-006](../architecture/ADRs/ADR-006-persistencia.md) (proposta). |
| 1.3 | Sessão de servidor (cookie httpOnly) e verificação de papel em toda mutação | P0 | PRD §16.1, [arquitetura-tecnica.md §7](arquitetura-tecnica.md#7-autenticação-e-autorização) | Sem isso, nenhuma US com controle de acesso pode ser considerada concluída, mesmo que a tela funcione. **Feito em 25/11/2026 (ADR-006, etapa 2):** sessão opaca no banco, layouts de área e rotas de API validam sessão e papel no servidor; faltam as verificações nas mutações de pedido e catálogo, que entram nas etapas 3 a 5. |
| 1.4 | Ambiente de homologação separado de produção | P1 | Roadmap Fase 3; PRD §26 | Critério de lançamento do piloto. |
| 1.5 | Logs de erro centralizados e identificador de requisição correlacionável ao pedido | P1 | PRD §18.5 | Sem isso o suporte não rastreia um caso relatado por telefone. |
| 1.6 | Backup automático do banco com teste de restauração documentado | P1 | PRD §18.3, §26 | Critério de lançamento explícito. |

## Épico 2 — Descoberta e catálogo (cliente)

| # | Item | Prioridade | Origem | Notas |
|---|---|---|---|---|
| 2.1 | Listar batedeiras ativas e aprovadas, distinguindo aberta/fechada e entrega disponível/indisponível | P0 | US-01 | Tabela `batedeiras` ([dicionário de dados](../database/data-dictionary.md#batedeiras)). **Feito:** (25/11/2026, API e telas lendo do banco; falta teste em navegador). |
| 2.2 | Buscar por nome e filtrar por bairro atendido | P0 | US-01, PRD §8.1 | Tabela `batedeiras_bairros` ([dicionário de dados](../database/data-dictionary.md#batedeiras_bairros)). |
| 2.3 | Perfil da batedeira com catálogo, preços, horário e faixa estimada | P0 | US-01, PRD §8.1 | |
| 2.4 | Próximo horário de abertura quando fechada | P1 | PRD §10.2 | Já implementado em `app/lib/domain.ts` (`nextOpeningText`, ordenação por dia/horário); portar a lógica em vez de reescrever. |
| 2.5 | Foto de produto e de batedeira, com upload validado (tipo/tamanho) e armazenamento em bucket de objetos | P1 | DEC-013, [arquitetura-tecnica.md §8](arquitetura-tecnica.md#8-armazenamento-de-arquivos-fotos) | Em `app/` hoje é local/sessão (`photo-field.tsx`); em produção não pode ser blob no banco nem arquivo versionado. |

## Épico 3 — Pedido (cliente)

| # | Item | Prioridade | Origem | Notas |
|---|---|---|---|---|
| 3.1 | Montar sacola com produtos e quantidades, validando volume mínimo de 1 litro | P0 | US-02, PRD §10.3, §12.1 | Tabelas `pedidos` e `itens_pedido` ([dicionário de dados](../database/data-dictionary.md#pedidos)). **Feito:** no servidor, 25/11/2026. |
| 3.2 | Bloquear mistura de batedeiras, produto inativo/indisponível e quantidade inválida | P0 | US-02 | Lógica já implementada e testada (`app/tests/orders.test.mjs`); portar regra e testes. |
| 3.3 | Endereço de entrega em bairro urbano da lista oficial, com batedeiras que o atendem exibidas primeiro (filtro do endereço principal, editável) e taxa exibida antes do envio | P0 | US-02, PRD §10.3, §12.1, DEC-057 | |
| 3.4 | Depois do aceite, escolher dinheiro (com valor de troco) ou Pix on-line | P0 | PRD §14.1, DEC-056, DEC-030 (dinheiro) | Substitui a escolha no envio do pedido. Prazo de 10 min para escolher; sem escolha, `CANCELADO` sem custo (DEC-059). Detalhes do Pix no Épico 9. |
| 3.5 | Enviar pedido com idempotência (reenvio da mesma requisição não duplica) | P0 | US-02, PRD §18.3 | Constraint de banco, não só checagem em memória ([arquitetura-tecnica.md §4](arquitetura-tecnica.md#4-backend--api)). **Feito:** restrição de banco, 25/11/2026. |
| 3.6 | Acompanhar estados do pedido e linha do tempo | P0 | PRD §8.1, §15.2 | Tabela `eventos_pedido` ([dicionário de dados](../database/data-dictionary.md#eventos_pedido)). **Feito:** 25/11/2026, por consulta a cada 5 s. |
| 3.7 | Consultar pedidos recentes / histórico | P1 | PRD §8.1 | |
| 3.8 | Cancelar pedido enquanto `AGUARDANDO_ACEITE` | P0 | US-06 | Caminho crítico da história de cancelamento. **Feito:** 25/11/2026. |
| 3.9 | Cadastro de cliente (nome, telefone, e-mail, senha) e até dois endereços salvos (principal e secundário) | P1 | PRD §8.1, §16.2 | Já implementado em `app/` (`customer-session.ts`, `profile.ts`; endereços no banco desde 25/11/2026). Limite de dois endereços decidido na DEC-040; bloqueio de conta previsto no PRD §16.2. |

## Épico 4 — Resposta e operação do pedido (batedeira)

| # | Item | Prioridade | Origem | Notas |
|---|---|---|---|---|
| 4.1 | Painel protegido, acesso restrito à própria batedeira | P0 | PRD §16.1, §8.2 | |
| 4.2 | Alerta visual de novo pedido com painel aberto | P0 | US-03, PRD §8.2 | Depende do Épico 6 (tempo real). |
| 4.3 | Aceitar ou recusar (com motivo obrigatório) dentro do prazo de 5 minutos | P0 | US-03, DEC-031 | Expiração automática é P0 junto (pedido não respondido não pode ficar limbo). **Feito:** aceite, recusa e expiração no servidor, 25/11/2026. |
| 4.4 | Atualizar estado (`EM_PREPARO` → `PRONTO` → `SAIU_PARA_ENTREGA` → `ENTREGUE`), só transições permitidas | P0 | US-04, PRD §12.3 | Máquina de estados centralizada, um único ponto de validação ([arquitetura-tecnica.md §4](arquitetura-tecnica.md#4-backend--api)). **Feito:** transação com bloqueio, 25/11/2026. |
| 4.5 | Registrar falha de entrega com motivo | P0 | PRD §13.2 | Estado terminal do MVP; sem isso um pedido em rota fica sem desfecho possível. **Feito:** 25/11/2026. |
| 4.6 | Cancelar por impossibilidade operacional antes de `SAIU_PARA_ENTREGA`, com motivo | P0 | US-06, DEC-037 | **Feito:** 25/11/2026. |
| 4.7 | Gerenciar produtos e disponibilidade do catálogo, com tamanhos de 500 ml ou 1 L | P0 | PRD §8.2, §11, DEC-042 | Sem isso o Épico 2 não tem dado real para exibir. Regra de tamanhos já implementada (`allowedProductVolumesMl`). **Feito:** (25/11/2026, no banco). |
| 4.8 | Configurar aberto/fechado e entrega disponível/indisponível, separadamente | P0 | PRD §8.2, §10.1 | |
| 4.9 | Escolher bairros atendidos na lista oficial, com faixa estimada e taxa por bairro; ativação exige ao menos um bairro | P0 | PRD §8.2, §10.3, DEC-057 | Depende da lista oficial de bairros (5.5). **Feito:** (25/11/2026, no banco). |
| 4.10 | Configurar horários regulares por dia da semana e fechamento manual | P1 | PRD §10.2 | Fechamento manual prevalece sobre horário regular — regra já testada em `app/`. |
| 4.11 | Mensagens operacionais predefinidas vinculadas ao pedido | P1 | PRD §13.4 | Contingência de comunicação, não é o caminho crítico do primeiro pedido. |
| 4.12 | Consultar resumo operacional básico (fila, prioridade por horário de criação, faturamento do dia) | P1 | PRD §8.2, §12.6, DEC-043 | Cálculo já implementado em `app/lib/order-presentation.ts` (`storeDailyMetrics`). |

## Épico 5 — Administração

| # | Item | Prioridade | Origem | Notas |
|---|---|---|---|---|
| 5.1 | Cadastro da batedeira (autocadastro pelo site, DEC-054, com CPF/CNPJ, DEC-055) + vínculo de um operador responsável e ativação pelo administrador | P0 | US-05, DEC-033, DEC-054 | Sem isso não existe batedeira nenhuma para operar o piloto. A conta nasce `EM_ANALISE`; a elegibilidade é verificada fora do sistema (DEC-048). |
| 5.2 | Ativar, suspender e reativar batedeira, com auditoria | P0 | US-05 | Tabela `eventos_auditoria` ([dicionário de dados](../database/data-dictionary.md#eventos_auditoria)). **Feito:** (situação e auditoria no banco em 25/11/2026). |
| 5.3 | Consultar pedidos e histórico de estados de qualquer batedeira | P1 | PRD §8.3 | |
| 5.4 | Registrar intervenções de suporte (mensagem, cancelamento administrativo) e configurar o contato de suporte | P1 | PRD §8.3, §13.4 | **Feito:** intervenções em 25/11/2026 e contato de suporte no banco em 27/11/2026. |
| 5.5 | Manter a lista oficial de bairros urbanos (13 bairros, `bairros_cameta.txt`), sem habilitação individual | P0 | PRD §8.3, DEC-057 | Pré-requisito de 4.9. |
| 5.6 | Moderar imagens e informações públicas | P2 | PRD §8.3 | Necessário antes de abrir para batedeiras fora da seleção inicial; não bloqueia o piloto controlado com 3 batedeiras pré-aprovadas. |
| 5.7 | Painel de métricas do piloto (resposta em 5 min, taxa de aceite, conclusão, cancelamento, recompra) | P1 | PRD §5.2–5.4, §8.3 | **Feito em parte (27/11/2026):** calculado no servidor; falta medir visitantes e pedidos iniciados (PRD §5.4). |
| 5.8 | Acesso à trilha de auditoria completa | P1 | PRD §8.3, §18.5 | |
| 5.9 | Envio de documentos pela batedeira no cadastro e conferência pelo administrador antes da ativação | P1 | DEC-065 | Antes do piloto. Depende da lista de documentos, do armazenamento (ADR-003) e de mudança no schema. |

## Épico 6 — Atualização em tempo real (transversal)

| # | Item | Prioridade | Origem | Notas |
|---|---|---|---|---|
| 6.1 | Atualização em tempo real por SSE na fila do operador, no acompanhamento do cliente e na consulta do administrador, com retomada após queda e consulta periódica como contingência | P0 | [ADR-002](../architecture/ADRs/ADR-002-atualizacao-em-tempo-real.md), [arquitetura-tecnica.md §5](arquitetura-tecnica.md#5-dados-em-tempo-real-pedidos-e-alertas) | Pré-requisito técnico dos itens 3.6 e 4.2. Exige hospedagem com conexões persistentes. |

## Épico 7 — Confiabilidade, segurança e conformidade

| # | Item | Prioridade | Origem | Notas |
|---|---|---|---|---|
| 7.1 | Transições de estado como transação atômica no banco | P0 | PRD §18.3, [arquitetura-tecnica.md §11](arquitetura-tecnica.md#11-confiabilidade-e-integridade-de-dados) | Sem isso a corrida operador-aceita/sistema-expira é um bug de dados real, não hipotético. **Feito:** 25/11/2026, com teste de corrida. |
| 7.2 | Hash de senha com algoritmo lento (scrypt, argon2 ou bcrypt; scrypt, DEC-062) | P0 | PRD §17 | Não negociável mesmo em piloto pequeno — dado pessoal real de cliente e operador. |
| 7.3 | Limitação de tentativas de login e encerramento de sessão | P1 (**feito para o login em 25/11/2026**) | PRD §16.2, [ADR-001](../architecture/ADRs/ADR-001-sessoes-e-tentativas-de-login.md) | Tabelas `sessoes` e `tentativas_login` (schema 0.8); limitação por e-mail e por origem, conforme a ADR-001. |
| 7.4 | Recuperação de senha pelo próprio usuário, por e-mail | P1 | PRD §16.2, DEC-064 | Telas e link de uso único prontos em `app/`; **falta o serviço de e-mail**, obrigatório antes do piloto. A recuperação assistida foi retirada. |
| 7.8 | Área **Minha conta** nos três perfis (dados pessoais, e-mail, senha, endereços do cliente e cadastro da batedeira) | P1 | DEC-063, PRD §8 | **Feito:** 25/11/2026; telas ainda não verificadas em navegador. |
| 7.5 | Política de privacidade, termos de uso e finalidade documentada por dado coletado | P1 | PRD §17, §26 | Gate externo (jurídico) — não é trabalho de engenharia, mas é pré-condição do critério de lançamento. Fica por conta do responsável pelo produto/jurídico, não da equipe técnica. |
| 7.6 | Anonimização de dados pessoais desacoplada do registro operacional do pedido | P2 | PRD §17, [arquitetura-tecnica.md §11](arquitetura-tecnica.md#11-confiabilidade-e-integridade-de-dados) | Necessária antes de excluir qualquer dado de cliente, mas não bloqueia o primeiro pedido do piloto. |
| 7.7 | Alerta para falha recorrente no fluxo de criação/transição de pedido | P2 | PRD §18.5 | Reforça o P1 de logs (1.5); pode chegar na segunda iteração do piloto. |

## Épico 8 — Acessibilidade e usabilidade (transversal)

| # | Item | Prioridade | Origem | Notas |
|---|---|---|---|---|
| 8.1 | Navegação por teclado, foco visível em modais, rótulos em campos, estado não comunicado só por cor | P0 | PRD §18.4 | Definition of Done de cada tela nova, não revisão isolada ao final ([arquitetura-tecnica.md §3](arquitetura-tecnica.md#3-frontend)) — já é o padrão seguido em `app/`. |
| 8.2 | Responsividade em tela móvel, sem rolagem horizontal | P0 | PRD §18.1 | |
| 8.3 | Testes de acessibilidade, conexão instável e múltiplos navegadores | P1 | PRD §18.1–18.2, roadmap Fase 2 | Ainda pendente (a verificação com axe-core feita em 23/11/2026, na versão anterior, está no CHANGELOG e no histórico do Git); deve ser feito antes do lançamento do piloto, não necessariamente antes do primeiro código da Fase 3. |

## Épico 9 — Pagamento Pix, estorno e contestação (DEC-056, DEC-058)

Itens novos, ainda sem prioridade e ordem aprovadas; dependem do ADR do provedor de pagamento.

| # | Item | Prioridade | Origem | Notas |
|---|---|---|---|---|
| 9.1 | ADR do provedor de pagamento (conta conectada, estorno, custo da tarifa no piloto) | P0 | DEC-056, DEC-058, DEC-066 | Gate para os demais itens do épico. [ADR-005](../architecture/ADRs/ADR-005-provedor-de-pagamento-pix.md): comparação feita, provedor não escolhido, prova em sandbox pendente; **adiado para antes do piloto** (DEC-066). |
| 9.2 | Cadastro assistido da batedeira no provedor, guardando só identificador e status; Pix só após verificada | P0 | PRD §14.4 | |
| 9.3 | Estado `AGUARDANDO_PAGAMENTO`, expiração em 10 min (escolha da forma e pagamento do Pix) e encerramento sem custo | P0 | PRD §12.2, §14.1 | Máquina de estados centralizada (4.4, 7.1). |
| 9.4 | Webhook do provedor idempotente, com verificação de assinatura e trilha de auditoria | P0 | PRD §14.1, AGENTS.md | Testes obrigatórios. |
| 9.5 | Estorno em até 24 h (cancelamento de pedido pago e falha na entrega) pela batedeira ou administrador | P0 | PRD §14.2 | |
| 9.6 | Contestação: abertura pelo cliente, motivos, prazo, decisão pelo administrador e alerta de 1 h | P0 | PRD §14.3 | |
| 9.7 | Faturamento do dia com Pix na confirmação, dinheiro na entrega e estorno no dia em que ocorre | P1 | PRD §14.5, DEC-043 | Lançamentos de estorno com data própria. |
| 9.8 | Política de privacidade e termos com dados de pagamento e contestação | P1 | PRD §17 | Soma-se ao 7.5. |

---

## Sequência sugerida (não é sprint, é ordem de dependência)

1. **Fundação (Épico 1) + máquina de estados e idempotência (7.1, 3.5)** — sem isso nenhuma US é testável de verdade, só "parece funcionar" como na aplicação atual, com dados no navegador.
2. **Caminho crítico do pedido de ponta a ponta**: Épicos 2–4 nos itens P0, com a atualização em tempo real (Épico 6) já embutida, porque "alerta visual" e "linha do tempo" são P0 e dependem dele.
3. **Administração P0** (5.1, 5.2 e 5.5): sem batedeira cadastrada e aprovada e sem bairro habilitado, os épicos 2–4 não têm dado real para operar em homologação.
4. **Segurança P0** (7.2) acompanha a autenticação desde o início — não é um item à parte a adicionar depois.
5. **Itens P1**: fecham os critérios de lançamento do PRD §26 (backup, ambientes, métricas, mensagens operacionais, recuperação de acesso, política de privacidade).
6. **Itens P2**: entram durante o piloto ou na preparação final, sem bloquear o primeiro pedido em homologação.

## O que este backlog deliberadamente não decide

- Estimativas de esforço ou distribuição em sprints — depende de capacidade da equipe de implementação, não definida neste documento.
- Detalhes de schema e índices (definidos em [`database/schema.sql`](../../database/schema.sql); pendências em [mer-eer-inicial.md §4](mer-eer-inicial.md#4-pendências)).
- Provedores de infraestrutura concretos (gate externo, PRD §24.2).
