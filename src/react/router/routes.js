import Comissions from '@controleonline/ui-crm/src/react/pages/comissions';
import RoyaltiesPayablePage from '@controleonline/ui-crm/src/react/pages/royalties/RoyaltiesPayablePage';
import RoyaltiesReceivablePage from '@controleonline/ui-crm/src/react/pages/royalties/ReceivablePage';
import CrmIndex from '@controleonline/ui-crm/src/react/pages/crm/index';
import ProposalsPage from '../pages/proposals';
import CrmConversation from '../pages/crm/conversation';
import GeneralSettings from '../pages/settings/GeneralSettings';
import ProposalDetails from '../pages/proposals/ProposalDetails';

const crmRoutes = [
  {
    name: 'ComissionsPage',
    component: Comissions,
    options: {
      showCompanyFilter: true,
      showBottomToolBar: true,
      headerShown: true,
      headerBackVisible: true,
      companyFilterMode: 'icon',
      title: 'Comissões',
    },
  },
  {
    name: 'RoyaltiesPayablePage',
    component: RoyaltiesPayablePage,
    path: 'royalties-a-pagar',
    options: {
      showCompanyFilter: true,
      showBottomToolBar: true,
      headerShown: true,
      headerBackVisible: true,
      companyFilterMode: 'icon',
      title: 'Royalties a pagar',
    },
  },
  {
    name: 'RoyaltiesReceivablePage',
    component: RoyaltiesReceivablePage,
    path: 'royalties-a-receber',
    options: {
      showCompanyFilter: true,
      showBottomToolBar: true,
      headerShown: true,
      headerBackVisible: true,
      companyFilterMode: 'icon',
      title: 'Royalties a receber',
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
    name: 'GeneralSettings',
    component: GeneralSettings,
    options: {
      showCompanyFilter: true,
      showBottomToolBar: true,
      headerShown: true,
      headerBackVisible: true,
      companyFilterMode: 'icon',
      title: 'Configurador geral',
    },
  },
  {
    name: 'CrmIndex',
    component: CrmIndex,
    options: {
      showCompanyFilter: true,
      showBottomToolBar: true,
      headerShown: true,
      headerBackVisible: true,
      companyFilterMode: 'icon',
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
      companyFilterMode: 'icon',
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
      title: 'Conversas',
    },
  },
];

export default crmRoutes;
