import HomePage from '@controleonline/ui-crm/src/react/pages/home/index';
import CrmLayout from '@controleonline/ui-layout/src/react/layouts/CrmLayout';
import Comissions from '@controleonline/ui-crm/src/react/pages/comissions';

const WrappedHomePage = ({navigation}) => (
  <CrmLayout navigation={navigation}>
    <HomePage navigation={navigation} />
  </CrmLayout>
);

const WrappedComissionsPage = ({navigation}) => (
  <CrmLayout navigation={navigation}>
    <Comissions navigation={navigation} />
  </CrmLayout>
);

const shopRoutes = [
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
    component:  WrappedComissionsPage,
    options: {
      headerShown: true,
      title: 'Comissões',
    },
  },
];

export default shopRoutes;
