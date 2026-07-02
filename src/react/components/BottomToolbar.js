import { useStore } from '@store';
import React, { useMemo } from 'react';
import { useNavigationState } from '@react-navigation/native';

import { colors } from '@controleonline/../../src/styles/colors';
import { resolveThemePalette } from '@controleonline/../../src/styles/branding';
import BottomNavigationBar from '@controleonline/ui-common/src/react/components/BottomNavigationBar';
import {
  getBottomNavigationPreset,
  resolveBottomNavigationItems,
  resolveBottomNavigationRoute,
} from '@controleonline/ui-common/src/react/components/BottomNavigationBar.config';

const BottomToolbar = ({ navigation, currentRouteName }) => {
  const navigationState = useNavigationState(state => state);
  const routeNameFromState =
    navigationState?.routes?.[navigationState.index]?.name;
  const effectiveRouteName = currentRouteName || routeNameFromState || 'HomePage';

  const peopleStore = useStore('people');
  const themeStore = useStore('theme');
  const { currentCompany } = peopleStore.getters;
  const { colors: themeColors } = themeStore.getters;
  const disabled = !currentCompany || Object.entries(currentCompany).length === 0;
  const preset = getBottomNavigationPreset('crmToolbar');

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
    () => resolveBottomNavigationItems(preset.items, global.t?.t),
    [preset.items],
  );
  const activeRoute = resolveBottomNavigationRoute(
    preset.routeAliases,
    effectiveRouteName,
  );

  return (
    <BottomNavigationBar
      activeRouteName={activeRoute}
      colors={brandColors}
      disabled={disabled}
      items={items}
      navigation={navigation}
    />
  );
};



export default BottomToolbar;
