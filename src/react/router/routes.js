import HomePage from '@controleonline/ui-crm/src/react/pages/home/index';
import CrmLayout from '@controleonline/ui-layout/src/react/layouts/CrmLayout';
import Comissions from '@controleonline/ui-crm/src/react/pages/comissions';
import CrmIndex from '@controleonline/ui-crm/src/react/pages/crm/index';
import ContractsPage from '@controleonline/ui-contracts/src/react/pages/ContractsPage';
import ProposalsPage from '../pages/proposals';
import FinancePage from '@controleonline/ui-financial/src/react/pages/reports/IncomeStatement';
import CrmConversation from '../pages/crm/conversation';

const WrappedHomePage = ({navigation}) => (
  <CrmLayout navigation={navigation}>
    <HomePage navigation={navigation} />
  </CrmLayout>
);

const WrappedComissionsPage = ({navigation}) => (
  <CrmLayout navigation={navigation}>
    <FinancePage />
  </CrmLayout>
);

const WrappedCrmIndex = ({navigation}) => (
  <CrmLayout navigation={navigation}>
    <CrmIndex navigation={navigation} />
  </CrmLayout>
);

const WrappedContract = ({navigation, route}) => (
  <CrmLayout navigation={navigation}>
    <ContractsPage navigation={navigation} route={route} />
  </CrmLayout>
);

const WrappedProposal = ({navigation, route}) => (
  <CrmLayout navigation={navigation}>
    <ProposalsPage navigation={navigation} route={route} />
  </CrmLayout>
);
const crmRoutes = [
  {
    name: 'HomePage',
    component: WrappedHomePage,
    options: {
      headerShown: false,
      title: 'Menu',
    },
  },
  {
    name: 'ComissionsPage',
    component: WrappedComissionsPage,
    options: {
      headerShown: true,
      title: 'Comissões',
    },
  },
  {
    name: 'CrmIndex',
    component: WrappedCrmIndex,
    options: {
      headerShown: true,
      title: 'Oportunidades',
    },
  },

  {
    name: 'ContractsIndex',
    component: WrappedContract,
    options: {
      headerShown: true,
      title: 'Contratos',
    },
  },
  {
    name: 'ProposalsIndex',
    component: WrappedProposal,
    options: {
      headerShown: true,
      title: 'Propostas',
    },
  },
  {
    name: 'CrmConversation',
    component: CrmConversation,
    options: {
      headerShown: false,
      title: 'Propostas',
    },
  },
];

export default crmRoutes;
