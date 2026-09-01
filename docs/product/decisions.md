# Registro de decisões do AçaíConecta

**Última atualização:** Setembro de 2026

Este documento registra decisões de produto e negócio. Decisões arquiteturais detalhadas deverão ser registradas futuramente como ADRs em `docs/architecture/ADRs/`.

## Estados

- **Decidida:** aprovada para o escopo atual.
- **Provisória:** adotada para permitir avanço, mas deve ser validada.
- **Pendente:** depende de pesquisa, teste ou escolha do responsável.
- **Substituída:** deixou de valer; a decisão sucessora deve ser indicada.

## Decisões tomadas

| ID | Data | Estado | Decisão | Justificativa |
|---|---|---|---|---|
| DEC-001 | 2026-09-01 | Decidida | Cametá/PA será o mercado inicial. | Reduzir o escopo e validar em um contexto conhecido. |
| DEC-002 | 2026-09-01 | Decidida | A plataforma não terá frota própria no MVP. | Produção e entrega continuarão sob responsabilidade das batedeiras. |
| DEC-003 | 2026-09-01 | Decidida | O MVP usará pagamento na entrega: dinheiro ou Pix presencial. | Evitar complexidade financeira antes da validação operacional. |
| DEC-004 | 2026-09-01 | Decidida | Pix in-app, cartão e split ficarão fora do MVP. | Dependem de modelo financeiro, conciliação e avaliação jurídica. |
| DEC-005 | 2026-09-01 | Decidida | O piloto será controlado e terá inicialmente de 3 a 5 batedeiras. | Permitir acompanhamento próximo e aprendizado com baixo risco. |
| DEC-006 | 2026-09-01 | Provisória | A primeira interface será uma aplicação web responsiva. | Reduzir custo e permitir acesso sem depender de lojas de aplicativos. |
| DEC-007 | 2026-09-01 | Decidida | O projeto será organizado em seis fases com critérios de conclusão. | Evitar crescimento prematuro e separar construção de validação. |
| DEC-008 | 2026-09-01 | Decidida | Markdown será a fonte oficial da documentação versionada. | Facilitar revisão, histórico e comparação no Git. |

## Decisões pendentes

| ID | Prioridade | Decisão necessária | Evidência ou responsável esperado |
|---|---|---|---|
| PEN-001 | Alta | Retirada no local fará parte do MVP? | Confirmar demanda e operação com batedeiras. |
| PEN-002 | Alta | Qual será a regra definitiva de ordenação da fila? | Comparar ordem de criação, aceite e necessidade operacional. |
| PEN-003 | Alta | Quem poderá cancelar após o aceite e em quais estados? | Definir política operacional antes do backlog. |
| PEN-004 | Alta | Quem marcará e contestará a entrega? | Definir fluxo de conclusão e suporte. |
| PEN-005 | Alta | Como ocorrerá a comunicação em exceções de entrega? | Testar mensagens predefinidas e contingência. |
| PEN-006 | Alta | A batedeira poderá se cadastrar sozinha no MVP? | Avaliar complexidade versus benefício no piloto. |
| PEN-007 | Média | Qual será o prazo definitivo para aceitar pedidos? | Validar capacidade real das batedeiras. |
| PEN-008 | Média | Quais bairros participarão do piloto? | Mapear cobertura dos participantes selecionados. |
| PEN-009 | Média | Haverá pedido mínimo por batedeira? | Verificar política comercial de cada participante. |
| PEN-010 | Média | Qual será o modelo de receita após o piloto? | Avaliar comissão, mensalidade e modelo híbrido. |
| PEN-011 | Média | Quais documentos serão exigidos das batedeiras? | Orientação jurídica e definição administrativa. |
| PEN-012 | Baixa neste momento | Qual será a stack definitiva? | Definir após fluxos, MER e capacidade de desenvolvimento. |

## Modelo para novas decisões

Ao registrar uma decisão, informe:

- identificador;
- data;
- estado;
- contexto;
- alternativas consideradas;
- decisão;
- justificativa;
- consequências;
- responsável, quando aplicável.

