import Comissions from '@controleonline/ui-crm/src/react/pages/comissions';
import SellerCommissionsPage from '@controleonline/ui-crm/src/react/pages/comissions/SellerCommissionsPage';
import RoyaltiesPayablePage from '@controleonline/ui-crm/src/react/pages/royalties/RoyaltiesPayablePage';
import RoyaltiesReceivablePage from '@controleonline/ui-crm/src/react/pages/royalties/ReceivablePage';
import CrmIndex from '@controleonline/ui-crm/src/react/pages/crm/index';
import ProposalsPage from '../pages/proposals';
import CrmConversation from '../pages/crm/conversation';
import GeneralSettings from '../pages/settings/GeneralSettings';
import McpPage from '../pages/mcp/McpPage';
import ProposalDetails from '../pages/proposals/ProposalDetails';
import {CrmFunnelPage, SupportFunnelPage} from '../pages/tickets/TicketFunnelPage';
import TicketConversationPage from '../pages/tickets/TicketConversationPage';

const crmRoutes = [
  {
    // Company-wide Income Statements (demonstrativo por categorias).
    // Route name kept for existing menu/config entries; title reflects the view.
    // Role-specific commission/royalties screens are separate (ui-crm#21 filhas).
    name: 'ComissionsPage',
    component: Comissions,
    options: {
      showCompanyFilter: true,
      showBottomToolBar: true,
      headerShown: true,
      headerBackVisible: true,
      companyFilterMode: 'icon',
      title: 'Demonstrativo',
    },
  },
  {
    name: 'IncomeStatementsPage',
    component: Comissions,
    options: {
      showCompanyFilter: true,
      showBottomToolBar: true,
      headerShown: true,
      headerBackVisible: true,
      companyFilterMode: 'icon',
      title: 'Demonstrativo',
    },
  },
  {
    name: 'SellerCommissionsPage',
    component: SellerCommissionsPage,
    options: {
      showCompanyFilter: true,
      showBottomToolBar: true,
      headerShown: true,
      headerBackVisible: true,
      companyFilterMode: 'icon',
      title: 'Minhas comissões',
    },
  },
  {
    name: 'RoyaltiesPayablePage',
    component: RoyaltiesPayablePage,
    path: 'royalties-payable',
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
    path: 'royalties-receivable',
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
    name: 'McpPage',
    component: McpPage,
    path: 'support',
    options: {
      showCompanyFilter: true,
      showBottomToolBar: true,
      headerShown: true,
      headerBackVisible: true,
      companyFilterMode: 'icon',
      title: 'Solicitações',
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
  {
    // Kanban of CRM opportunities (+ AI triage column).
    name: 'CrmFunnel',
    component: CrmFunnelPage,
    path: 'crm/funnel',
    options: {
      showCompanyFilter: true,
      showBottomToolBar: true,
      headerShown: true,
      headerBackVisible: true,
      companyFilterMode: 'icon',
      title: 'Funil comercial',
    },
  },
  {
    // Support tickets funnel (clone of the CRM funnel for type=support).
    name: 'SupportFunnel',
    component: SupportFunnelPage,
    path: 'ai',
    options: {
      showCompanyFilter: true,
      showBottomToolBar: true,
      headerShown: true,
      headerBackVisible: true,
      companyFilterMode: 'icon',
      title: 'Atendimento de suporte',
    },
  },
  {
    // One customer ticket (ia/relationship/support): conversation, notes, AI.
    name: 'TicketConversation',
    component: TicketConversationPage,
    path: 'ticket/:taskId',
    options: {
      showCompanyFilter: true,
      showBottomToolBar: true,
      headerShown: true,
      headerBackVisible: true,
      companyFilterMode: 'icon',
      title: 'Atendimento',
    },
  },
];

export default crmRoutes;
