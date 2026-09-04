# PRD — AçaíConecta

## Documento de Requisitos do Produto

**Autor:** Vitor Benedito Ribeiro Batista  
**Local inicial:** Cametá/PA  
**Versão:** 2.5
**Data:** Setembro de 2026  
**Status:** Fase 2 — Definição e Prototipação
**Documento anterior:** [`archive/PRD-v1.md`](archive/PRD-v1.md) (versão 1.0)

---

## 1. Resumo executivo

O **AçaíConecta** é uma plataforma digital que conecta consumidores a batedeiras de açaí tradicional em Cametá/PA. A proposta é reunir, em um único canal, informações hoje dispersas em contatos de WhatsApp, como disponibilidade, localização, preços, produtos e horários, além de estruturar o recebimento e acompanhamento de pedidos.

O produto será validado inicialmente por meio de uma aplicação web responsiva e instalável, com operação limitada ao bairro Centro, em Cametá, e um grupo piloto de 3 a 5 batedeiras. As entregas continuarão sob responsabilidade de cada batedeira, sem frota própria da plataforma.

A primeira versão não processará pagamentos, documentos ou contestações e não terá cartão, comissão por pedido, roteirização, chat livre ou expansão para outras cidades. O objetivo do MVP é comprovar que consumidores e batedeiras obtêm valor com descoberta centralizada, catálogo padronizado e pedidos estruturados.

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
- cadastrar endereço de entrega;
- adicionar produtos e quantidades ao pedido;
- incluir observações limitadas por item ou pedido;
- informar necessidade de troco;
- escolher dinheiro ou Pix na entrega;
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
- configurar bairros atendidos e faixa estimada;
- configurar taxa de entrega por bairro, inclusive gratuita;
- receber alerta visual de novo pedido enquanto o painel estiver aberto;
- aceitar ou recusar com motivo;
- acompanhar fila de pedidos;
- atualizar estados permitidos;
- registrar falha de entrega;
- consultar resumo operacional básico.

### 8.3 Administrador

- cadastrar de forma assistida, ativar, suspender e reativar batedeiras selecionadas para o piloto;
- vincular um operador responsável a cada batedeira;
- consultar pedidos e histórico de estados;
- prestar suporte e registrar intervenções;
- moderar imagens e informações públicas;
- configurar os bairros atendidos;
- consultar métricas do piloto;
- acessar trilha de auditoria.

---

## 9. Fora do escopo do MVP

- aplicativo nativo para Android ou iOS;
- login com Google ou Apple;
- cartão de crédito ou débito;
- geração ou conciliação de Pix pela plataforma;
- devoluções processadas pela plataforma;
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
- fotografia de entrega e contestação formal dentro da aplicação;
- Web Push, SMS e e-mails transacionais de pedidos.

---

## 10. Descoberta e disponibilidade

### 10.1 Estado da batedeira

Uma batedeira poderá estar:

- **Em análise:** cadastro assistido ainda não aprovado; não visível publicamente;
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

O piloto atenderá somente o bairro Centro. Cada pedido deverá totalizar pelo menos 1 litro de açaí; essa validação será feita pelo volume dos itens, não pelo valor monetário do pedido.

---

## 11. Catálogo

Cada produto deverá possuir:

- nome;
- descrição opcional;
- foto opcional;
- preço;
- unidade ou volume;
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
- forma de pagamento;
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
├── EM_PREPARO
└── CANCELADO

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

Toda transição deverá registrar:

- estado anterior e novo estado;
- data e hora;
- usuário ou processo responsável;
- motivo, quando exigido;
- observação administrativa opcional.

### 12.4 Aceite e expiração

- a batedeira deverá aceitar ou recusar o pedido;
- o prazo para resposta será de 5 minutos durante o piloto;
- ao expirar, o pedido não poderá ser aceito posteriormente;
- pedidos aguardando aceite deverão gerar alerta destacado;
- a batedeira deverá selecionar um motivo ao recusar.

### 12.5 Cancelamento

- o cliente poderá cancelar diretamente apenas em `AGUARDANDO_ACEITE`;
- após o aceite, a batedeira ou o administrador poderá cancelar antes de `SAIU_PARA_ENTREGA` somente por impossibilidade operacional, com autor e motivo registrados;
- solicitações do cliente após o aceite serão tratadas pelo suporte e não implicarão cancelamento automático;
- após `SAIU_PARA_ENTREGA`, problemas serão tratados como falha de entrega ou incidente de suporte, não como cancelamento comum;
- cancelamentos após aceite serão acompanhados como indicador de qualidade;
- a plataforma não processará pagamentos ou devoluções no MVP.

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

### 14.1 MVP

Formas informadas no pedido:

- dinheiro na entrega, com valor para troco quando necessário;
- Pix na entrega, transferido diretamente pelo cliente à batedeira.

A plataforma não gerará QR Code, armazenará chave Pix, confirmará pagamentos, cobrará comissão, custodiará valores ou realizará devoluções. A confirmação e eventuais ajustes financeiros ocorrerão diretamente entre cliente e batedeira durante o piloto.

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

Login social ficará fora do MVP.

---

## 17. Dados pessoais, segurança e privacidade

O produto poderá tratar nome, telefone, e-mail, endereço e histórico de pedidos. Dados mínimos do operador responsável serão cadastrados de forma assistida.

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
- CPF, CNPJ, documentos e chave Pix não serão coletados pelo sistema no MVP;
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
- o pedido inicia em `AGUARDANDO_ACEITE`.

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
- dinheiro ou Pix na entrega, sem processamento pela plataforma;
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
- pagamento: dinheiro ou Pix na entrega, sem processamento pela plataforma;
- cadastro de batedeira: assistido, com um operador responsável;
- entrega: sem fotografia ou contestação formal no sistema.

### 24.2 Gates externos

- confirmar as exigências jurídicas e administrativas aplicáveis às participantes em Cametá;
- concluir a revisão de privacidade e termos do piloto;
- escolher infraestrutura de hospedagem, banco, autenticação, arquivos e observabilidade durante a especificação de engenharia.

Os gates externos não serão preenchidos por suposição. Eles não impedem o protótipo, mas os dois primeiros impedem o piloto e a escolha de infraestrutura impede o início da construção.

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
- pagamento na entrega e informação de troco compreendidos nos testes de ponta a ponta.

---

## 27. Próximos passos

1. Transformar os fluxos documentados em um protótipo navegável do escopo reduzido.
2. Executar testes de usabilidade e ajustar os fluxos conforme as evidências.
3. Revisar o modelo EER a partir do schema SQL e consolidar os dicionários de dados e de métricas.
4. Definir e registrar a arquitetura técnica e as escolhas de infraestrutura.
5. Converter histórias do MVP em backlog priorizado.
6. Obter encaminhamento jurídico e detalhar a preparação do piloto com as 3 batedeiras.
7. Iniciar a implementação somente após os critérios de prontidão.

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
