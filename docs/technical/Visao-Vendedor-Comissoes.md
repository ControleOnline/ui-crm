# Visão Vendedor — Comissões (invoice tipo `comission`)

## Objetivo

Tela dedicada para o **papel vendedor** consultar o resumo mensal das invoices do tipo **`comission`** geradas a partir de orders de clientes que geram comissão para ele.

## Sentido do fluxo

| Papel | Tipo de invoice | Direção |
| --- | --- | --- |
| **Vendedor** | `comission` | O vendedor **recebe** da empresa (não paga) |

Não misturar com royalties (franquia) nem com Income Statements genéricos.

## Rota e menu

- Rota React Navigation: **`SellerCommissionsPage`**
- Título sugerido de menu: **Minhas comissões**
- Módulo: `ui-crm` → `src/react/pages/comissions/SellerCommissionsPage.js`

A rota antiga `ComissionsPage` permanece como Income Statements (visão empresa) até a task pai `ui-crm#21` concluir a migração das demais visões.

## Dados

1. Endpoint preferencial (legacy): `GET /finance/comission`
2. Fallback: `GET /invoices?invoiceType=comission&receiver={sellerPeopleId}`
3. O vendedor logado é resolvido via `auth.user.people`
4. Agrupamento client-side por mês da `dueDate` (fallback `invoice_date`)
5. Filtro por **cliente** (chips) a partir de `invoice.order[].order.client`

## Filtros

- Ano / mês (chips + controle de ano)
- Cliente (chips derivados das invoices carregadas)

## Arquivos

| Arquivo | Responsabilidade |
| --- | --- |
| `SellerCommissionsPage.js` | Orquestração UI e fetch |
| `sellerCommissionsHelpers.js` | Agrupamento, filtros, normalização (puro) |
| `SellerCommissionsPage.styles.js` | Estilos |
| `src/react/router/routes.js` | Registro da rota |

## Relação com outras tasks

- `ui-crm#21` — task pai (reorganizar visões)
- `ui-customers#12` — override de comissão por cliente (valor efetivo nas orders)
- `ui-customers#10` — base de comission no vínculo
- Backend: `api-platform-legacy` entidade `ComissionInvoice` (`/finance/comission`)

## Critérios de aceite cobertos nesta entrega

- [x] Tela/rota dedicada (não misturar com royalties)
- [x] Filtro por cliente + período
- [x] Dados a partir de invoices tipo `comission` ligadas ao vendedor logado
- [x] Testes unitários dos helpers + smoke skeleton com testIDs
- [x] Documentação técnica (este arquivo)
