import HomePage from '@controleonline/ui-crm/src/react/pages/home/index';
import Comissions from '@controleonline/ui-crm/src/react/pages/comissions';
import CrmIndex from '@controleonline/ui-crm/src/react/pages/crm/index';
import ContractsPage from '@controleonline/ui-contracts/src/react/pages/ContractsPage';
import ProposalsPage from '../pages/proposals';
import CrmConversation from '../pages/crm/conversation';

const crmRoutes = [
  {
    name: 'HomePage',
    component: HomePage,
    options: {
      headerShown: false,
      headerBackVisible: false,
      headerLeft: () => null,
    },
  },
  {
    name: 'ComissionsPage',
    component: Comissions,
    options: {
      headerShown: true,
      headerBackVisible: true,
      title: 'Comissoes',
    },
  },
  {
    name: 'CrmIndex',
    component: CrmIndex,
    options: {
      headerShown: true,
      headerBackVisible: true,
      title: 'Oportunidades',
      headerLeft: () => null,
    },
  },
  {
    name: 'ContractsIndex',
    component: ContractsPage,
    options: {
      headerShown: true,
      headerBackVisible: true,
      title: 'Contratos',
    },
  },
  {
    name: 'ProposalsIndex',
    component: ProposalsPage,
    options: {
      headerShown: true,
      headerBackVisible: true,
      title: 'Propostas',
    },
  },
  {
    name: 'CrmConversation',
    component: CrmConversation,
    options: {
      headerShown: false,
      headerBackVisible: false,
      title: 'Propostas',
    },
  },
];

export default crmRoutes;
