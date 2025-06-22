import HomePage from '@controleonline/ui-crm/src/react/pages/home/index';
import CrmLayout from '@controleonline/ui-layout/src/react/layouts/CrmLayout';

const WrappedHomePage = ({navigation}) => (
  <CrmLayout navigation={navigation}>
    <HomePage navigation={navigation} />
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
];

export default shopRoutes;
