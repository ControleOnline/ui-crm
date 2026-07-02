import React from 'react';
import RuntimeBottomNavigationBar from '@controleonline/ui-common/src/react/components/RuntimeBottomNavigationBar';

const BottomToolbar = ({navigation, currentRouteName}) => (
  <RuntimeBottomNavigationBar
    activeRouteName={currentRouteName}
    navigation={navigation}
    menuType="toolbar"
    presetKey="crmToolbar"
  />
);

export default BottomToolbar;
