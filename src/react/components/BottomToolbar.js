import { useStore } from '@store';
import React, { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigationState } from '@react-navigation/native';

import { colors } from '@controleonline/../../src/styles/colors';
import { resolveThemePalette } from '@controleonline/../../src/styles/branding';
import BottomNavigationBar from '@controleonline/ui-common/src/react/components/BottomNavigationBar';

const TAB_ITEMS = [
  { key: 'HomePage', icon: 'home', labelKey: 'home' },
  { key: 'CrmIndex', icon: 'target', labelKey: 'crm' },
  { key: 'ClientsIndex', icon: 'users', labelKey: 'clients' },
  { key: 'ProfilePage', icon: 'user', labelKey: 'profile' },
];

const BottomToolbar = ({ navigation, currentRouteName }) => {
  const navigationState = useNavigationState(state => state);
  const routeNameFromState =
    navigationState?.routes?.[navigationState.index]?.name;
  const effectiveRouteName = currentRouteName || routeNameFromState || 'HomePage';

  const routeToTab = {
    HomePage: 'HomePage',
    CrmIndex: 'CrmIndex',
    ContractsIndex: 'CrmIndex',
    ProposalsIndex: 'CrmIndex',
    ComissionsPage: 'CrmIndex',
    CrmConversation: 'CrmIndex',
    ContractDetails: 'CrmIndex',
    ClientsIndex: 'ClientsIndex',
    ClientDetails: 'ClientsIndex',
    FranchiseesIndex: 'ClientsIndex',
    ProfilePage: 'ProfilePage',
    SettingsPage: 'ProfilePage',
  };

  const activeTab = routeToTab[effectiveRouteName] || 'HomePage';

  const peopleStore = useStore('people');
  const themeStore = useStore('theme');
  const { currentCompany } = peopleStore.getters;
  const { colors: themeColors } = themeStore.getters;
  const insets = useSafeAreaInsets();
  const disabled = !currentCompany || Object.entries(currentCompany).length === 0;

  const brandColors = useMemo(
    () =>
      resolveThemePalette(
        {
          ...themeColors,
          ...(currentCompany?.theme?.colors || {}),
        },
        colors,
      ),
    [themeColors, currentCompany?.id],
  );
  const items = useMemo(
    () =>
      TAB_ITEMS.map(item => ({
        route: item.key,
        icon: item.icon,
        label: global.t?.t('users', 'label', item.labelKey),
      })),
    [],
  );

  return (
    <BottomNavigationBar
      activeRouteName={activeTab}
      colors={brandColors}
      disabled={disabled}
      insets={insets}
      items={items}
      navigation={navigation}
    />
  );
};



export default BottomToolbar;
