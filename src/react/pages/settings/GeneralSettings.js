import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import css from '@controleonline/ui-orders/src/react/css/orders';
import StateStore from '@controleonline/ui-common/src/react/components/StateStore';

import {
  useGeneralSettingsPalette,
  useGeneralSettingsStyles,
} from './GeneralSettings.styles';
import {
  useGeneralSettingsConfig,
} from './GeneralSettings.shared';
import {
  readGeneralSettingsActiveTab,
  resolveGeneralSettingsActiveTab,
  writeGeneralSettingsActiveTab,
} from './generalSettingsActiveTab';
import DeviceRuntimeFooterSection from './sections/DeviceRuntimeFooterSection';
import OrderPrintSection from './sections/OrderPrintSection';
import DisplayPreparationSection from './sections/DisplayPreparationSection';
import MenuCatalogSection from './sections/MenuCatalogSection';
import OrderPaymentSection from './sections/OrderPaymentSection';
import OperationsSection from './sections/OperationsSection';
import CrmSection from './sections/CrmSection';
import MapsSection from './sections/MapsSection';
import ShopSection from './sections/ShopSection';
import IntegrationsSection from './sections/IntegrationsSection';
import LogSection from './sections/LogSection';
import MaintenanceSection from './sections/MaintenanceSection';

const MAIN_COMPANY_ONLY_TABS = new Set(['shop']);
const TECHNICAL_TABS = new Set(['integrations', 'logs', 'maintenance']);

const SETTINGS_TABS = [
  {
    key: 'devices',
    label: 'Devices',
    icon: 'dvr',
    colorToken: 'info',
    stores: ['configs', 'people'],
    Component: DeviceRuntimeFooterSection,
  },
  {
    key: 'integrations',
    label: 'Integrações',
    icon: 'link',
    colorToken: 'primary',
    stores: ['configs', 'people'],
    Component: IntegrationsSection,
  },
  {
    key: 'logs',
    label: 'Logs',
    icon: 'bug-report',
    colorToken: 'error',
    stores: ['configs', 'people'],
    Component: LogSection,
  },
  {
    key: 'maintenance',
    label: 'Rotinas',
    icon: 'schedule',
    colorToken: 'success',
    stores: ['configs', 'people'],
    Component: MaintenanceSection,
  },
  {
    key: 'print',
    label: 'Conferência',
    icon: 'print',
    colorToken: 'info',
    stores: ['configs', 'printer', 'device_config'],
    Component: OrderPrintSection,
  },
  {
    key: 'preparation',
    label: 'Preparo',
    icon: 'receipt-long',
    colorToken: 'warning',
    stores: ['device_config'],
    Component: DisplayPreparationSection,
  },
  {
    key: 'menu',
    label: 'Cardapio PDF',
    icon: 'restaurant-menu',
    colorToken: 'warning',
    stores: ['configs', 'categories', 'product_group', 'models'],
    Component: MenuCatalogSection,
  },
  {
    key: 'payment',
    label: 'Pagamento',
    icon: 'credit-card',
    colorToken: 'primary',
    stores: ['configs', 'device_config'],
    Component: OrderPaymentSection,
  },
  {
    key: 'operations',
    label: 'Operações',
    icon: 'point-of-sale',
    colorToken: 'success',
    stores: ['configs', 'status', 'wallet'],
    Component: OperationsSection,
  },
  {
    key: 'crm',
    label: 'CRM',
    icon: 'groups',
    colorToken: 'primary',
    stores: ['configs'],
    Component: CrmSection,
  },
  {
    key: 'maps',
    label: 'Mapas',
    icon: 'map',
    colorToken: 'info',
    stores: ['configs'],
    Component: MapsSection,
  },
  {
    key: 'shop',
    label: 'Shop',
    icon: 'shopping-bag',
    colorToken: 'success',
    stores: ['configs', 'products'],
    Component: ShopSection,
  },
];

const GeneralSettings = () => {
  const {styles} = css();
  const localStyles = useGeneralSettingsStyles();
  const {
    companies,
    currentCompany,
    defaultCompany,
    hasDefaultCompanyAccess,
    isMainCompanySelected,
    peopleActions,
  } =
    useGeneralSettingsConfig();
  const themePalette = useGeneralSettingsPalette();
  const [activeTab, setActiveTab] = useState(
    () => readGeneralSettingsActiveTab() || SETTINGS_TABS[0].key,
  );
  /*
   * @agents Wait for the company context before correcting the tab selection.
   * Without this guard the screen can briefly snap back to the first tab during bootstrap.
   */
  const [isCompanyContextReady, setIsCompanyContextReady] = useState(false);

  const availableTabs = useMemo(
    () =>
      SETTINGS_TABS.filter(
        tab =>
          (!MAIN_COMPANY_ONLY_TABS.has(tab.key) || isMainCompanySelected) &&
          (!TECHNICAL_TABS.has(tab.key) || hasDefaultCompanyAccess),
      ),
    [hasDefaultCompanyAccess, isMainCompanySelected],
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const requests = [];

      setIsCompanyContextReady(false);

      if (!Array.isArray(companies) || companies.length === 0) {
        const companiesRequest = peopleActions.myCompanies?.();
        if (companiesRequest?.then) {
          requests.push(companiesRequest.catch(() => {}));
        }
      }

      if (!defaultCompany?.id) {
        const defaultCompanyRequest = peopleActions.defaultCompany?.();
        if (defaultCompanyRequest?.then) {
          requests.push(defaultCompanyRequest.catch(() => {}));
        }
      }

      Promise.allSettled(requests).finally(() => {
        if (!cancelled) {
          setIsCompanyContextReady(true);
        }
      });

      if (requests.length === 0) {
        setIsCompanyContextReady(true);
      }

      return () => {
        cancelled = true;
      };
    }, [companies, defaultCompany?.id, peopleActions]),
  );

  /*
   * @agents Validate the current tab after mount, then only correct the selection when
   * the active tab stops being available because of company or permission changes.
   */
  useEffect(() => {
    if (!isCompanyContextReady) {
      return;
    }

    const nextActiveTab = resolveGeneralSettingsActiveTab({
      activeTab,
      availableTabs,
      fallbackTab: SETTINGS_TABS[0].key,
    });

    if (nextActiveTab !== activeTab) {
      setActiveTab(nextActiveTab);
    }
  }, [activeTab, availableTabs, isCompanyContextReady]);

  /*
   * @agents Persist the current tab for the next visit, but never use storage to
   * override a valid in-session click.
   */
  useEffect(() => {
    writeGeneralSettingsActiveTab(activeTab);
  }, [activeTab]);

  const activeTabConfig = useMemo(
    () =>
      availableTabs.find(tab => tab.key === activeTab) ||
      SETTINGS_TABS.find(tab => tab.key === activeTab) ||
      availableTabs[0] ||
      SETTINGS_TABS[0],
    [activeTab, availableTabs],
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
            {availableTabs.map(tab => {
              const active = tab.key === activeTab;

              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    localStyles.tabItem,
                    active && localStyles.tabItemActive,
                    active && {borderBottomColor: themePalette[tab.colorToken]},
                  ]}
                  activeOpacity={0.85}
                  onPress={() => setActiveTab(tab.key)}>
                  <Icon
                    name={tab.icon}
                    size={18}
                    color={
                      active
                        ? themePalette[tab.colorToken]
                        : themePalette.textSecondary
                    }
                  />
                  <Text
                    style={[
                      localStyles.tabLabel,
                      active && localStyles.tabLabelActive,
                      active && {color: themePalette[tab.colorToken]},
                    ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={localStyles.tabHelper}>
            Cada aba carrega apenas os dados da própria sessão para reduzir a
            latência inicial e deixar a tela mais organizada.
          </Text>

          <ActiveTabComponent />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default GeneralSettings;
