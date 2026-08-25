# PRD — AçaíConecta
### Documento de Requisitos do Produto
**Autor:** Vitor Benedito Ribeiro Batista
**Local:** Cametá/PA
**Versão:** 1.0
**Data:** Agosto 2026

---

## 1. Visão Geral

O **AçaíConecta** (nome provisório) é uma plataforma digital (app/site) que conecta consumidores a batedeiras de açaí tradicional em Cametá/PA, organizando de forma centralizada informações que hoje estão dispersas em contatos individuais de WhatsApp.

A plataforma funciona como um marketplace de nicho: cadastro de batedeiras, catálogo de produtos, pedidos, fila de atendimento por ordem de chegada e pagamento (Pix ou na entrega), mantendo os entregadores das próprias batedeiras (sem frota própria da plataforma).

---

## 2. Problema

Em Cametá, a maioria das batedeiras de açaí vende por meio de contato direto via WhatsApp. Isso gera uma barreira de acesso: se o consumidor não tiver o contato salvo de uma batedeira específica, ele simplesmente não sabe que ela existe ou não consegue comprar dela. Não existe hoje um canal único, organizado e público que liste as batedeiras da cidade com informações padronizadas (endereço, horário, preço, avaliações).

---

## 3. Objetivo do Produto

Criar uma plataforma única onde:
- O cliente encontra facilmente batedeiras abertas na região, compara produtos e preços, e faz pedidos de forma organizada.
- A batedeira ganha visibilidade e um canal de vendas estruturado, sem depender apenas da divulgação boca a boca ou do WhatsApp pessoal.

**Meta de curto prazo:** validar o modelo 100% na cidade de Cametá.
**Meta de longo prazo:** expandir para outras cidades do Pará e, eventualmente, outros estados com forte cultura de açaí tradicional.

---

## 4. Público-Alvo (Personas)

### 4.1 Cliente
Morador de Cametá que consome açaí tradicional regularmente, mas não tem acesso a todos os contatos de batedeiras da cidade, ou quer mais praticidade/transparência (preço, avaliação, horário) na hora de escolher.

### 4.2 Batedeira (vendedor)
Produtor/comerciante local de açaí tradicional, muitas vezes informal, que hoje vende majoritariamente por WhatsApp e boca a boca, com entregadores próprios (frete já embutido no preço, sem cobrança separada).

---

## 5. Escopo — Dois Níveis de Acesso

A plataforma terá dois tipos de usuário com fluxos totalmente separados:

- **Cliente**: descobre batedeiras, monta pedidos, acompanha entrega, avalia.
- **Batedeira**: gerencia perfil, catálogo, pedidos recebidos e status de funcionamento.

---

## 6. Cadastro e Autenticação

### 6.1 Cliente
- Nome completo, telefone, e-mail, senha
- Endereço principal (opcional no cadastro, pode ser preenchido no primeiro pedido)
- Login social (Google/Apple) como alternativa
- Recuperação de senha

### 6.2 Batedeira
- Nome do responsável, nome da batedeira, CPF ou CNPJ
- Telefone, e-mail, senha
- Endereço completo do ponto de venda
- Foto/logo do negócio
- Horário de funcionamento inicial
- Chave Pix para recebimento
- **Documentação (opcional na V1, mas visível no cadastro):**
  - Alvará de funcionamento (sim/não + upload)
  - Licença/alvará sanitário (sim/não + upload)
- Após envio, cadastro entra em **status "em análise"** até aprovação manual antes de ficar visível para clientes

> **Nota:** a exigência (ou não) desses documentos tem implicação legal quanto à responsabilidade da plataforma como intermediária. Recomenda-se consultar um advogado ou contador antes de tornar a documentação obrigatória de fato.

---

## 7. Fluxo do Cliente

1. Visualiza lista de batedeiras — **abertas em destaque**, fechadas em segundo plano com horário de reabertura
2. Busca e filtros: nome, bairro, faixa de preço, tipo de açaí (grosso/fino, com/sem caroço)
3. Acessa perfil da batedeira: fotos, endereço, horário, nota, avaliações, selos ("Verificada", "Documentação Regularizada")
4. Navega pelo catálogo de produtos (variações e preços)
5. Monta pedido (produto, quantidade, endereço de entrega)
6. Escolhe forma de pagamento: **Pix** (QR Code/código gerado na hora), **Débito/Crédito** (fase posterior), ou **pagamento na entrega** (dinheiro, com campo de troco, ou Pix presencial)
7. Pedido é enviado à batedeira, que pode **aceitar ou recusar**
8. Pedido aceito entra na **fila por ordem de chegada**, com horário estimado de entrega (dinâmico)
9. Cliente acompanha status: Aceito → Preparando → Saiu para entrega → Entregue
10. Após entrega, cliente avalia (nota + comentário + foto opcional)

**Regra explícita:** não há chat interno nem exposição do WhatsApp da batedeira — toda comunicação ocorre via status do pedido dentro do app, para evitar que o usuário migre para fora da plataforma (disintermediação).

---

## 8. Fluxo da Batedeira

1. Dashboard com toggle "Aberto/Fechado" e resumo do dia (pedidos pendentes, em preparo, entregues)
2. Gestão de catálogo: adicionar/editar/remover produtos (nome, descrição, preço, foto)
3. Definição de **tempo médio de preparo por pedido** (usado para cálculo da fila)
4. Recebimento de pedidos: aceitar/recusar, atualizar status até entrega
5. Gestão de perfil: fotos, endereço, horário, documentos (status: em análise/aprovado/reenviar)
6. Painel financeiro: pedidos pagos via Pix/cartão (repasse automático via split) vs. pagos na entrega (controle manual)

---

## 9. Regras de Negócio

| Regra | Descrição |
|---|---|
| Fila de pedidos | Ordem de chegada (primeiro a pedir, primeiro a receber) |
| Capacidade | Cada batedeira define tempo médio de preparo, usado para estimar horário de entrega |
| Confirmação | Pedido só entra na fila após aceite da batedeira |
| Cancelamento | Permitido apenas antes do aceite da batedeira |
| Comunicação | Nenhum contato direto (WhatsApp/chat) exposto entre cliente e batedeira |
| Frete | Sempre por conta e com entregador da própria batedeira (sem frota da plataforma) |
| Aprovação de batedeira | Cadastro passa por análise manual antes de ficar visível publicamente |

---

## 10. Pagamento

- **Pix in-app**: geração automática de QR Code/código via gateway (ex: Mercado Pago, Asaas, Pagar.me, Efí), com confirmação automática via webhook
- **Débito/Crédito**: via gateway, fase posterior (não obrigatório na V1)
- **Pagamento na entrega**: dinheiro (com campo de troco) ou Pix presencial
- **Split de pagamento**: caso a plataforma cobre comissão, gateways como Asaas/Pagar.me permitem divisão automática entre plataforma e batedeira, sem repasse manual

---

## 11. Fora do Escopo da V1 (Deliberadamente excluído)

- Chat interno entre cliente e batedeira
- Botão/link direto para WhatsApp
- Frota de entrega própria da plataforma
- Pagamento por cartão (pode entrar em fase posterior)
- Expansão para outras cidades (apenas Cametá na V1)

---

## 12. Roadmap por Fases

### Fase 0 — Validação (sem código)
- Mapeamento de 15-20 batedeiras
- Conversas de validação com batedeiras e clientes
- Protótipo navegável (Figma)

### Fase 1 — MVP
- Cadastro (cliente e batedeira) com aprovação manual
- Catálogo, pedido, fila, pagamento na entrega
- Sem Pix in-app ainda (opcional avaliar incluir desde já)

### Fase 2 — Consolidação
- Integração de pagamento Pix in-app com split automático
- Sistema de avaliações completo
- Selos de verificação/documentação

### Fase 3 — Expansão
- Réplica do modelo para cidades próximas (ex: Abaetetuba, Barcarena)
- Ajustes conforme diferenças culturais regionais no consumo de açaí

---

## 13. Riscos e Pontos de Atenção

- **Adoção das batedeiras**: resistência a abandonar o WhatsApp como canal principal
- **Responsabilidade legal**: como intermediário de venda de alimento perecível, é necessário orientação jurídica/contábil antes do lançamento oficial
- **Engajamento no app**: batedeiras precisam responder pedidos rapidamente pelo app para não gerar experiência pior que o WhatsApp direto
- **Capacidade operacional**: fila mal calculada pode gerar tempos de espera irreais

---

## 14. Próximos Passos Imediatos

1. Finalizar mapeamento de batedeiras (meta inicial: 15-20)
2. Validar aceitação do modelo (sem WhatsApp exposto) diretamente com batedeiras
3. Gerar protótipo navegável no Figma
4. Buscar orientação jurídica/contábil sobre responsabilidade como intermediário
5. Definir stack técnica e decidir se o desenvolvimento será solo, com parceria ou terceirizado
