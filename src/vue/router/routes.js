export const routes = [
  {
    path: '/crm/',
    component: () =>  import ('@controleonline/ui-layout/src/vue/layouts/AdminLayout.vue'),
    children: [
      {
        name: 'CustomerServices',
        path: '',
        component: () =>  import ('../pages/CRM')
      },
      {
        name: 'RelationshipDetails',
        path: 'id/:id',
        component: () =>  import ('../pages/CRM/details.vue')
      }
    ]
  },
  {
    path: "/proposal/models/",
    component: () =>
      import("@controleonline/ui-layout/src/vue/layouts/AdminLayout.vue"),
    children: [
      {
        name: "proposalModel",
        path: "",
        component: () =>
          import("@controleonline/ui-crm/src/vue/pages/Model"),
      },
      {
        name: "modelDetails",
        path: "id/:id",
        component: () =>
          import(
            "@controleonline/ui-crm/src/vue/pages/Model/Details.vue"
          ),
      },
    ],
  },
];
