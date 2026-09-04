# Orientações para agentes — AçaíConecta

## Comunicação

- Responda ao usuário em português brasileiro, com linguagem clara e objetiva.
- Mantenha nomes técnicos, identificadores, comandos e código no idioma adotado pelo projeto.
- Explique decisões relevantes, riscos, limitações e verificações que não puderam ser executadas.
- Não apresente no chat a contextualização inicial do projeto nem enumere os arquivos consultados, salvo quando o usuário solicitar.
- Informe ao usuário qualquer incoerência, erro, ambiguidade relevante ou conteúdo sem sentido identificado, explicando o impacto e indicando as fontes afetadas.
- Ao concluir cada tarefa, forneça um feedback breve sobre a situação do projeto e informe a fase atual, eventuais avanços, pendências ou riscos relacionados ao trabalho realizado. Não declare mudança de fase sem que seus critérios de conclusão tenham sido verificados e a decisão correspondente tenha sido registrada.

## Contexto do projeto

- O AçaíConecta é uma plataforma em definição para conectar consumidores a batedeiras de açaí tradicional em Cametá/PA.
- O projeto está na Fase 2 — Definição e Prototipação do Produto; ainda não há aplicação implementada.
- A stack definida para o MVP é TypeScript, Next.js, React, Tailwind CSS, MySQL e Prisma, em um monólito modular web responsivo e instalável.
- Não antecipe funcionalidades de fases posteriores nem aumente o escopo do MVP sem solicitação explícita.

## Fontes de verdade

- Consulte `README.md` para a visão geral e o estado atual do projeto.
- Trate `docs/product/PRD.md` como o PRD vigente.
- Trate `docs/product/decisions.md` como o registro oficial de decisões de produto e negócio.
- Trate `docs/product/roadmap.md` como a referência para fases, entregáveis e critérios de conclusão.
- Trate `database/schema.sql` como a fonte oficial da estrutura do banco de dados.
- Trate `database/acai_conecta.mwb` como representação visual derivada do schema SQL.
- Use `docs/product/archive/` somente como histórico; não derive requisitos vigentes desses arquivos.
- Quando documentos vigentes entrarem em conflito, não escolha silenciosamente uma interpretação. Identifique a divergência e proponha a atualização das fontes afetadas.

## Contextualização inicial e análise contínua

- No início de cada nova sessão do projeto, antes de executar a primeira tarefa, analise silenciosamente, profissionalmente e tecnicamente o repositório do detalhe ao contexto geral.
- Leia integralmente `README.md`, `docs/product/PRD.md`, `docs/product/decisions.md`, `docs/product/roadmap.md` e `CHANGELOG.md`; examine também `database/schema.sql` e os demais arquivos diretamente relacionados ao estado atual e à tarefa solicitada.
- Verifique a estrutura do repositório, o estado do Git e as alterações locais existentes para compreender o trabalho em andamento e evitar sobrescritas ou conclusões desatualizadas.
- Cruze requisitos, decisões, roadmap, modelo de dados e estado declarado do projeto. Procure ativamente contradições, lacunas, duplicidades, regras inexequíveis, referências desatualizadas, erros técnicos e itens que não façam sentido no contexto do MVP.
- Faça essa contextualização nos bastidores, sem publicar resumo, lista de verificações ou mensagem introdutória. Prossiga diretamente para a tarefa solicitada quando não houver problema relevante.
- Se encontrar um problema relevante, informe-o de forma objetiva antes de tomar uma decisão que dependa dele. Não interrompa a tarefa por observações meramente estilísticas ou sem impacto prático.
- Mantenha o contexto atualizado durante toda a sessão: após alterações, reavalie as fontes afetadas e o impacto sobre o estado e os critérios da fase atual.

## Fluxo de trabalho

- Antes de alterar qualquer arquivo, examine as fontes de verdade relacionadas à tarefa e as mudanças locais existentes.
- Preserve decisões já registradas e os padrões encontrados no repositório.
- Faça alterações pequenas, coesas e limitadas ao escopo solicitado.
- Não adicione dependências, serviços externos ou decisões arquiteturais sem necessidade e justificativa.
- Registre decisões arquiteturais relevantes como ADRs em `docs/architecture/ADRs/` quando essa estrutura for criada.
- Atualize documentação relacionada quando uma alteração modificar requisitos, comportamento, arquitetura, modelo de dados ou estado do projeto.
- Registre mudanças significativas em `CHANGELOG.md`, na seção `Não lançado`, mantendo ordem cronológica inversa.

## Produto e regras de negócio

- Preserve o foco inicial do piloto em Cametá/PA e o desenvolvimento incremental por fases.
- Use valores monetários em centavos no código e no banco de dados; evite tipos de ponto flutuante para dinheiro.
- Modele estados e transições de pedido conforme o PRD vigente; não invente transições implícitas.
- Considere operações de pagamento e webhooks idempotentes, auditáveis e seguras.
- Minimize a coleta e a exposição de dados pessoais e nunca registre segredos, credenciais, tokens ou dados sensíveis em logs, fixtures ou documentação.

## Banco de dados

- O banco previsto é MySQL 8+ e o ORM definido é Prisma.
- Ao mudar o modelo de dados, mantenha alinhados o schema SQL, o futuro schema Prisma e a documentação aplicável.
- Não edite o arquivo binário `database/acai_conecta.mwb` como se fosse texto.
- Preserve integridade referencial, restrições, índices, histórico necessário e estratégias explícitas de exclusão lógica.
- Migrações devem ser reversíveis quando viável e nunca devem apagar dados sem autorização explícita.

## Implementação

- Quando a aplicação for iniciada, use TypeScript com tipagem estrita e evite `any` sem justificativa.
- Mantenha frontend e backend na mesma base Next.js durante o MVP, respeitando a divisão em módulos de domínio.
- Separe regras de negócio de componentes visuais e de detalhes de infraestrutura.
- Valide entradas em todas as fronteiras do sistema e aplique autorização no servidor.
- Priorize acessibilidade, experiência em dispositivos móveis e conexões instáveis.
- Não exponha variáveis privadas ao cliente nem versione arquivos `.env` com valores reais.

## Qualidade e verificação

- Execute os testes, linters e verificações de tipos relacionados às mudanças quando esses comandos existirem.
- Para novo comportamento, adicione testes proporcionais ao risco, especialmente para estados de pedido, pagamentos, autorização e webhooks.
- Não declare uma tarefa concluída com verificações relevantes falhando.
- Se ainda não houver ferramenta de teste ou validação aplicável, revise a consistência entre os documentos e informe essa limitação.
- Não altere requisitos ou testes apenas para fazer uma implementação incorreta passar.

## Git e segurança do trabalho

- Preserve alterações existentes do usuário e não modifique arquivos não relacionados.
- Não crie commits, branches, tags ou pull requests sem solicitação explícita.
- Não descarte mudanças, reescreva histórico ou execute comandos destrutivos sem autorização explícita.
- Nunca inclua segredos ou credenciais no repositório.
