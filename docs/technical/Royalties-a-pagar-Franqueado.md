# Royalties a pagar (visão Franqueado)

## Contexto

Filha de **ui-crm#21** (reorganização da tela de Comissões em visões por papel).  
Issue: **ui-crm#24**.

Regra de negócio de franquia (alinhada a ui-customers#10 / #12):

| Papel | Sentido | Tipo de invoice |
| --- | --- | --- |
| Franqueadora | Recebe dos franqueados | `royalties` (a receber) |
| **Franqueado** | **Paga à franqueadora** | **`royalties` (a pagar)** |
| Vendedor | Recebe da empresa | `comission` |

A franqueada **paga** royalties à franqueadora. Esta tela mostra essa perspectiva.

## Rota e menu

| Campo | Valor |
| --- | --- |
| Route name | `RoyaltiesPayablePage` |
| Path | `royalties-a-pagar` |
| Título | Royalties a pagar |

O item de menu deve apontar para `RoyaltiesPayablePage` (não para `ComissionsPage` genérico). A configuração de menu por perfil continua no backend / Menu Access Config.

## Dados e filtros

Request params fixos:

- `invoiceType=royalties`
- `payer=<currentCompany.id>` (empresa logada = franqueada)
- `excludeOwnTransfers=1`

Filtros de UI (DefaultTable / store `invoice`):

- **Período** (`dueDate`) — default `this_month`
- **Status**
- **Receiver** (franqueadora) — contraparte a quem se paga, quando multi-franqueadora

## Implementação

- Página: `src/react/pages/royalties/RoyaltiesPayablePage.js`
- Helpers: `src/react/utils/royaltiesPayableParams.js`
- Lista via `DefaultTable` + store `invoice` (mesmo contrato de Contas a pagar)
- Sem botão de criação nesta visão (invoices de royalties vêm da regra de franquia / orders)

## Testes

- Unit: `src/tests/react/utils/royaltiesPayableParams.test.js`
