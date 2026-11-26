# PRD — AçaíConecta

## Documento de Requisitos do Produto

**Autor:** Vitor Benedito Ribeiro Batista  
**Local inicial:** Cametá/PA  
**Versão:** 2.7
**Data:** Novembro de 2026  
**Status:** Aprovado em 25/11/2026 (DEC-060) — Fase 3, Construção do MVP
**Documento anterior:** [`archive/PRD-v1.md`](archive/PRD-v1.md) (versão 1.0)

---

## 1. Resumo executivo

O **AçaíConecta** é uma plataforma digital que conecta consumidores a batedeiras de açaí tradicional em Cametá/PA. A proposta é reunir, em um único canal, informações hoje dispersas em contatos de WhatsApp, como disponibilidade, localização, preços, produtos e horários, além de estruturar o recebimento e acompanhamento de pedidos.

O produto será validado inicialmente por meio de uma aplicação web responsiva e instalável, com operação limitada à zona urbana de Cametá (DEC-057), e um grupo piloto de 3 a 5 batedeiras. As entregas continuarão sob responsabilidade de cada batedeira, sem frota própria da plataforma.

A primeira versão processará o Pix por meio de um provedor de pagamento, com conta conectada da batedeira e contestação decidida pelo administrador (DEC-056, DEC-058), e não terá cartão, comissão por pedido, roteirização, chat livre ou expansão para outras cidades. O objetivo do MVP é comprovar que consumidores e batedeiras obtêm valor com descoberta centralizada, catálogo padronizado e pedidos estruturados.

---

## 2. Contexto e problema

Em Cametá, muitas batedeiras vendem principalmente por WhatsApp e divulgação boca a boca. Como consequência:

- consumidores dependem de contatos previamente conhecidos;
- estabelecimentos menores possuem pouca visibilidade;
- informações de preço, horário e disponibilidade não seguem um padrão;
- pedidos chegam em conversas misturadas com mensagens pessoais;
- o cliente não possui acompanhamento estruturado do pedido;
- a batedeira tem dificuldade para organizar a ordem de atendimento.

O AçaíConecta pretende reduzir essas dificuldades sem assumir a produção ou a entrega dos produtos.

---

## 3. Visão do produto

Ser o canal digital de referência para descobrir e comprar açaí tradicional de produtores e comerciantes locais, começando por Cametá e expandindo somente após validação operacional e econômica.

### 3.1 Proposta de valor para o cliente

- descobrir batedeiras disponíveis;
- comparar produtos, preços e estimativas;
- realizar pedidos em um fluxo padronizado;
- acompanhar o andamento sem precisar solicitar atualizações repetidamente;
- consultar histórico e repetir pedidos futuramente.

### 3.2 Proposta de valor para a batedeira

- obter presença digital organizada;
- alcançar consumidores que ainda não conhecem o estabelecimento;
- receber pedidos com itens, quantidades e endereço estruturados;
- controlar disponibilidade e catálogo;
- organizar pedidos por estado e ordem de chegada;
- acompanhar indicadores básicos da operação.

---

## 4. Hipóteses do produto

Os resultados da validação inicial estão registrados no [`questionário da Fase 1`](../research/validation-questionnaire.md). Hipóteses preliminares ainda dependem de comportamento real durante o piloto.

| ID | Hipótese | Situação | Próxima evidência necessária |
|---|---|---|---|
| H1 | Consumidores têm dificuldade para descobrir batedeiras fora de seus contatos atuais. | Validada | Acompanhar uso da busca e origem dos pedidos. |
| H2 | Consumidores aceitam fazer pedidos por uma plataforma dedicada. | Validada preliminarmente | Pedidos reais concluídos durante o piloto. |
| H3 | Batedeiras aceitam operar um painel além do WhatsApp. | Validada preliminarmente | Uso autônomo do painel durante pelo menos quatro semanas. |
| H4 | Catálogo e acompanhamento estruturado reduzem erros e perguntas repetidas. | Parcialmente validada | Comparar incidentes e contatos durante o piloto. |
| H5 | A operação consegue atender pedidos com estimativas em faixas de tempo. | Incerta | Comparar estimativas com tempos reais de entrega. |
| H6 | Existe um modelo de receita aceitável para batedeiras e plataforma. | Hipótese adiada | Pesquisar alternativas e testar disposição para pagar somente após a validação operacional. |

---

## 5. Objetivos e métricas

### 5.1 Objetivo do piloto

Validar, com pedidos reais, se o AçaíConecta melhora a descoberta e a organização dos pedidos sem criar uma carga operacional maior que o benefício oferecido.

### 5.2 Critérios iniciais de sucesso

Durante um piloto de 4 a 6 semanas:

- cadastrar e ativar entre 3 e 5 batedeiras;
- alcançar pelo menos 50 pedidos válidos;
- obter resposta da batedeira em até 5 minutos em pelo menos 70% dos pedidos durante o horário de funcionamento;
- atingir taxa de aceite igual ou superior a 80%;
- concluir pelo menos 90% dos pedidos aceitos;
- manter cancelamentos após aceite abaixo de 10%;
- obter recompra de pelo menos 25% dos clientes em até 30 dias;
- registrar o motivo de 100% das recusas e cancelamentos;
- obter avaliação qualitativa positiva da maioria das batedeiras participantes.

Esses valores são metas iniciais e poderão ser ajustados antes do piloto, mas não durante sua execução sem registro da mudança.

### 5.3 Métrica principal

**Pedidos entregues com sucesso por batedeira ativa por semana.**

### 5.4 Métricas de apoio

- visitantes que iniciam pedido;
- pedidos iniciados que são enviados;
- tempo até aceite ou recusa;
- tempo entre aceite e saída para entrega;
- tempo total até entrega;
- taxa de pedidos expirados;
- motivos de recusa e cancelamento;
- clientes ativos e recorrentes;
- batedeiras ativas por semana.

---

## 6. Público-alvo

### 6.1 Cliente

Morador de Cametá que consome açaí tradicional e deseja encontrar opções disponíveis, consultar preços e pedir com maior previsibilidade.

Aspectos a investigar durante a validação:

- frequência de consumo;
- bairros e distâncias habituais;
- preferência por dinheiro ou Pix;
- familiaridade com compras digitais;
- critérios de escolha: preço, espessura, sabor, distância, confiança ou prazo;
- qualidade do acesso à internet e dispositivo utilizado.

### 6.2 Batedeira

Produtor ou comerciante local que vende açaí tradicional, possui catálogo relativamente simples e utiliza entregadores próprios.

Aspectos a investigar:

- volume diário e horários de pico;
- pessoa responsável por receber pedidos;
- disponibilidade de smartphone e internet;
- capacidade de produção e entrega;
- bairros atendidos;
- forma atual de organização;
- margem e disposição para pagar pelo serviço.

### 6.3 Administrador da plataforma

Responsável por cadastrar ou aprovar batedeiras, revisar informações, prestar suporte, moderar conteúdo e acompanhar a operação do piloto.

---

## 7. Princípios do MVP

- começar pequeno e com operação acompanhada;
- priorizar confiabilidade sobre quantidade de funcionalidades;
- usar faixas de tempo, evitando promessas excessivamente precisas;
- manter decisões financeiras e operacionais auditáveis;
- não exigir aplicativo nativo para participar;
- minimizar os dados pessoais coletados;
- permitir suporte humano durante o piloto;
- evoluir com base em dados reais, não em volume hipotético.

---

## 8. Escopo funcional do MVP

### 8.1 Cliente

- visualizar batedeiras aprovadas;
- distinguir estabelecimentos abertos, fechados e sem entrega disponível;
- buscar por nome e filtrar por bairro atendido;
- consultar perfil, catálogo, preços, horário e estimativa;
- criar conta com nome, telefone, e-mail e senha;
- cadastrar até dois endereços de entrega, um principal e um secundário, podendo editá-los, removê-los e alternar o principal (DEC-040);
- adicionar produtos e quantidades ao pedido;
- incluir observações limitadas por item ou pedido;
- informar necessidade de troco;
- depois do aceite do pedido, escolher a forma de pagamento: dinheiro na entrega ou Pix on-line (DEC-056);
- abrir contestação de um pedido (§14.3);
- enviar pedido;
- acompanhar estados do pedido;
- visualizar atualizações essenciais dentro da aplicação;
- consultar pedidos recentes;
- solicitar cancelamento quando permitido.

### 8.2 Batedeira

- acessar painel protegido;
- atualizar estado do estabelecimento: aberto ou fechado;
- atualizar disponibilidade de entrega separadamente;
- gerenciar produtos e disponibilidade;
- escolher, na lista oficial de bairros urbanos, os que atende e configurar a faixa estimada (DEC-057);
- configurar taxa de entrega por bairro, inclusive gratuita;
- receber alerta visual de novo pedido enquanto o painel estiver aberto;
- aceitar ou recusar com motivo;
- acompanhar fila de pedidos;
- atualizar estados permitidos;
- registrar falha de entrega;
- consultar resumo operacional básico, incluindo o faturamento do dia (DEC-043).

### 8.3 Administrador

- revisar os cadastros feitos pelas batedeiras no site (DEC-054) e ativar, suspender e reativar as selecionadas para o piloto;
- vincular um operador responsável a cada batedeira;
- consultar pedidos e histórico de estados;
- prestar suporte e registrar intervenções;
- moderar imagens e informações públicas;
- manter a lista oficial de bairros urbanos (sem habilitação prévia de cada bairro, DEC-057);
- acompanhar o cadastro da batedeira no provedor de pagamento, estornar pedidos e decidir contestações, exercendo também a função de suporte (DEC-058);
- consultar métricas do piloto;
- acessar trilha de auditoria.

---

## 9. Fora do escopo do MVP

- aplicativo nativo para Android ou iOS;
- login com Google ou Apple;
- cartão de crédito ou débito;
- cartão e outros meios de pagamento além do Pix on-line e do dinheiro;
- carteira ou saldo interno;
- chat livre;
- exposição pública do WhatsApp;
- frota própria;
- rastreamento em mapa;
- roteirização automática;
- promoções e cupons avançados;
- programa de fidelidade;
- avaliações públicas com foto;
- recomendação personalizada;
- múltiplas cidades;
- múltiplos idiomas;
- cálculo automático avançado de capacidade;
- cadastro autônomo e envio de documentos pela batedeira;
- múltiplos operadores por batedeira;
- fotografia de entrega;
- Web Push, SMS e e-mails transacionais de pedidos.

---

## 10. Descoberta e disponibilidade

### 10.1 Estado da batedeira

Uma batedeira poderá estar:

- **Em análise:** cadastro feito pela batedeira e ainda não ativado pelo administrador; não visível publicamente;
- **Ativa:** aprovada e autorizada a operar;
- **Suspensa:** temporariamente indisponível por decisão administrativa;
- **Desativada:** fora da plataforma.

Uma batedeira ativa define separadamente:

- **Estabelecimento aberto/fechado**;
- **Entrega disponível/indisponível**;

### 10.2 Horários

- horários regulares serão configurados por dia da semana;
- o fechamento manual prevalece sobre o horário regular;
- exceções serão tratadas pelo fechamento manual durante o piloto;
- pedidos não poderão ser enviados quando a entrega estiver indisponível;
- a interface deverá informar o próximo horário previsto de abertura quando disponível.

### 10.3 Área de atendimento

Cada batedeira deverá informar:

- bairros atendidos;
- disponibilidade de entrega;
- faixa estimada de entrega;
- taxa de entrega por bairro, em valor fixo, podendo ser zero.

No MVP, não haverá cálculo por distância ou geolocalização automática. O endereço será validado pelo bairro informado. A taxa aplicável será exibida antes do envio e copiada para o pedido.

A plataforma atende os bairros da **zona urbana** de Cametá (DEC-057); zona rural e comunidades ribeirinhas ficam fora. O administrador mantém a lista oficial (13 bairros, fonte IBGE, `bairros_cameta.txt`), com nome principal e nome alternativo entre parênteses quando houver, e não habilita bairros individualmente. Cada batedeira escolhe nessa lista os bairros que atende, com taxa e faixa estimada por bairro, e só pode ser ativada com pelo menos um bairro. O cliente escolhe o bairro do endereço na mesma lista e vê primeiro as batedeiras que o atendem, com o filtro aplicado a partir do endereço principal e editável. Cada pedido deverá totalizar pelo menos 1 litro de açaí; essa validação será feita pelo volume dos itens, não pelo valor monetário do pedido.

---

## 11. Catálogo

Cada produto deverá possuir:

- nome;
- descrição opcional;
- foto opcional;
- preço;
- unidade e volume, limitado a 500 ml ou 1 L (DEC-042);
- estado ativo/inativo;
- disponibilidade atual;
- data da última alteração.

### 11.1 Regras

- preço será armazenado em centavos;
- produto indisponível continuará visível apenas se a batedeira optar por exibi-lo;
- alterações não modificarão pedidos anteriores;
- o pedido guardará uma cópia do nome, unidade e preço praticados no momento da compra;
- exclusão definitiva será evitada quando houver histórico; nesses casos, o produto será arquivado;
- adicionais e combinações complexas serão avaliados após o piloto.

---

## 12. Pedido

### 12.1 Dados mínimos

- cliente;
- batedeira;
- itens, quantidades e preços registrados no momento da compra;
- subtotal;
- taxa de entrega;
- total;
- endereço e referência;
- forma de pagamento (escolhida depois do aceite) e situação do pagamento;
- valor de troco, quando aplicável;
- observações;
- faixa estimada apresentada;
- estado atual;
- datas de criação e atualização.

### 12.2 Estados

| Estado | Descrição | Estado terminal? |
|---|---|---|
| `AGUARDANDO_ACEITE` | Pedido enviado e aguardando resposta. | Não |
| `ACEITO` | Batedeira confirmou que atenderá. | Não |
| `AGUARDANDO_PAGAMENTO` | Pedido aceito com Pix escolhido; o cliente tem 10 minutos para pagar. | Não |
| `EM_PREPARO` | Produção iniciada. | Não |
| `PRONTO` | Pedido pronto para sair para entrega. | Não |
| `SAIU_PARA_ENTREGA` | Pedido em deslocamento. | Não |
| `ENTREGUE` | Entrega concluída. | Sim |
| `RECUSADO` | Batedeira recusou antes do aceite. | Sim |
| `EXPIRADO` | Não houve resposta no prazo configurado. | Sim |
| `CANCELADO` | Cancelado conforme regra aplicável. | Sim |
| `FALHA_NA_ENTREGA` | Não foi possível concluir a entrega. | Sim no MVP |

### 12.3 Transições permitidas

```text
AGUARDANDO_ACEITE
├── ACEITO
├── RECUSADO
├── EXPIRADO
└── CANCELADO

ACEITO
├── AGUARDANDO_PAGAMENTO   (cliente escolheu Pix)
├── EM_PREPARO             (cliente escolheu dinheiro)
└── CANCELADO

AGUARDANDO_PAGAMENTO
├── EM_PREPARO             (Pix confirmado pelo provedor)
└── CANCELADO              (Pix expirado ou cancelamento operacional)

EM_PREPARO
├── PRONTO
└── CANCELADO

PRONTO
├── SAIU_PARA_ENTREGA
└── CANCELADO

SAIU_PARA_ENTREGA
├── ENTREGUE
└── FALHA_NA_ENTREGA
```

O pagamento tem situação própria (pendente, confirmado, expirado, estornado), separada do estado do pedido. Toda transição deverá registrar:

- estado anterior e novo estado;
- data e hora;
- usuário ou processo responsável;
- motivo, quando exigido;
- observação administrativa opcional.

### 12.4 Aceite e expiração

- a batedeira deverá aceitar ou recusar o pedido;
- o prazo para resposta será de 5 minutos durante o piloto;
- ao expirar, o pedido não poderá ser aceito posteriormente;
- depois do aceite, o cliente escolhe a forma de pagamento; o cliente tem 10 minutos para escolher; sem escolha, o pedido é encerrado sem custo (`CANCELADO`, motivo "forma de pagamento não escolhida") e a batedeira é avisada (DEC-059);
- pedidos aguardando aceite deverão gerar alerta destacado;
- a batedeira deverá selecionar um motivo ao recusar.

### 12.5 Cancelamento

- o cliente poderá cancelar diretamente apenas em `AGUARDANDO_ACEITE`;
- após o aceite, a batedeira ou o administrador poderá cancelar antes de `SAIU_PARA_ENTREGA` somente por impossibilidade operacional, com autor e motivo registrados; se o pedido já estiver pago, aplica-se o estorno do §14.2;
- o Pix não pago em 10 minutos cancela o pedido sem custo (motivo "pagamento expirado") e a batedeira é avisada;
- solicitações do cliente após o aceite serão tratadas pelo suporte e não implicarão cancelamento automático;
- após `SAIU_PARA_ENTREGA`, problemas serão tratados como falha de entrega ou incidente de suporte, não como cancelamento comum;
- cancelamentos após aceite serão acompanhados como indicador de qualidade;
- pagamentos e estornos seguem o §14.

### 12.6 Fila e estimativa

- pedidos serão priorizados pelo horário de criação e entrarão na operação após o aceite;
- a batedeira poderá visualizar prioridade e horário de criação;
- o sistema não prometerá horário exato no MVP;
- será apresentada uma faixa estimada configurada pela batedeira;
- mudanças relevantes deverão ser comunicadas ao cliente;
- cálculo automático de capacidade será considerado após coleta de dados reais.

---

## 13. Entrega e exceções operacionais

### 13.1 Responsabilidade

- produção e entrega são responsabilidade da batedeira;
- a plataforma organiza informações e o acompanhamento;
- responsabilidades legais e termos definitivos dependerão de revisão profissional antes do lançamento público.

### 13.2 Falha na entrega

Motivos mínimos:

- endereço não localizado;
- cliente ausente;
- cliente não respondeu;
- problema com entregador;
- estabelecimento não conseguiu concluir;
- outro motivo, com descrição obrigatória.

### 13.3 Confirmação e incidentes

- a batedeira marcará o pedido como entregue após a confirmação do responsável pela entrega;
- o MVP não coletará fotografia ou assinatura do cliente;
- reclamações, divergências e atrasos serão tratados pelo suporte e registrados no diário operacional externo do piloto;
- os incidentes servirão como evidência para decidir se um fluxo formal será necessário após o piloto.

### 13.4 Comunicação protegida

O MVP não oferecerá chat livre nem divulgará o WhatsApp publicamente. Entretanto, disponibilizará mensagens operacionais predefinidas vinculadas ao pedido, como:

- “O entregador chegou.”
- “Não encontramos o endereço.”
- “Seu pedido está atrasado.”
- “Precisamos confirmar uma informação do pedido.”
- “Um item ficou indisponível; aguarde contato do suporte.”

Durante o piloto, o administrador poderá atuar como canal de contingência. A necessidade de contato temporário direto será medida antes de uma decisão definitiva.

---

## 14. Pagamento

Decisões: DEC-056 e DEC-058 (Pix on-line); DEC-030 vale apenas para o dinheiro.

### 14.1 Formas e fluxo

1. O cliente monta a sacola e envia o pedido, sem escolher a forma de pagamento.
2. A batedeira aceita ou recusa (prazo de 5 minutos). Recusa e expiração do aceite ocorrem antes do pagamento e não geram estorno.
3. Depois do aceite, o cliente escolhe:
   - **dinheiro na entrega**, com valor de troco quando necessário: o pedido segue direto para o preparo e o valor é recolhido na entrega;
   - **Pix on-line**: o pedido fica em `AGUARDANDO_PAGAMENTO` por até 10 minutos; o provedor confirma o pagamento por webhook (idempotente e auditável) e só então o pedido segue para o preparo. O valor é creditado diretamente na conta conectada da batedeira.
4. Se o Pix expirar, o pedido é encerrado sem custo e a batedeira é avisada; o cliente reinicia o processo.

A plataforma não custodia valores nem guarda chave Pix, dados bancários ou documentos de pagamento da batedeira: esses dados ficam no provedor.

### 14.2 Estorno

- se a batedeira cancelar um pedido pago, o valor é estornado ao cliente em até 24 horas do cancelamento, pela batedeira ou pelo administrador, depois de analisarem o caso;
- se o Pix foi pago e a entrega falha (`FALHA_NA_ENTREGA`), o cliente abre a contestação e o estorno ocorre em até 24 horas da abertura, pela batedeira ou pelo administrador;
- se o provedor permitir o estorno apenas pela plataforma ou apenas pela batedeira, o estorno fica com a batedeira (DEC-058).

### 14.3 Contestação

- motivos aceitos: produto em mau estado (físico ou de sabor); entrega não recebida; pedido diferente do feito; Pix cobrado sem andamento do pedido ou estorno não realizado no prazo; cobrança em valor diferente do exibido;
- pode ser aberta, no Pix, a partir da confirmação do pagamento e, no dinheiro na entrega, a partir do aceite do pedido, e até 24 horas depois da entrega ou da falha registrada;
- é decidida pelo administrador, que exerce a função de suporte; primeira resposta em até 1 hora no piloto, com alerta no painel; prazos definitivos serão revistos depois do piloto.

### 14.4 Cadastro da batedeira no provedor

Assistido pelo administrador e concluído pela batedeira no formulário do provedor (conta conectada). A plataforma guarda só o identificador da conta e o status (pendente, verificada, recusada). Enquanto não verificada, a batedeira só aceita pedidos em dinheiro.

### 14.5 Faturamento do dia

O dinheiro entra no faturamento quando o pedido é entregue; o Pix entra quando o pagamento é confirmado. O estorno é descontado no dia em que ocorre, sem alterar dias já fechados (DEC-043, DEC-058).

### 14.6 Pontos em aberto

Escolha do provedor (ADR) e quem assume a tarifa depois do piloto (DEC-021, DEC-034). Durante o piloto, a plataforma paga a tarifa e a batedeira não paga comissão nem mensalidade.

---

## 15. Notificações

### 15.1 Eventos obrigatórios

Cliente:

- pedido enviado;
- pedido aceito, recusado ou expirado;
- pedido em preparo;
- pedido saiu para entrega;
- atraso ou mensagem operacional;
- pedido entregue, cancelado ou com falha.

Batedeira:

- novo pedido;
- pedido próximo de expirar;
- cancelamento antes do aceite;
- intervenção administrativa relevante.

### 15.2 Canais

- a linha do tempo do pedido e os alertas visuais no painel serão obrigatórios;
- o operador deverá manter o painel aberto durante o horário do piloto;
- Web Push, SMS e e-mails transacionais de pedidos não farão parte do MVP;
- o suporte humano será a contingência documentada para falhas de comunicação.

---

## 16. Autenticação e autorização

### 16.1 Perfis

- cliente;
- operador de batedeira;
- administrador.

No MVP, cada usuário possuirá um único papel e cada batedeira terá um operador responsável. Permissões serão verificadas no servidor, não apenas ocultadas na interface.

### 16.2 Requisitos mínimos

- cadastro do cliente com e-mail e senha;
- recuperação de acesso assistida pelo administrador durante o piloto;
- limitação de tentativas;
- encerramento de sessões;
- bloqueio de conta;
- registro de ações administrativas sensíveis;
- acesso do operador limitado à sua batedeira;
- acesso do cliente limitado aos próprios dados e pedidos.

A estratégia de sessões e de limitação de tentativas está registrada na [ADR-001](../architecture/ADRs/ADR-001-sessoes-e-tentativas-de-login.md). Login social ficará fora do MVP.

---

## 17. Dados pessoais, segurança e privacidade

O produto poderá tratar nome, telefone, e-mail, endereço e histórico de pedidos. Dados mínimos do operador responsável são informados no cadastro da batedeira (DEC-054); o CPF/CNPJ segue a DEC-055.

Antes do piloto público deverão existir:

- política de privacidade;
- termos de uso;
- finalidade documentada para cada dado coletado;
- política de retenção e exclusão;
- canal para correção ou exclusão de dados;
- controle de acesso por função;
- criptografia em trânsito;
- validação de tipo e tamanho de uploads;
- backups e procedimento de restauração;
- registros de auditoria;
- plano básico de resposta a incidentes;
- revisão jurídica e contábil adequada ao modelo adotado.

### 17.1 Minimização

- endereço será solicitado somente quando necessário ao pedido;
- dados bancários, documentos de pagamento e chave Pix da batedeira são coletados apenas pelo provedor de pagamento, nunca pela plataforma; o CPF/CNPJ do cadastro segue a DEC-055;
- dados de pagamento e contestação entram na política de privacidade e nos termos (DEC-048);
- dados não necessários à validação serão adiados;
- ambientes de teste não deverão utilizar dados pessoais reais.

### 17.2 Elegibilidade da batedeira

- somente as batedeiras previamente selecionadas participarão do piloto;
- verificações jurídicas e administrativas aplicáveis ocorrerão fora do sistema antes da ativação;
- o administrador registrará apenas o resultado da elegibilidade, sem copiar documentos para a plataforma;
- os requisitos locais deverão ser confirmados com os órgãos competentes antes do piloto.

---

## 18. Requisitos não funcionais

### 18.1 Usabilidade

- funcionamento adequado em telas móveis;
- linguagem simples e contextualizada;
- fluxo de pedido com poucos passos;
- botões e estados claramente identificados;
- mensagens de erro que indiquem como corrigir o problema.

### 18.2 Desempenho

- páginas principais devem permanecer utilizáveis em conexão móvel limitada;
- imagens devem ser redimensionadas e otimizadas;
- operações de aceite e mudança de estado devem informar sucesso ou falha sem ambiguidade;
- metas técnicas quantitativas serão definidas na especificação de engenharia.

### 18.3 Confiabilidade

- transições de estado serão atômicas;
- requisições repetidas não deverão duplicar pedidos ou mudanças críticas;
- o sistema manterá histórico das alterações;
- falhas externas não deverão apagar pedidos confirmados;
- backups serão testados antes do lançamento público.

### 18.4 Acessibilidade

- navegação por teclado nas interfaces web;
- contraste adequado;
- rótulos para campos e controles;
- estados não serão comunicados apenas por cor;
- imagens relevantes possuirão texto alternativo.

### 18.5 Observabilidade

- registro centralizado de erros;
- identificação de requisições e pedidos em suporte;
- métricas de pedidos e alertas da aplicação;
- alertas para falhas críticas;
- auditoria de ações administrativas.

---

## 19. Histórias de usuário e critérios de aceite

### US-01 — Descobrir batedeiras

**Como** cliente, **quero** visualizar batedeiras disponíveis, **para** escolher onde comprar.

Critérios:

- somente batedeiras ativas e aprovadas aparecem;
- abertas aparecem antes das fechadas, considerando filtros;
- a interface diferencia “aberta” de “entrega disponível”;
- perfil informa produtos, preços, bairros e faixa estimada;
- nenhum dado privado do responsável é exibido.

### US-02 — Criar pedido

**Como** cliente, **quero** montar e enviar um pedido, **para** comprar produtos de uma batedeira.

Critérios:

- somente produtos disponíveis podem ser adicionados;
- preços e total são apresentados antes da confirmação;
- endereço precisa pertencer a um bairro atendido;
- pedido não pode ser enviado se a entrega estiver indisponível;
- envio repetido da mesma requisição não cria pedidos duplicados;
- o pedido inicia em `AGUARDANDO_ACEITE`;
- a forma de pagamento não é escolhida no envio, e sim depois do aceite (§14.1).

### US-03 — Responder pedido

**Como** operador, **quero** aceitar ou recusar um pedido, **para** controlar a capacidade da batedeira.

Critérios:

- somente operadores autorizados podem responder;
- pedido expirado ou cancelado não pode ser aceito;
- recusa exige motivo;
- cliente é notificado;
- ação aparece no histórico.

### US-04 — Atualizar produção e entrega

**Como** operador, **quero** atualizar o andamento, **para** informar o cliente.

Critérios:

- apenas transições permitidas são aceitas;
- cada alteração registra usuário e horário;
- cliente recebe atualização;
- falha de entrega exige motivo.

### US-05 — Administrar batedeiras

**Como** administrador, **quero** aprovar e suspender batedeiras, **para** manter a qualidade da plataforma.

Critérios:

- batedeira em análise não aparece publicamente;
- aprovação e suspensão são auditadas;
- suspensão impede novos pedidos;
- pedidos existentes permanecem consultáveis;
- motivo administrativo é registrado.

### US-06 — Cancelar ou tratar impossibilidade operacional

**Como** cliente, **quero** cancelar um pedido ainda não aceito, **para** interromper uma solicitação antes do início da operação.

Critérios:

- o cliente pode cancelar diretamente apenas em `AGUARDANDO_ACEITE`;
- após o aceite, apenas batedeira ou administrador podem cancelar por impossibilidade operacional antes de `SAIU_PARA_ENTREGA`;
- todo cancelamento após o aceite registra autor e motivo;
- pedido cancelado não admite nova transição operacional;
- batedeira recebe atualização;
- evento é registrado no histórico.

---

## 20. Modelo de receita

O piloto será gratuito para clientes e batedeiras, sem comissão por pedido. A mensalidade paga pela batedeira permanece apenas como hipótese para depois da validação operacional; não será implementada nem cobrada no MVP.

Antes de definir o valor e as condições da mensalidade, serão estimados:

- ticket médio;
- margem aproximada das batedeiras;
- frequência de pedidos;
- custos de pagamento;
- hospedagem e comunicação;
- suporte e moderação;
- aquisição de clientes;
- inadimplência, reembolso e fraude.

---

## 21. Plano do piloto

### 21.1 Preparação

- confirmar a participação das 3 batedeiras selecionadas na validação inicial;
- mapear catálogo, bairros, horários e capacidade;
- testar protótipo navegável;
- treinar operadores;
- definir canal de suporte;
- obter aceite dos termos aplicáveis.

### 21.2 Execução

- duração de 4 a 6 semanas;
- acompanhamento diário na primeira semana;
- revisão semanal de métricas;
- registro de incidentes e soluções manuais;
- entrevistas curtas com participantes ao longo do piloto;
- nenhuma mudança estrutural silenciosa nas métricas.

### 21.3 Encerramento

Ao final, decidir entre:

- prosseguir e consolidar;
- ajustar proposta ou operação;
- repetir o piloto;
- pivotar o produto;
- interromper a iniciativa.

A decisão deverá considerar comportamento real, não apenas opiniões positivas.

---

## 22. Roadmap

Este documento adota oficialmente as seis fases descritas em [`roadmap.md`](roadmap.md). O conteúdo abaixo é um resumo; objetivos, entregáveis e critérios de conclusão detalhados permanecem centralizados no roadmap oficial.

### Fase 1 — Descoberta e Validação do Problema

- entrevistas;
- observação do processo atual;
- validação prática das hipóteses;
- identificação de participantes para o piloto;
- decisão de prosseguir, ajustar ou interromper.

### Fase 2 — Definição e Prototipação do Produto

- revisão e aprovação do PRD;
- decisões críticas;
- fluxos e protótipo navegável;
- testes de usabilidade;
- MER e dicionário de dados iniciais;
- arquitetura técnica;
- backlog priorizado do MVP.

### Fase 3 — Construção do MVP

- aplicação web responsiva e instalável;
- catálogo;
- pedido e estados;
- painel da batedeira;
- administração;
- notificações essenciais;
- pagamento em dinheiro na entrega ou Pix on-line pelo provedor, com estorno e contestação (§14);
- métricas, testes e ambientes de execução.

### Fase 4 — Piloto Controlado em Cametá

- operação com 3 a 5 batedeiras;
- execução durante 4 a 6 semanas;
- acompanhamento de pedidos reais;
- registro de incidentes;
- consolidação das métricas;
- decisão formal sobre a continuidade.

### Fase 5 — Consolidação e Crescimento Local

- melhorias baseadas no piloto;
- avaliações simples;
- automação operacional;
- entrada gradual de novas batedeiras;
- melhoria das estimativas;
- recursos de retenção;
- definição e avaliação do modelo de receita;
- políticas e suporte mais estruturados.

### Fase 6 — Expansão Regional

- estudo de novas cidades;
- parametrização regional;
- piloto controlado em uma segunda cidade;
- expansão somente após operação sustentável em Cametá.

---

## 23. Riscos e respostas

| Risco | Impacto | Resposta inicial |
|---|---|---|
| Baixa adesão das batedeiras | Crítico | Validar antes de construir e operar piloto acompanhado. |
| Painel ser mais trabalhoso que WhatsApp | Crítico | Simplificar fluxo, alertas claros e treinamento. |
| Falta de comunicação na entrega | Alto | Mensagens operacionais e suporte de contingência. |
| Estimativas irreais | Alto | Usar faixas configuradas e medir tempos reais. |
| Internet instável | Alto | Interface leve, feedback claro e tolerância a repetição. |
| Dados pessoais expostos | Crítico | Minimização, autorização no servidor e armazenamento privado. |
| Batedeira sem capacidade de entrega | Alto | Separar abertura de disponibilidade de entrega. |
| Modelo financeiro inviável | Crítico | Medir custos operacionais e validar a disposição para pagar somente após o piloto. |
| Responsabilidade sobre alimentos | Crítico | Orientação jurídica e termos antes do lançamento público. |
| Dependência excessiva de fornecedor | Médio | Arquitetura simples, dados exportáveis e integrações isoladas. |

---

## 24. Decisões encerradas e gates externos

### 24.1 Decisões internas encerradas

- prazo de aceite: cinco minutos durante todo o piloto;
- comunicação: mensagens predefinidas, linha do tempo e suporte humano;
- cobrança: piloto gratuito, sem comissão ou mensalidade;
- pagamento: dinheiro na entrega ou Pix on-line confirmado pelo provedor; estorno em até 24 h e contestação decidida pelo administrador (DEC-056, DEC-058);
- cadastro de batedeira: feito pela própria batedeira no site, com CPF/CNPJ e um operador responsável, e ativação pelo administrador (DEC-054, DEC-055);
- entrega: sem fotografia; contestação formal decidida pelo administrador (DEC-058).

### 24.2 Gates externos

- confirmar as exigências jurídicas e administrativas aplicáveis às participantes em Cametá;
- concluir a revisão de privacidade e termos do piloto;
- escolher infraestrutura de hospedagem, banco, arquivos e observabilidade durante a especificação de engenharia; a estratégia de autenticação já foi definida na ADR-001 (aprovada, ainda não implementada) e o provedor de pagamento Pix será escolhido em ADR própria.

Os gates externos não serão preenchidos por suposição. Os dois primeiros impedem o piloto; a escolha de infraestrutura e do provedor Pix impede a persistência e o deploy em homologação e produção, mas não o desenvolvimento local de `app/` (DEC-051, DEC-053, DEC-061).

### 24.3 Baseline tecnológica definida

O MVP será um monólito modular em TypeScript, com Next.js, React, Tailwind CSS, MySQL e Prisma. A aplicação será web responsiva e instalável; frontend e backend permanecerão na mesma base de código durante o MVP.

---

## 25. Critérios de prontidão para desenvolvimento

O MVP estará pronto para implementação quando:

- entrevistas iniciais estiverem registradas;
- fluxo do protótipo tiver sido testado;
- escopo do MVP estiver aprovado;
- decisões operacionais críticas estiverem respondidas;
- histórias prioritárias possuírem critérios de aceite;
- modelo de dados inicial estiver revisado;
- arquitetura técnica estiver registrada;
- riscos jurídicos imediatos tiverem encaminhamento;
- plano e participantes do piloto estiverem definidos;
- backlog estiver priorizado.

---

## 26. Critérios de lançamento do piloto

- fluxo completo testado em ambiente de homologação;
- nenhuma vulnerabilidade crítica conhecida;
- backup e restauração verificados;
- permissões dos três perfis testadas;
- linha do tempo e alertas críticos funcionando ou com contingência documentada;
- batedeiras treinadas;
- suporte disponível;
- métricas configuradas;
- política de privacidade e termos publicados;
- procedimento para incidentes e cancelamentos definido;
- testes de pedido, expiração, recusa, cancelamento e falha de entrega aprovados;
- pagamento em dinheiro (com troco) e Pix, incluindo expiração, webhook repetido, estorno e contestação, aprovados nos testes de ponta a ponta;
- provedor escolhido em ADR e cadastro assistido da batedeira testado.

---

## 27. Próximos passos

1. Revisar o modelo de dados (schema SQL, MER e dicionário) e o backlog para incluir pagamento, estorno, contestação, bairros por batedeira e o estado `AGUARDANDO_PAGAMENTO`.
2. Consolidar o dicionário de métricas do piloto.
3. Definir infraestrutura e provedor de pagamento e registrá-los como ADRs.
4. Obter encaminhamento jurídico, concluir privacidade, termos e política de retenção (§17) e detalhar a preparação do piloto com as 3 batedeiras.
5. Iniciar a implementação somente após os critérios de prontidão.

---

## 28. Histórico do documento

| Versão | Data | Descrição |
|---|---|---|
| 1.0 | Agosto de 2026 | Visão inicial, fluxos principais e roadmap. |
| 2.0 | Setembro de 2026 | Escopo implementável, métricas, administração, estados do pedido, entrega, segurança, critérios de aceite e plano do piloto. |
| 2.1 | Setembro de 2026 | Roadmap do PRD alinhado à organização oficial de seis fases. |
| 2.2 | Setembro de 2026 | Resultados da Fase 1 incorporados, fila definida por ordem de criação e próximos passos atualizados para a Fase 2. |
| 2.3 | Setembro de 2026 | Operação somente por entrega, regras de cancelamento e contestação, cadastro documental, monetização, área piloto e stack consolidados. |
| 2.4 | Setembro de 2026 | Pix on-line incorporado ao MVP com expiração, renovação, crédito direto, devolução integral e prazos de contestação. |
| 2.5 | Setembro de 2026 | MVP reduzido ao núcleo de descoberta e pedidos; pagamentos passam a ocorrer na entrega e integrações financeiras, documentação, fotografia e contestação saem do escopo. |
| 2.6 | Setembro de 2026 | Incorporadas a DEC-040 (até dois endereços), a DEC-042 (tamanhos de 500 ml e 1 L), a DEC-043 (faturamento do dia) e a ADR-001 (sessões e tentativas de login); papéis de administrador e batedeira na configuração de bairros esclarecidos; próximos passos atualizados. Aprovada em 28/09/2026, depois dos testes de usabilidade (DEC-044, DEC-045). |
| 2.7 | Novembro de 2026 | Aprovada em 25/11/2026 (DEC-060): Pix on-line com estorno e contestação (DEC-056, DEC-058), atendimento a bairros urbanos escolhidos pela batedeira (DEC-057) e estado `AGUARDANDO_PAGAMENTO`; prazo de 10 minutos para escolher a forma de pagamento (DEC-059). |
