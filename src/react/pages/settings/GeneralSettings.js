import React, {useCallback, useMemo, useState} from 'react';
import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import css from '@controleonline/ui-orders/src/react/css/orders';
import StateStore from '@controleonline/ui-layout/src/react/components/StateStore';

import localStyles from './GeneralSettings.styles';
import {useGeneralSettingsConfig} from './GeneralSettings.shared';
import DeviceRuntimeFooterSection from './sections/DeviceRuntimeFooterSection';
import OrderPrintSection from './sections/OrderPrintSection';
import DisplayPreparationSection from './sections/DisplayPreparationSection';
import MenuCatalogSection from './sections/MenuCatalogSection';
import OrderPaymentSection from './sections/OrderPaymentSection';
import OperationsSection from './sections/OperationsSection';
import CrmSection from './sections/CrmSection';
import ShopSection from './sections/ShopSection';

const SETTINGS_TABS = [
  {
    key: 'devices',
    label: 'Devices',
    icon: 'dvr',
    color: '#0369A1',
    stores: ['configs', 'people'],
    Component: DeviceRuntimeFooterSection,
  },
  {
    key: 'print',
    label: 'Conferencia',
    icon: 'print',
    color: '#2563EB',
    stores: ['configs', 'printer', 'device_config'],
    Component: OrderPrintSection,
  },
  {
    key: 'preparation',
    label: 'Preparo',
    icon: 'receipt-long',
    color: '#B45309',
    stores: ['device_config'],
    Component: DisplayPreparationSection,
  },
  {
    key: 'menu',
    label: 'Cardapio PDF',
    icon: 'restaurant-menu',
    color: '#B45309',
    stores: ['configs', 'categories', 'product_group', 'models'],
    Component: MenuCatalogSection,
  },
  {
    key: 'payment',
    label: 'Pagamento',
    icon: 'credit-card',
    color: '#7C3AED',
    stores: ['configs', 'device_config'],
    Component: OrderPaymentSection,
  },
  {
    key: 'operations',
    label: 'Operacao',
    icon: 'point-of-sale',
    color: '#166534',
    stores: ['configs', 'status', 'wallet'],
    Component: OperationsSection,
  },
  {
    key: 'crm',
    label: 'CRM',
    icon: 'groups',
    color: '#7C3AED',
    stores: ['configs'],
    Component: CrmSection,
  },
  {
    key: 'shop',
    label: 'Shop',
    icon: 'shopping-bag',
    color: '#0F766E',
    stores: ['configs', 'products'],
    Component: ShopSection,
  },
];

const GeneralSettings = () => {
  const {styles} = css();
  const {currentCompany, peopleActions} = useGeneralSettingsConfig();
  const [activeTab, setActiveTab] = useState(SETTINGS_TABS[0].key);

  useFocusEffect(
    useCallback(() => {
      peopleActions.defaultCompany().catch(() => {});
    }, [peopleActions]),
  );

  const activeTabConfig = useMemo(
    () =>
      SETTINGS_TABS.find(tab => tab.key === activeTab) || SETTINGS_TABS[0],
    [activeTab],
  );
  const ActiveTabComponent = activeTabConfig.Component;
  const activeStores = useMemo(
    () => Array.from(new Set(activeTabConfig?.stores || ['configs'])),
    [activeTabConfig],
  );

  return (
    <SafeAreaView style={styles.Settings.container}>
      <StateStore stores={activeStores} />
      <ScrollView contentContainerStyle={styles.Settings.scrollContent}>
        <View style={styles.Settings.mainContainer}>
          <Text style={localStyles.pageTitle}>Configurador geral</Text>
          <Text style={localStyles.pageSubtitle}>
            {currentCompany?.name || currentCompany?.alias || 'Empresa ativa'}
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={localStyles.tabBar}
            contentContainerStyle={localStyles.tabBarContent}>
            {SETTINGS_TABS.map(tab => {
              const active = tab.key === activeTab;

              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    localStyles.tabItem,
                    active && localStyles.tabItemActive,
                    active && {borderBottomColor: tab.color},
                  ]}
                  activeOpacity={0.85}
                  onPress={() => setActiveTab(tab.key)}>
                  <Icon
                    name={tab.icon}
                    size={18}
                    color={active ? tab.color : '#94A3B8'}
                  />
                  <Text
                    style={[
                      localStyles.tabLabel,
                      active && localStyles.tabLabelActive,
                      active && {color: tab.color},
                    ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={localStyles.tabHelper}>
            Cada aba carrega apenas os dados da propria sessao para reduzir a
            latencia inicial e deixar a tela mais organizada.
          </Text>

          <ActiveTabComponent />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default GeneralSettings;
