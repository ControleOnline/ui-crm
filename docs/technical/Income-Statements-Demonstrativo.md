# Income Statements (Demonstrativo geral)

**Issue:** [ui-crm#26](https://github.com/ControleOnline/ui-crm/issues/26) (filha de [ui-crm#21](https://github.com/ControleOnline/ui-crm/issues/21))

## O que é

Visão **geral da empresa**: receitas e despesas agrupadas por **categorias contábeis** (incluindo comissões, royalties e demais naturezas que o backend expõe em `/income_statements`).

Rota React Navigation:

- `ComissionsPage` (nome legado, mantido para menus/config existentes)
- `IncomeStatementsPage` (alias)
- Título exibido: **Demonstrativo**

Código: `src/react/pages/comissions/` (`IncomeStatements` + helpers).

## O que não é

| Visão | Issue | Tipo / sentido |
| --- | --- | --- |
| Comissões do vendedor | ui-crm#22 | invoice `comission` — vendedor **recebe** da empresa |
| Royalties a receber (franqueadora) | ui-crm#23 | invoice `royalties` |
| Royalties a pagar (franqueado) | ui-crm#24 | invoice `royalties` |
| Recebíveis / pagamentos motoboy | ui-crm#25 | fluxo de entrega |

O demonstrativo **complementa** essas listas; não as substitui.

## Filtros

- **Ano** e **mês** (API `/income_statements`)
- **Natureza**: todos / receitas / despesas (client-side)
- **Categoria**: busca por nome de categoria pai ou filha (ex.: “comission”, “royalties”) — client-side sobre o agrupamento retornado

## Backend

Store action: `invoice.actions.getIncomeStatements` → `GET /income_statements` (`ui-financial` customActions).

Parâmetros: `people` (company id), `year`, opcional `month`.
