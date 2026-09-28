# Arquitetura técnica proposta — AçaíConecta

**Status:** Aprovada em 28/09/2026 (DEC-046). As escolhas de infraestrutura concreta (provedor de hospedagem, banco gerenciado, e-mail, etc.) são gates externos da Fase 3 (PRD §24.2) e não são fixadas aqui.
**Base:** [PRD 2.6](PRD.md) §18 (requisitos não funcionais), §24.3 (baseline tecnológica: DEC-023), [decisions.md](decisions.md), [roadmap.md](roadmap.md) (entregáveis e critérios de conclusão da Fase 3), e o protótipo em `prototypes/web/`.

Escopo desta proposta: arquitetura para a Fase 3 (construção do MVP), dimensionada para um piloto de 3 a 5 batedeiras em um único bairro, sem processamento de pagamento pela plataforma. Não é uma arquitetura para escala regional (Fase 6).

---

## 1. Princípios que orientam as escolhas

- Operação pequena e acompanhada de perto (PRD §7): não há necessidade de arquitetura distribuída, filas de mensagens, ou múltiplos serviços.
- DEC-023 já fixou a baseline: monólito modular em TypeScript, Next.js, React, Tailwind CSS, MySQL e Prisma, com frontend e backend na mesma base de código durante o MVP.
- Confiabilidade sobre volume de funcionalidades (PRD §7): priorizar transições de estado atômicas e idempotência (PRD §18.3) antes de qualquer otimização de performance.
- Minimizar dependências externas (PRD §23, risco "Dependência excessiva de fornecedor"): evitar acoplamento a serviços proprietários difíceis de substituir.
- Sem processamento financeiro pela plataforma (DEC-030): reduz drasticamente a superfície de conformidade (não há PCI-DSS, não há custódia de valores).

## 2. Visão geral da arquitetura

```
┌─────────────────────────────────────────────────────────┐
│  Aplicação web responsiva e instalável (PWA)             │
│  Next.js (App Router) + React + TypeScript + Tailwind    │
│  Três áreas: /cliente, /operador, /admin                 │
└───────────────┬─────────────────────────────────────────┘
                │ Server Actions / Route Handlers (mesma base)
┌───────────────▼─────────────────────────────────────────┐
│  Camada de domínio (TypeScript, no mesmo monorepo)        │
│  - Regras de pedido e máquina de estados                 │
│  - Validações (catálogo, cobertura, volume mínimo)        │
│  - Autorização por papel (servidor, não só interface)     │
└───────────────┬─────────────────────────────────────────┘
                │ Prisma Client
┌───────────────▼─────────────────────────────────────────┐
│  MySQL (gerenciado)                                       │
└─────────────────────────────────────────────────────────┘

Componentes de apoio (fora do monólito, mas necessários):
- Armazenamento de arquivos para fotos de produto/batedeira.
- Observabilidade (logs, erros, métricas).

A autenticação fica dentro do monólito, com sessões e tentativas de login no MySQL (ADR-001).
```

Não há necessidade de um backend separado nem de comunicação entre serviços: Next.js com Route Handlers/Server Actions atende "monólito modular" (DEC-023) mantendo frontend e API na mesma base.

## 3. Frontend

- **Next.js (App Router) + React + TypeScript + Tailwind CSS**, como já validado no protótipo (`prototypes/web/`). Reaproveitar componentes e lógica de domínio já escritos ali sempre que a regra de negócio coincidir com o PRD vigente (endereços salvos seguem a DEC-040, com no máximo dois por cliente; ver [mer-eer-inicial.md §3](mer-eer-inicial.md#3-decisões-e-suposições-de-modelagem)).
- **PWA instalável**: manifest + service worker mínimo para instalação em tela inicial (PRD exige "web responsiva e instalável", sem exigir app nativo). Não usar o service worker para funcionamento offline completo no MVP — pedidos exigem conectividade; o objetivo é só a instalabilidade e um retorno gracioso em conexão instável (PRD §18.2, §23 "Internet instável").
- **Três áreas por papel** (`/cliente`, `/operador`, `/admin`), como já estruturado no protótipo, cada uma atrás de verificação de sessão e papel no servidor.
- **Acessibilidade** (PRD §18.4): manter os padrões já aplicados no protótipo (foco em modais, navegação por teclado, rótulos) como parte do Definition of Done de cada tela nova, não como revisão isolada ao final.

## 4. Backend / API

- **Route Handlers e Server Actions do Next.js**, sem framework de API separado. Evita uma segunda base de código e um segundo deploy, coerente com "reduzir complexidade operacional" (DEC-023).
- **Autorização no servidor** (PRD §16.1): toda mutação (criar pedido, transicionar estado, ações administrativas) revalida o papel e o vínculo do usuário (ex.: operador só age sobre a própria batedeira) na camada de domínio, não apenas na interface — a função `applyTransition` do protótipo (`lib/mock-data.ts`) já modela esse formato de verificação e pode ser o ponto de partida.
- **Idempotência de criação de pedido** (PRD §18.3): chave de idempotência por cliente, verificada com uma restrição única no banco antes de qualquer lógica de aplicação (o protótipo simula isso em memória com `appendOrder`; em produção isso deve ser uma constraint de banco para resistir a concorrência real, não apenas a lógica de aplicação).
- **Máquina de estados do pedido** centralizada em uma única função/módulo de domínio (como já é no protótipo), para que toda transição passe pelo mesmo ponto de validação, independente de qual rota a chamou.

## 5. Dados em tempo real: pedidos e alertas

O PRD exige alerta visual de novo pedido enquanto o painel do operador estiver aberto (§8.2) e atualização da linha do tempo para o cliente (§15.2), mas **exclui Web Push, SMS e e-mail transacional do MVP** (DEC-035). A atualização acontece somente com a aplicação aberta.

Decisão registrada na [ADR-002](../architecture/ADRs/ADR-002-atualizacao-em-tempo-real.md): **atualização em tempo real por Server-Sent Events (SSE)**, por exigência do responsável pelo projeto.

- Fila do operador, acompanhamento do cliente e consulta do administrador recebem os eventos de `eventos_pedido` por uma conexão SSE, com atraso de até cerca de 2 segundos.
- Ao reconectar, o navegador retoma a partir do último evento recebido, sem perda nem duplicação.
- Se a conexão SSE falhar repetidamente, a tela passa a consultar o servidor periodicamente e avisa que a atualização pode atrasar.
- A hospedagem precisa manter conexões abertas por longos períodos (servidor Node.js persistente ou contêiner), o que restringe a escolha de infraestrutura (§9).

## 6. Banco de dados

- **MySQL gerenciado + Prisma** (DEC-023). Prisma cobre migrações versionadas, o que atende ao requisito de manter histórico de alterações estruturado (PRD §18.3).
- Estrutura oficial em [`database/schema.sql`](../../database/schema.sql) (versão 0.7), que já define tipos de coluna, índices (inclusive a constraint de idempotência do pedido e o índice da fila do operador) e exclusão lógica; modelo conceitual em [mer-eer-inicial.md](mer-eer-inicial.md). A política de retenção e anonimização de dados pessoais está definida provisoriamente na DEC-047. Sessões e tentativas de login já foram decididas na [ADR-001](../architecture/ADRs/ADR-001-sessoes-e-tentativas-de-login.md).
- **Preços e taxas em centavos como inteiro** (PRD §11.1), nunca ponto flutuante, para evitar erro de arredondamento em somas de pedido.

## 7. Autenticação e autorização

- Sessão de servidor opaca (cookie `httpOnly`), persistida no banco, com token novo a cada login e duração de 30 dias renováveis para cliente e 12 horas para operador e administrador (ADR-001), sem login social (fora do escopo, PRD §16.2).
- Cadastro do cliente com e-mail e senha; senha sempre armazenada como hash (nunca texto puro) com algoritmo lento (argon2id ou bcrypt), mínimo de 8 caracteres e recusa de senhas comuns ou vazadas (ADR-001).
- Limitação de tentativas de login e encerramento de sessão (PRD §16.2) implementados na camada de domínio, não em serviço terceirizado — volume do piloto não justifica um provedor de identidade externo. Sessões e tentativas ficam no banco, com o token armazenado somente como hash, conforme a [ADR-001](../architecture/ADRs/ADR-001-sessoes-e-tentativas-de-login.md) (tabelas `sessoes` e `tentativas_login`, schema 0.7), com limitação por e-mail e por origem.
- Recuperação de acesso assistida pelo administrador durante o piloto (PRD §16.2), sem fluxo de "esqueci minha senha" automatizado por e-mail — coerente com a exclusão de e-mail transacional do MVP (DEC-035).

## 8. Armazenamento de arquivos (fotos)

- Fotos de produto e de batedeira (DEC-013: fotos entram no MVP, vídeos não) precisam de um armazenamento de objetos (ex. um bucket compatível com S3) e não devem ser guardadas como blob no banco relacional.
- Validação de tipo e tamanho de upload no servidor (PRD §17, lista de requisitos antes do piloto).
- Servir imagens redimensionadas/otimizadas (PRD §18.2) usando o componente de otimização de imagem do Next.js já em uso no protótipo (`next/image`), apontando para o bucket em vez de arquivos locais versionados no repositório.

## 9. Hospedagem e ambientes

- A atualização em tempo real (ADR-002) exige hospedagem que mantenha conexões abertas por longos períodos; plataformas de funções sem estado com limite curto por requisição não atendem sem ajustes.
- Dois ambientes mínimos exigidos pelo roadmap da Fase 3: **homologação** e **produção**. Ambiente de desenvolvimento local via `pnpm dev`, como já configurado no protótipo.
- A escolha do provedor concreto (ex. Vercel para o Next.js, provedor gerenciado de MySQL) é um gate externo da Fase 3 (PRD §24.2) e não é decidida aqui — mas a arquitetura proposta (Next.js + MySQL gerenciado) é compatível com qualquer provedor que ofereça ambos sem exigir infraestrutura própria de servidor (nenhum requisito aqui força um provedor específico).
- Variáveis de ambiente e segredos (string de conexão do banco, chave de sessão) nunca versionados; seguir o padrão já usado no protótipo (`.gitignore` cobrindo arquivos locais de ambiente).

## 10. Backup, monitoramento e observabilidade

Exigidos como critério de conclusão da Fase 3 (roadmap) e como requisito do PRD (§18.5, §17):

- **Backup**: backup automático diário do banco gerenciado, com teste de restauração documentado antes do lançamento do piloto (PRD §26 exige isso como critério de lançamento).
- **Logs de erro centralizados**: captura de exceções do servidor (ex. um serviço de logging/erro gerenciado, a definir no gate externo da Fase 3) — sem isso, um erro em produção durante o piloto fica invisível até o usuário reclamar.
- **Identificação de requisições e pedidos em suporte** (PRD §18.5): incluir um identificador de requisição correlacionável ao `id` do pedido nos logs, para que o suporte consiga rastrear um caso relatado por telefone/WhatsApp até o registro correspondente.
- **Métricas operacionais**: os cálculos já prototipados em `lib/order-presentation.ts` (`pilotMetrics`: tempo de resposta, taxa de aceite, taxa de expiração, reincidência de clientes) são o ponto de partida direto para o painel administrativo de métricas do MVP (PRD §8.3, §5.4) — a lógica pode migrar quase diretamente da simulação em memória para uma consulta ao banco real.
- **Alertas para falhas críticas** (PRD §18.5): definir no mínimo um alerta para erro recorrente no fluxo de criação/transição de pedido, já que é o caminho crítico do produto.

## 11. Confiabilidade e integridade de dados

- Transições de estado do pedido devem ser **transações atômicas** no banco (PRD §18.3): ler o estado atual, validar a transição permitida e gravar o novo estado + evento de linha do tempo em uma única transação, para evitar corrida entre, por exemplo, o operador aceitando e o sistema expirando o mesmo pedido simultaneamente.
- A expiração automática de pedidos (PRD §12.4) precisa de um mecanismo de execução periódica no servidor (ex. um job agendado ou verificação lazy a cada leitura, como o protótipo faz em `expireOrders`) — decisão de engenharia a detalhar na especificação técnica, não neste documento.
- Falhas externas não devem apagar pedidos confirmados (PRD §18.3): nenhuma operação de limpeza automática deve remover pedidos; exclusão de dados pessoais (PRD §17) deve ser desacoplada do registro operacional do pedido (ex. anonimizar em vez de apagar a linha).

## 12. O que este documento deliberadamente não decide

- Provedor de hospedagem, banco gerenciado e serviço de armazenamento de arquivos concretos (gate externo, PRD §24.2).
- Serviço de observabilidade/erro específico.
- Detalhes de schema (tipos de coluna, índices) — definidos em [`database/schema.sql`](../../database/schema.sql); pendências em [mer-eer-inicial.md §4](mer-eer-inicial.md#4-pendências).
- Mecanismo exato de agendamento da expiração automática de pedidos.

Sessões e tentativas de login estão decididas na ADR-001, e a atualização em tempo real, na ADR-002.

Essas decisões pertencem à especificação de engenharia da Fase 3 e devem ser registradas como ADRs em `docs/architecture/ADRs/` quando tomadas; somente decisões de produto e negócio vão para `decisions.md`.
