import Comissions from '@controleonline/ui-crm/src/react/pages/comissions';
import CrmIndex from '@controleonline/ui-crm/src/react/pages/crm/index';
import ContractsPage from '@controleonline/ui-contracts/src/react/pages/ContractsPage';
import ProposalsPage from '../pages/proposals';
import CrmConversation from '../pages/crm/conversation';

const crmRoutes = [
  {
    name: 'ComissionsPage',
    component: Comissions,
    options: {
      showToolBar: true,
      headerShown: true,
      headerBackVisible: true,
      title: 'Comissões',
    },
  },
  {
    name: 'CrmIndex',
    component: CrmIndex,
    options: {
      showToolBar: true,
      headerShown: true,
      headerBackVisible: true,
      title: 'Oportunidades',
    },
  },

  {
    name: 'ContractsIndex',
    component: ContractsPage,
    options: {
      showToolBar: true,
      headerShown: true,
      headerBackVisible: true,
      title: 'Contratos',
    },
  },
  {
    name: 'ProposalsIndex',
    component: ProposalsPage,
    options: {
      showToolBar: true,
      headerShown: true,
      headerBackVisible: true,
      title: 'Propostas',
    },
  },
  {
    name: 'CrmConversation',
    component: CrmConversation,
    options: {
      showToolBar: true,
      headerShown: false,
      headerBackVisible: false,
      title: 'Propostas',
    },
  },
];

export default crmRoutes;