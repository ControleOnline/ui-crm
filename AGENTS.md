## Ponto de entrada

- A documentação funcional e de regras deste modulo vive na **wiki do proprio repositório** e na wiki principal do app.
- Regras transversais de qualidade, modularizacao e limites de componente vivem em `https://github.com/ControleOnline/agents-mcp/blob/master/skills/shared/code-quality.md`.
- Quando houver detalhe especifico de implementacao, prefira comentar no codigo em ingles perto da regra.
- Este arquivo deve ficar curto e servir apenas como ponte para as fontes oficiais.

## Documentação (navegação humana)

Sempre comece pela **Home** da wiki e siga as categorias abaixo.

| Categoria | Destino |
| --- | --- |
| Home do módulo | https://github.com/ControleOnline/ui-crm/wiki |
| Wiki principal do app | https://github.com/ControleOnline/app-community/wiki |
| Wiki da API | https://github.com/ControleOnline/api-community/wiki |
| Visões do app (`APP_TYPE`) | https://github.com/ControleOnline/app-community/blob/master/MODOS_OPERACAO.md |

### Por categoria — fluxos de negócio (CRM)

| Página | O que documenta |
| --- | --- |
| [Cliente × Vendedor — vínculo e permissões](https://github.com/ControleOnline/ui-crm/wiki/Cliente-Vendedor-Vinculo-e-Permissoes) | Vínculo automático, handoff CRM → detalhe, corte MANAGER vs demais |
| [Propostas — Filtro de status](https://github.com/ControleOnline/ui-crm/wiki/Propostas-Filtro-de-Status) | Chips de status (fixos + dinâmicos), matching e parâmetros de listagem |
| [Oportunidades — estado vazio e filtros](https://github.com/ControleOnline/ui-crm/wiki/Oportunidades-Estado-Vazio-e-Filtros) | Empty state vs filtered; helper `getOpportunityEmptyStateMode` |
| [Oportunidades — ordenação por data de retorno](https://github.com/ControleOnline/ui-crm/wiki/Oportunidades-Ordenacao-por-Data-de-Retorno) | Ordenação client-side por dueDate/alterDate (mais antiga → mais nova) |
| [Visão Vendedor — Comissões](https://github.com/ControleOnline/ui-crm/wiki/Visao-Vendedor-Comissoes) | Invoices tipo `comission`; vendedor recebe; filtro cliente + período |

Cópias versionadas no Git:
- `docs/technical/Cliente-Vendedor-Vinculo-e-Permissoes.md`
- `docs/technical/Propostas-Filtro-de-Status.md`
- `docs/technical/Visao-Vendedor-Comissoes.md`

### Visão deste módulo

`ui-crm` atende o **`APP_TYPE=CRM`** (visão comercial): oportunidades, pipeline, propostas, comissões e relacionamento.

- **Não** é backoffice (`MANAGER` / `ADMIN`).
- **Não** opera caixa (`POS`) nem vitrine (`SHOP`).
- Módulos típicos no mesmo fluxo comercial: `ui-crm`, `ui-customers`, `ui-contracts`, `ui-common`.

No fluxo cliente × vendedor:

1. o CRM abre o cliente com contexto seguro (`clientId`, `contextKey=client`, aba `sellers` quando PJ);
2. o detalhe e a aba de vendedores vivem em `ui-customers`;
3. vínculo automático e `people_link` vivem em `api-platform-people`.

### Módulos relacionados (mesmo fluxo)

| Módulo | Papel | Entrada da documentação |
| --- | --- |
| `ui-customers` | Detalhe do cliente / aba Vendedores | https://github.com/ControleOnline/ui-customers/wiki |
| `api-platform-people` | Backend de vínculos e distribuição | https://github.com/ControleOnline/api-platform-people/wiki |
| `app-community` | Home do app e mapa de submódulos | https://github.com/ControleOnline/app-community/wiki |
