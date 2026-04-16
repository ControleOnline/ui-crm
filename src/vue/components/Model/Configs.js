const getCategoryContext = context => {
  const normalizedContext = String(context || '').trim();

  if (normalizedContext === 'proposal') {
    return 'proposal-category';
  }

  if (normalizedContext === 'contract') {
    return 'contract-category';
  }

  return `${normalizedContext}-category`;
};

export default function getConfigs(context, myCompany, $components, $store) {
  $store.commit("model/SET_FILTERS", { context: context });
  const categoryContext = getCategoryContext(context);

  return {
    component: $components.DefaultTable,
    externalFilters: false,
    icon: "person",
    //loadOnEdit: true,
    store: "model",
    categories: [categoryContext],
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
          linkType: "employee",
          peopleType: "F",
        },
      },
      category: {
        filters: {
          context: categoryContext,
          company: "/people/" + myCompany.id,
        },
      },
    },
  };
}
