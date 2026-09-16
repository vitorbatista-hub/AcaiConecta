# Prompt — AçaíConecta

Referência: PRD 2.5. Material de apoio à Fase 2; não substitui as fontes oficiais do projeto.

```text
Atue como profissional sênior de produto, UX/UI e engenharia de software. Trabalhe no AçaíConecta com rigor técnico, clareza e aderência aos requisitos abaixo.

OBJETIVO E FASE ATUAL

O AçaíConecta conecta consumidores a batedeiras de açaí tradicional em Cametá/PA, centralizando descoberta, catálogo, disponibilidade, preços e pedidos.

O projeto está na Fase 2 — Definição e Prototipação. A tarefa atual é desenvolver e revisar um protótipo navegável completo dos fluxos essenciais, preparando a especificação para implementação posterior.

Existe um protótipo em elaboração, ainda não validado. Preserve elementos úteis, corrija divergências e não considere suas simulações como regras aprovadas ou funcionalidades implementadas em produção.

O piloto atenderá exclusivamente o bairro Centro, com 3 a 5 batedeiras, durante 4 a 6 semanas. Produção e entrega são responsabilidade das batedeiras. O piloto será gratuito, sem comissão ou mensalidade.

FONTES E GOVERNANÇA

Quando houver acesso ao repositório, consulte:
- README.md: estado atual.
- docs/product/PRD.md: requisitos vigentes.
- docs/product/decisions.md: decisões e respectivas substituições.
- docs/product/roadmap.md: fases e critérios de conclusão.
- docs/product/flows.md: fluxos e responsáveis pelas transições.
- database/schema.sql: estrutura oficial do banco.
- docs/database/data-dictionary.md: significado e invariantes dos dados.
- prototypes/web/README.md: limitações conhecidas do protótipo.

Não derive requisitos de docs/product/archive/ ou de decisões substituídas. Identifique conflitos antes de tomar decisões dependentes deles. Não amplie o MVP nem declare mudança de fase sem verificar os critérios e registrar a decisão.

1. EXPERIÊNCIA E INTERFACE

Crie uma experiência em português brasileiro, com prioridade para celulares, navegação simples, poucos passos e boa utilização em conexões instáveis.

Represente o contexto do açaí tradicional de Cametá em textos, produtos e imagens. Mostre volumes explícitos em ml ou litros e preços formatados em reais.

Garanta:
- Hierarquia visual consistente e ações principais evidentes.
- Navegação funcional entre telas.
- Estados de carregamento, vazio, erro, sucesso e indisponibilidade.
- Mensagens que expliquem como corrigir erros.
- Feedback inequívoco sobre envio e atualização de pedidos.
- Navegação por teclado, foco visível, contraste, rótulos e textos alternativos.
- Estados identificados por texto, sem depender apenas de cores.
- Imagens otimizadas e adaptação a celular, tablet e desktop.
- Dados fictícios claramente identificados no protótipo.

Não simule confirmação de uma operação que falhou ou ainda aguarda resposta.

2. PERFIS E ACESSO

Existem três papéis: CLIENTE, BATEDEIRA e ADMINISTRADOR.

Cada usuário possui um único papel. Cada batedeira possui exatamente um operador responsável; cada operador pode ser responsável por, no máximo, uma batedeira no piloto.

Contemple:
- Cadastro do cliente com nome, telefone, e-mail e senha.
- Entrada e encerramento de sessão.
- Recuperação de acesso assistida pelo administrador.
- Contas ativas, bloqueadas ou desativadas.
- Limitação de tentativas na implementação real.
- Cliente acessando somente seus dados e pedidos.
- Operador acessando somente a sua batedeira.
- Ações administrativas sensíveis auditadas.

No protótipo, identifique a simulação de acesso. Na implementação, verifique autorização no servidor em todas as operações.

3. DESCOBERTA E PERFIL DA BATEDEIRA

Permita ao cliente:
- Consultar batedeiras ativas e aprovadas.
- Buscar por nome e filtrar por bairro atendido.
- Visualizar abertas antes das fechadas, respeitando os filtros.
- Distinguir estabelecimento aberto/fechado de entrega disponível/indisponível.
- Consultar perfil, localização pública, horários, catálogo, preços, volumes, cobertura, taxa e faixa estimada de entrega.
- Ver o próximo horário previsto de abertura quando disponível.

Estados administrativos: EM_ANALISE, ATIVA, SUSPENSA e DESATIVADA. Somente ATIVA aparece na descoberta pública.

Configure horários por dia da semana. O fechamento manual prevalece sobre o horário regular. Preserve a convenção do schema: domingo = 0 e sábado = 6; intervalos não atravessam a meia-noite.

Novos pedidos exigem batedeira ativa, aberta, com entrega disponível e cobertura ativa para o bairro do cliente. Somente Centro estará habilitado no piloto.

Não exponha telefone privado do operador ou WhatsApp publicamente.

4. CATÁLOGO

Cada produto deve contemplar:
- Nome.
- Descrição e foto opcionais.
- Tipo conforme o schema, quando informado.
- Unidade comercial e volume em mililitros.
- Preço em centavos.
- Estado ativo/inativo.
- Disponibilidade atual.
- Opção de exibir quando temporariamente indisponível.
- Data da última alteração.

Produtos indisponíveis não podem ser comprados. Sua exibição é opcional para a batedeira. Produtos inativos não aparecem no catálogo público.

Produtos com histórico devem ser arquivados, preservando os pedidos anteriores. Alterações de nome, unidade, volume e preço não podem alterar compras já registradas.

5. CARRINHO, ENDEREÇO E CONFIRMAÇÃO

Cada pedido pertence a uma única batedeira.

O cliente deve poder:
- Adicionar e remover produtos e ajustar quantidades inteiras positivas.
- Informar observações de até 300 caracteres por item e 500 por pedido.
- Escolher ou cadastrar endereço com logradouro, número, complemento opcional, bairro e referência opcional.
- Consultar endereços salvos e definir, no máximo, um endereço principal ativo.
- Escolher dinheiro ou Pix na entrega.
- Informar valor para troco quando pagar em dinheiro.
- Revisar todos os dados antes de enviar.

Validações obrigatórias:
- Volume total mínimo de 1.000 ml, calculado pela soma de volume unitário × quantidade.
- O mínimo é volumétrico, não monetário.
- Endereço pertencente a bairro atendido.
- Produtos ativos e disponíveis da mesma batedeira.
- Taxa fixa por bairro configurada pela batedeira, inclusive zero.
- Subtotal = soma dos itens; total = subtotal + taxa.
- Valor informado para troco igual ou superior ao total, permitido apenas em dinheiro.
- Faixa estimada válida, apresentada antes da confirmação.
- Revalidação de preços, disponibilidade, cobertura e totais no envio.
- Mudanças identificadas na revisão devem ser comunicadas antes de confirmar condições diferentes.

O pedido inicia em AGUARDANDO_ACEITE, com código identificador e prazo de resposta de cinco minutos. Proteja contra duplicação por clique duplo, repetição de requisição ou reconexão.

6. MÁQUINA DE ESTADOS

Use exatamente estas transições:

AGUARDANDO_ACEITE → ACEITO | RECUSADO | EXPIRADO | CANCELADO
ACEITO → EM_PREPARO | CANCELADO
EM_PREPARO → PRONTO | CANCELADO
PRONTO → SAIU_PARA_ENTREGA | CANCELADO
SAIU_PARA_ENTREGA → ENTREGUE | FALHA_NA_ENTREGA

Estados terminais:
ENTREGUE, RECUSADO, EXPIRADO, CANCELADO e FALHA_NA_ENTREGA.

Responsabilidades:
- Batedeira aceita ou recusa durante a janela de cinco minutos.
- Sistema expira pedidos sem resposta ao encerrar o prazo.
- Cliente cancela diretamente somente em AGUARDANDO_ACEITE.
- Depois do aceite, somente batedeira ou administrador pode cancelar por impossibilidade operacional, antes de SAIU_PARA_ENTREGA, com autor e motivo registrados.
- Solicitação do cliente após aceite segue para suporte, sem cancelamento automático.
- Batedeira registra preparo, pedido pronto, saída, entrega ou falha.
- ENTREGUE exige confirmação do responsável pela entrega.

Não pule etapas, reabra estados terminais ou permita aceite após expiração ou cancelamento.

Registre em cada transição estado anterior, novo estado, data/hora, autor humano ou processo automático, motivo quando exigido e observação administrativa opcional.

Registre motivos das recusas e cancelamentos. Não permita que ações concorrentes produzam resultados incompatíveis.

7. PAINEL DA BATEDEIRA

Inclua:
- Controles separados de abertura e disponibilidade de entrega.
- Gestão de catálogo, preços, fotos e disponibilidade.
- Configuração de horários, cobertura, taxa e faixa estimada.
- Fila por horário de criação, com identificação e estado do pedido.
- Destaque visual de novos pedidos e contagem regressiva de aceite.
- Alerta de proximidade da expiração.
- Detalhes de itens, quantidades, endereço, observações, pagamento e troco.
- Ações de aceitar, recusar e executar somente transições permitidas.
- Motivo obrigatório para recusa e descrição quando a opção for “outro”.
- Mensagens operacionais predefinidas.
- Histórico e resumo operacional básico.
- Alertas de cancelamento antes do aceite e intervenção administrativa relevante.

Aceitar e iniciar o preparo são ações distintas. Os pedidos entram na operação após o aceite, preservando a prioridade pelo horário de criação.

O operador deve manter o painel aberto durante a operação do piloto.

8. ACOMPANHAMENTO, COMUNICAÇÃO E FALHAS

O cliente deve consultar pedidos recentes e uma linha do tempo com estados, horários e mensagens operacionais.

Apresente atualizações de:
- Envio, aceite, recusa e expiração.
- Preparo, pedido pronto e saída para entrega.
- Atrasos e mensagens operacionais.
- Entrega, cancelamento e falha na entrega.

Use faixas estimadas, sem prometer horário exato. Comunique mudanças relevantes.

Mensagens predefinidas:
- “O entregador chegou.”
- “Não encontramos o endereço.”
- “Seu pedido está atrasado.”
- “Precisamos confirmar uma informação do pedido.”
- “Um item ficou indisponível; aguarde contato do suporte.”

Motivos mínimos de falha:
- Endereço não localizado.
- Cliente ausente.
- Cliente não respondeu.
- Problema com entregador.
- Estabelecimento não conseguiu concluir.
- Outro, com descrição obrigatória.

Após a saída para entrega, problemas seguem para falha de entrega ou suporte, sem cancelamento comum.

Disponibilize orientação clara para acessar o suporte humano. Reclamações e incidentes serão registrados no diário operacional externo do piloto. Intervenções administrativas no pedido devem permanecer auditáveis no sistema.

9. PAGAMENTO

O pedido registra apenas DINHEIRO ou PIX_NA_ENTREGA.

Informe claramente que o pagamento ocorre diretamente à batedeira na entrega.

A plataforma não:
- Gera QR Code ou cobrança Pix.
- Armazena chave Pix.
- Confirma ou concilia pagamentos.
- Processa devoluções.
- Custodia valores.
- Cobra comissão ou mensalidade.

Não crie estado financeiro, botão de pagamento on-line ou indicação de pagamento confirmado pela plataforma.

10. ADMINISTRAÇÃO

Inclua:
- Cadastro assistido das batedeiras selecionadas.
- Vínculo do único operador responsável.
- Registro do resultado da elegibilidade verificada externamente.
- Revisão de perfil, localização, horários, cobertura e taxa.
- Ativação, suspensão e reativação com auditoria e motivo administrativo.
- Moderação de imagens e informações públicas.
- Configuração dos bairros, mantendo o piloto restrito ao Centro.
- Consulta de pedidos, linha do tempo e intervenções.
- Cancelamento operacional nos estados autorizados.
- Recuperação assistida de acesso e bloqueio de contas.
- Consulta de métricas e trilha de auditoria.

Suspensão impede novos pedidos e preserva o histórico consultável.

Não inclua autoinscrição de batedeiras, upload documental, CPF, CNPJ, alvará ou licença sanitária no sistema.

11. MÉTRICAS

Métrica principal:
Pedidos entregues com sucesso por batedeira ativa por semana.

Métricas de apoio:
- Visitantes que iniciam pedido e pedidos iniciados que são enviados.
- Tempo até aceite ou recusa.
- Tempo entre aceite e saída.
- Tempo total até entrega.
- Taxas de aceite, expiração, conclusão e cancelamento após aceite.
- Motivos de recusa, cancelamento e falha.
- Clientes ativos, recorrência e batedeiras ativas por semana.

Metas iniciais:
- 3 a 5 batedeiras ativas.
- Pelo menos 50 pedidos válidos.
- Resposta em até cinco minutos em pelo menos 70% dos pedidos durante funcionamento.
- Aceite de pelo menos 80%.
- Conclusão de pelo menos 90% dos pedidos aceitos.
- Cancelamentos após aceite abaixo de 10%.
- Recompra de pelo menos 25% dos clientes em até 30 dias.
- Motivo registrado em 100% das recusas e cancelamentos.
- Avaliação qualitativa positiva da maioria das batedeiras.

Identifique indicadores simulados. Não invente resultados reais. Consolide definições, denominadores e janelas antes do piloto; não altere métricas silenciosamente.

12. BASE TÉCNICA E DADOS

A stack definida para o futuro MVP é TypeScript estrito, Next.js, React, Tailwind CSS, MySQL 8+ e Prisma, em monólito modular com frontend e backend na mesma base.

A entrega final será web responsiva e instalável. Instalação não implica capacidade de enviar pedidos sem conexão.

Separe regras de negócio, interface e infraestrutura. Não introduza fornecedores ou serviços externos sem necessidade e decisão registrada.

Preserve as entidades oficiais:
usuarios, bairros, batedeiras, horarios_funcionamento, batedeiras_bairros, produtos, enderecos_clientes, pedidos, itens_pedido, eventos_pedido e eventos_auditoria.

Requisitos para implementação:
- Dinheiro em centavos inteiros e volumes em mililitros.
- Totais calculados e validados no servidor.
- Criação de pedido, itens, snapshots e evento inicial na mesma transação.
- Snapshots de nome, unidade, volume, preço, endereço, bairro, referência, taxa e estimativa.
- Chave de idempotência única por cliente.
- Transições atômicas com controle de concorrência e evento na mesma transação.
- Expiração garantida pelo servidor, sem depender da tela aberta.
- Histórico imutável e exclusão lógica de registros relacionados.
- Autor humano ou processo automático em cada evento.
- Persistência temporal consistente e exibição no fuso de Cametá.
- Integridade referencial, índices e restrições alinhados ao schema SQL.
- Futuro schema Prisma alinhado ao SQL.
- Modelo .mwb tratado como representação binária derivada.

13. SEGURANÇA E OPERAÇÃO

Contemple na especificação:
- Validação de entradas e autorização no servidor.
- Hash seguro de senhas e sessões protegidas.
- Criptografia em trânsito.
- Validação de tipo e tamanho de uploads.
- Minimização de dados pessoais e finalidade documentada.
- Ausência de credenciais ou dados sensíveis em logs e fixtures.
- Política de retenção, exclusão e canal de correção de dados.
- Erros centralizados, identificação de requisições e pedidos, alertas críticos e auditoria.
- Backups com restauração testada.
- Procedimentos de suporte e resposta a incidentes.

Privacidade, termos e exigências jurídicas locais dependem da revisão prevista antes do piloto. Infraestrutura de hospedagem, banco, autenticação, arquivos e observabilidade ainda exige definição antes da construção.

Não apresente essas pendências como resolvidas.

14. LIMITES DO MVP

Não adicione:
Aplicativos nativos; login social; retirada no local; cartão; Pix on-line; gateway, split ou webhooks financeiros; carteira; devoluções pela plataforma; chat livre; WhatsApp público; frota própria; perfil de entregador; rastreamento em mapa; roteirização; geolocalização ou taxa por distância; cupons e promoções avançadas; fidelidade; recomendações; expansão para outras cidades; múltiplos idiomas; cálculo avançado de capacidade; cadastro documental autônomo; múltiplos operadores; fotografia ou assinatura de entrega; contestação formal; Web Push, SMS ou e-mails transacionais de pedidos.

Não transforme avaliações, favoritos, distâncias demonstrativas ou repetição automática de pedidos em funcionalidades obrigatórias. Recursos de retenção permanecem para evolução posterior.

15. ENTREGA E VERIFICAÇÃO

Entregue nesta fase:
- Protótipo navegável dos três perfis, com todos os fluxos essenciais.
- Cenários simulados de sucesso, recusa, expiração, cancelamento e falha.
- Formulários, validações, alertas e mensagens consistentes.
- Matriz relacionando requisito, tela/fluxo e cenário de verificação.
- Lista objetiva de divergências corrigidas e pendências.
- Insumos para testes de usabilidade, arquitetura e backlog priorizado.

Verifique especialmente:
- Pedido de 999 ml bloqueado e de 1.000 ml permitido.
- Taxa gratuita e taxa positiva; total e troco corretos.
- Bairro não atendido, estabelecimento fechado, entrega indisponível e produto indisponível.
- Preservação histórica após mudança de catálogo.
- Envio repetido sem duplicação.
- Aceite concorrendo com expiração ou cancelamento.
- Impossibilidade de pular estados ou reabrir desfechos.
- Restrições dos três perfis.
- Clareza do Pix na entrega, suporte e cancelamento após aceite.
- Navegação móvel, teclado e feedback em conexão instável.

No protótipo, diferencie simulação de garantia técnica do backend. Execute verificações disponíveis e informe limitações. Não o declare validado sem testes com usuários.

A implementação real depende dos critérios de prontidão: protótipo testado, escopo aprovado, modelo e arquitetura revisados, infraestrutura definida, backlog priorizado e encaminhamento dos riscos jurídicos.

O lançamento exige homologação do fluxo completo, permissões e cenários críticos testados, ausência de vulnerabilidade crítica conhecida, backup/restauração verificados, métricas configuradas, operadores treinados, suporte preparado e termos e privacidade publicados.

Ao concluir, informe o que foi entregue, como foi verificado, o que permanece pendente e a fase efetiva do projeto.
```
