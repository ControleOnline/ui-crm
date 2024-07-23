export const routes = [
  {
    path: '/crm/',
    component: () =>  import ('@controleonline/quasar-layout-ui/src/layouts/AdminLayout.vue'),
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
  }
];
