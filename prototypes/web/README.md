# Protótipo web — AçaíConecta

**Status: testes de usabilidade considerados satisfatórios pelo responsável pelo projeto em 28/09/2026 (DEC-045).** O protótipo continua sendo exploratório e não representa a aplicação do MVP.

Protótipo navegável da Fase 2 — Definição e Prototipação do Produto, com telas de entrada, cliente, operador de batedeira e administrador. Dados e ações são simulados; não há backend, banco de dados, autenticação real nem processamento de pagamentos. A implementação do MVP não foi iniciada.

## Fontes de verdade

Este diretório do repositório é a única fonte de verdade do protótipo (DEC-041). O [chat do v0](https://v0.app/vitors-projects-edcbface/chat/acaiconecta-jAWnqGHlb8w) é uma vitrine opcional, que pode estar defasada; essa defasagem não é pendência.

O protótipo não define regras de negócio. As referências do produto continuam sendo o [PRD vigente](../../docs/product/PRD.md), o [registro de decisões](../../docs/product/decisions.md), os [fluxos operacionais](../../docs/product/flows.md) e o [schema SQL](../../database/schema.sql). Os tipos da simulação não substituem o schema: nomes e estruturas serão alinhados na implementação real.

## Execução local

Requer Node.js 24 e pnpm compatível com o lockfile. Na raiz do repositório:

```sh
cd prototypes/web
pnpm install --frozen-lockfile
pnpm dev
```

Rotas: `/`, `/cliente`, `/operador` e `/admin`. `/operador` e `/admin` pedem login antes do painel; `/cliente` permite navegar sem conta e pede login só ao enviar o pedido. Qualquer senha não vazia simula o acesso. Use somente dados fictícios.

Verificações:

```sh
pnpm typecheck
pnpm test
pnpm build
```

Não há script de lint. O build não ignora erros de TypeScript. O estado atual das verificações está em [VERIFICATION.md](VERIFICATION.md).

## O que o protótipo cobre

- **Cliente:** descoberta de batedeiras, catálogo, sacola com mínimo de 1 litro, taxa de entrega, dinheiro com troco ou Pix na entrega, envio com proteção contra reenvio, linha do tempo do pedido, cancelamento antes do aceite, login e cadastro, até dois endereços salvos (DEC-040) e painel de ajuda.
- **Operador:** abertura e entrega controladas separadamente, com cor de estado e confirmação; fila com prazo de aceite de cinco minutos; transições permitidas com motivos obrigatórios; mensagens operacionais; catálogo com tamanhos de 500 ml ou 1 L (DEC-042); horários, taxa e faixa estimada; visão geral com faturamento do dia, entregas e pedidos aceitos hoje (DEC-043).
- **Administrador:** cadastro assistido de batedeira com e-mail do operador, ativação e suspensão, pedidos com intervenções e cancelamento operacional, bloqueio e reativação de clientes, métricas do piloto (PRD §5.4) e trilha de auditoria simulada.

## Limitações conhecidas

- O estado é guardado no `sessionStorage` da aba: não há sincronização entre dispositivos, e fechar a aba pode descartar os dados. A expiração dos pedidos só corre com a aplicação aberta e é reconciliada ao restaurar a sessão.
- Login, autorização e auditoria são simulados. Um mesmo navegador pode entrar como qualquer operador cujo e-mail seja conhecido, o que a implementação real não permitirá.
- Recuperação de acesso não tem fluxo próprio; é assistida pelo suporte, como prevê o PRD §16.2.
- A cobertura está fixa no bairro Centro; a tela administrativa de bairros é somente leitura.
- Métricas do piloto e faturamento do dia são calculados sobre dados simulados e não comprovam resultados reais.
- Fotos ilustrativas seguem a DEC-038. Upload de foto é local e dura só a sessão.
- Testes de acessibilidade, conexão instável e múltiplos navegadores estão pendentes.
