export default function getConfigs(context, myCompany, $components, $store) {
  $store.commit("model/SET_FILTERS", { context: context });

  return {
    component: $components.DefaultTable,
    externalFilters: false,
    icon: "person",
    //loadOnEdit: true,
    store: "model",
    categories: [context + "-model"],
    add: true,
    "full-width": true,
    "full-height": true,
    delete: true,
    filters: true,
    selection: false,
    search: false,
    companyParam: "people",
    columns: {
      signer: {
        filters: {
          company: "/people/" + myCompany.id,
          link_type: "employee",
          peopleType: "F",
        },
      },
      category: {
        filters: {
          context: context + "-model",
          company: "/people/" + myCompany.id,
        },
      },
    },
  };
}
