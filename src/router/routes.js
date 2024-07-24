export const routes = [
  {
    path: '/crm/',
    component: () =>  import ('@controleonline/ui-layout/src/layouts/AdminLayout.vue'),
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
