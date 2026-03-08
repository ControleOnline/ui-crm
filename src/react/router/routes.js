import Comissions from '@controleonline/ui-crm/src/react/pages/comissions';
import CrmIndex from '@controleonline/ui-crm/src/react/pages/crm/index';
import ProposalsPage from '../pages/proposals';
import CrmConversation from '../pages/crm/conversation';
import CRMSettings from '../pages/settings/CRMSettings';
import ProposalDetails from '../pages/proposals/ProposalDetails';

const crmRoutes = [
  {
    name: 'ComissionsPage',
    component: Comissions,
    options: {
      showBottomToolBar: true,
      headerShown: true,
      headerBackVisible: true,
      title: 'Comiss\u00f5es',
    },
  },
    {
    name: 'ProposalDetails',
    component: ProposalDetails,
    options: {
      showBottomToolBar: true,
      headerShown: true,
      headerBackVisible: true,
      title: 'Proposta',
    },
  },
  {
    name: 'CRMSettings',
    component: CRMSettings,
    options: {
      showBottomToolBar: true,
      headerShown: true,
      headerBackVisible: true,
      title: 'Configurações',
    },
  },
  {
    name: 'CrmIndex',
    component: CrmIndex,
    options: {
      showBottomToolBar: true,
      headerShown: true,
      headerBackVisible: true,
      title: 'Oportunidades',
    },
  },
  {
    name: 'ProposalsIndex',
    component: ProposalsPage,
    options: {
      showCompanyFilter: true,
      showBottomToolBar: true,
      headerShown: true,
      headerBackVisible: true,
      title: 'Propostas',
    },
  },
  {
    name: 'CrmConversation',
    component: CrmConversation,
    options: {
      showBottomToolBar: false,
      headerShown: false,
      headerBackVisible: false,
      title: 'Propostas',
    },
  },
];

export default crmRoutes;
