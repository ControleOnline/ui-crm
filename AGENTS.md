## Escopo
- Modulo comercial/CRM.
- Cobre area de vendedores, comissoes, fluxos comerciais e partes de configuracao comercial.

## Estado
- Este modulo tem implementacao ativa em `src/react` e deve constar em novos prompts.
- Se existir `src/vue`, ela e apenas legado e deve ser ignorada, salvo pedido explicito.

## Quando usar
- Prompts sobre CRM, vendedor, comissao, fluxo comercial, home comercial e configuracoes comerciais.
- O configurador geral de pagamento remoto dos pedidos vive neste modulo e define o device padrao, a lista de devices permitidos e se o operador pode trocar de equipamento no checkout.

## Limites
- Este modulo nao deve receber responsabilidades administrativas do `MANAGER` quando elas forem claramente de gestao.
