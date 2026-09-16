# Arquitetura técnica proposta — AçaíConecta

**Status:** Rascunho para revisão humana. Não representa decisão de arquitetura encerrada nem conclusão da Fase 2. As escolhas de infraestrutura concreta (provedor de hospedagem, banco gerenciado, e-mail, etc.) são gates externos da Fase 3 (PRD §24.2) e não são fixadas aqui.
**Base:** [PRD 2.5](PRD.md) §18 (requisitos não funcionais), §24.3 (baseline tecnológica: DEC-023), [decisions.md](decisions.md), [roadmap.md](roadmap.md) (entregáveis e critérios de conclusão da Fase 3), e o protótipo em `prototypes/web/`.

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
- Autenticação (sessão do usuário).
- Observabilidade (logs, erros, métricas).
```

Não há necessidade de um backend separado nem de comunicação entre serviços: Next.js com Route Handlers/Server Actions atende "monólito modular" (DEC-023) mantendo frontend e API na mesma base.

## 3. Frontend

- **Next.js (App Router) + React + TypeScript + Tailwind CSS**, como já validado no protótipo (`prototypes/web/`). Reaproveitar componentes e lógica de domínio já escritos ali sempre que a regra de negócio coincidir com o PRD vigente (o protótipo tem extensões — login/cadastro, endereços salvos — ainda não formalizadas em `decisions.md`; ver [mer-eer-inicial.md §5](mer-eer-inicial.md#5-decisões-e-suposições-assumidas-neste-rascunho)).
- **PWA instalável**: manifest + service worker mínimo para instalação em tela inicial (PRD exige "web responsiva e instalável", sem exigir app nativo). Não usar o service worker para funcionamento offline completo no MVP — pedidos exigem conectividade; o objetivo é só a instalabilidade e um retorno gracioso em conexão instável (PRD §18.2, §23 "Internet instável").
- **Três áreas por papel** (`/cliente`, `/operador`, `/admin`), como já estruturado no protótipo, cada uma atrás de verificação de sessão e papel no servidor.
- **Acessibilidade** (PRD §18.4): manter os padrões já aplicados no protótipo (foco em modais, navegação por teclado, rótulos) como parte do Definition of Done de cada tela nova, não como revisão isolada ao final.

## 4. Backend / API

- **Route Handlers e Server Actions do Next.js**, sem framework de API separado. Evita uma segunda base de código e um segundo deploy, coerente com "reduzir complexidade operacional" (DEC-023).
- **Autorização no servidor** (PRD §16.1): toda mutação (criar pedido, transicionar estado, ações administrativas) revalida o papel e o vínculo do usuário (ex.: operador só age sobre a própria batedeira) na camada de domínio, não apenas na interface — a função `applyTransition` do protótipo (`lib/mock-data.ts`) já modela esse formato de verificação e pode ser o ponto de partida.
- **Idempotência de criação de pedido** (PRD §18.3): chave de idempotência por cliente, verificada com uma restrição única no banco antes de qualquer lógica de aplicação (o protótipo simula isso em memória com `appendOrder`; em produção isso deve ser uma constraint de banco para resistir a concorrência real, não apenas a lógica de aplicação).
- **Máquina de estados do pedido** centralizada em uma única função/módulo de domínio (como já é no protótipo), para que toda transição passe pelo mesmo ponto de validação, independente de qual rota a chamou.

## 5. Dados em tempo real: pedidos e alertas

O PRD exige alerta visual de novo pedido enquanto o painel do operador estiver aberto (§8.2) e linha do tempo/atualizações essenciais para o cliente (§15.2), mas **exclui explicitamente Web Push, SMS e e-mail transacional do MVP** (DEC-035). Isso restringe a decisão a mecanismos dentro da aba aberta:

- **Recomendado: polling curto (ex. a cada 5–10 segundos)** nas telas de operador (fila de pedidos) e cliente (acompanhamento do pedido próprio), via Server Actions ou Route Handlers simples.
  - Justificativa: volume esperado é baixo (piloto de 3–5 batedeiras, dezenas de pedidos/dia), então o custo de polling é desprezível; evita a complexidade operacional de manter conexões WebSocket vivas, reconexão e escala de estado de conexão, que não se paga nesse volume.
- **Alternativa descartada por ora: WebSocket/SSE.** Traria atualização mais instantânea, mas exige infraestrutura adicional (servidor com conexões persistentes, ou serviço gerenciado de terceiros) — um acoplamento a mais que contraria o princípio de "arquitetura simples" (PRD §23). Reconsiderar somente se o piloto mostrar que o atraso do polling prejudica a operação (ex.: operador perde pedidos por não notar a tela a tempo dentro do prazo de 5 minutos de aceite).
- O requisito "operador mantém o painel aberto durante o horário do piloto" (PRD §15.2) já assume uma aba ativa, o que torna polling suficiente e evita depender de notificação do sistema operacional.

## 6. Banco de dados

- **MySQL gerenciado + Prisma** (DEC-023). Prisma cobre migrações versionadas, o que atende ao requisito de manter histórico de alterações estruturado (PRD §18.3).
- Modelo inicial: ver [mer-eer-inicial.md](mer-eer-inicial.md). Pontos que a especificação de engenharia deve fechar antes da Fase 3: tipos de coluna, índices (em especial a constraint de idempotência do pedido e um índice em `status` para a fila do operador) e política de exclusão lógica vs física de dados pessoais (PRD §17).
- **Preços e taxas em centavos como inteiro** (PRD §11.1), nunca ponto flutuante, para evitar erro de arredondamento em somas de pedido.

## 7. Autenticação e autorização

- Sessão de servidor (cookie de sessão httpOnly), sem login social (fora do escopo, PRD §16.2).
- Cadastro do cliente com e-mail e senha; senha sempre armazenada como hash (nunca texto puro) com algoritmo lento (ex. argon2/bcrypt).
- Limitação de tentativas de login e encerramento de sessão (PRD §16.2) implementados na camada de domínio, não em serviço terceirizado — volume do piloto não justifica um provedor de identidade externo.
- Recuperação de acesso assistida pelo administrador durante o piloto (PRD §16.2), sem fluxo de "esqueci minha senha" automatizado por e-mail — coerente com a exclusão de e-mail transacional do MVP (DEC-035).

## 8. Armazenamento de arquivos (fotos)

- Fotos de produto e de batedeira (DEC-013: fotos entram no MVP, vídeos não) precisam de um armazenamento de objetos (ex. um bucket compatível com S3) e não devem ser guardadas como blob no banco relacional.
- Validação de tipo e tamanho de upload no servidor (PRD §17, lista de requisitos antes do piloto).
- Servir imagens redimensionadas/otimizadas (PRD §18.2) usando o componente de otimização de imagem do Next.js já em uso no protótipo (`next/image`), apontando para o bucket em vez de arquivos locais versionados no repositório.

## 9. Hospedagem e ambientes

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
- Detalhes de schema (tipos de coluna, índices) — ver [mer-eer-inicial.md §6](mer-eer-inicial.md#6-pendências-para-a-revisão-eer).
- Mecanismo exato de agendamento da expiração automática de pedidos.

Essas decisões pertencem à especificação de engenharia da Fase 3 e devem ser registradas em `decisions.md` quando tomadas.
