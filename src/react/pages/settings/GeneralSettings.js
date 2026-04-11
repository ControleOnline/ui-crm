import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Picker} from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';

import css from '@controleonline/ui-orders/src/react/css/orders';
import Formatter from '@controleonline/ui-common/src/utils/formatter';
import StateStore from '@controleonline/ui-layout/src/react/components/StateStore';
import {
  filterDeviceConfigsByCompany,
  getCompanyPaymentDeviceOptions,
  ORDER_PAYMENT_DEVICES_CONFIG_KEY,
  normalizeDeviceIds,
} from '@controleonline/ui-common/src/react/utils/paymentDevices';
import {
  getPrinterLabel,
  getPrinterOptions,
} from '@controleonline/ui-common/src/react/utils/printerDevices';
import {
  DEVICE_RUNTIME_FOOTER_TEXT_CONFIG_KEY,
  normalizeRuntimeFooterText,
} from '@controleonline/ui-common/src/react/utils/runtimeFooter';
import {useStore} from '@store';

const ORDER_PRINT_DEVICES_CONFIG_KEY = 'order-print-devices';
const ORDER_PRINT_FOOTER_TEXT_CONFIG_KEY = 'order-print-footer-text';
const DISPLAY_DEVICE_TYPE = 'DISPLAY';
const DISPLAY_DEVICE_LINK_CONFIG_KEY = 'display-id';
const DISPLAY_DEVICE_PRINTER_CONFIG_KEY = 'printer';
const MENU_CATALOG_HIDDEN_CATEGORY_IDS_CONFIG_KEY =
  'menu-catalog-hidden-category-ids';
const MENU_CATALOG_HIDDEN_GROUP_IDS_CONFIG_KEY =
  'menu-catalog-hidden-group-ids';

const DEFAULT_AFTER_SALES_PROFILES = [
  {maxRevenue: 10000, days: 30},
  {maxRevenue: 1000, days: 60},
  {maxRevenue: 0, days: 120},
];

const parseJsonValue = (value, fallback) => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (e) {
      return fallback;
    }
  }

  return value;
};

const normalizeProfiles = value => {
  const parsed = parseJsonValue(value, DEFAULT_AFTER_SALES_PROFILES);
  return Array.isArray(parsed) && parsed.length > 0
    ? parsed
    : DEFAULT_AFTER_SALES_PROFILES;
};

const normalizePrinterDeviceIds = value => {
  return normalizeDeviceIds(value);
};

const normalizeIdList = value => {
  const parsed = parseJsonValue(value, []);
  const source = Array.isArray(parsed)
    ? parsed
    : String(value || '').split(/\r?\n|,/);

  return Array.from(
    new Set(
      source
        .map(item => String(item || '').replace(/\D+/g, '').trim())
        .filter(Boolean),
    ),
  );
};

const normalizeNotificationTargets = value => {
  const parsed = parseJsonValue(value, []);
  if (Array.isArray(parsed)) {
    return parsed
      .map(item => String(item || '').trim())
      .filter(Boolean);
  }

  return String(value || '')
    .split(/\r?\n|,/)
    .map(item => item.trim())
    .filter(Boolean);
};

const normalizeEntityId = value =>
  String(value || '')
    .replace(/\D+/g, '')
    .trim();

const normalizeTextConfigValue = value => {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    if (value.trim() === '') {
      return '';
    }

    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'string') {
        return parsed;
      }
    } catch (e) {
      return value;
    }

    return value;
  }

  return String(value);
};

const parseDeviceConfigs = value => {
  const parsed = parseJsonValue(value, {});
  return parsed && typeof parsed === 'object' ? parsed : {};
};

const getMenuGroupOptionLabel = group => {
  const groupName = String(group?.productGroup || '').trim();
  const parentValue = group?.parentProduct;

  if (parentValue && typeof parentValue === 'object') {
    const parentName = String(parentValue?.product || '').trim();
    if (parentName) {
      return `${groupName} • ${parentName}`;
    }
  }

  if (typeof parentValue === 'string') {
    const parentId = parentValue.replace(/\D+/g, '');
    if (groupName && parentId) {
      return `${groupName} • Produto #${parentId}`;
    }
  }

  if (groupName) {
    return `${groupName} • #${group?.id || ''}`.trim();
  }

  return `Grupo #${group?.id || ''}`;
};

const toConfigRequestValue = value => {
  if (value === undefined) {
    return JSON.stringify('');
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (trimmed === '') {
      return JSON.stringify('');
    }

    try {
      JSON.parse(trimmed);
      return value;
    } catch (e) {
      return JSON.stringify(value);
    }
  }

  return JSON.stringify(value);
};

const toConfigCacheValue = value => {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
};

const GeneralSettings = () => {
  const {styles, globalStyles} = css();

  const peopleStore = useStore('people');
  const {currentCompany, defaultCompany} = peopleStore.getters;
  const peopleActions = peopleStore.actions;

  const configsStore = useStore('configs');
  const configsGetters = configsStore.getters;
  const {items: companyConfigs, isSaving} = configsGetters;
  const configActions = configsStore.actions;

  const printerStore = useStore('printer');
  const {
    items: printers = [],
    isLoading: isLoadingPrinters,
  } = printerStore.getters;
  const printerActions = printerStore.actions;

  const deviceConfigStore = useStore('device_config');
  const {
    items: companyDeviceConfigs = [],
    isLoading: isLoadingDeviceConfigs,
  } = deviceConfigStore.getters;
  const deviceConfigActions = deviceConfigStore.actions;

  const statusStore = useStore('status');
  const {
    items: statuses = [],
    isLoading: isLoadingStatuses,
  } = statusStore.getters;
  const statusActions = statusStore.actions;

  const categoriesStore = useStore('categories');
  const {
    items: menuCategories = [],
    isLoading: isLoadingMenuCategories,
  } = categoriesStore.getters;
  const categoryActions = categoriesStore.actions;

  const productGroupStore = useStore('product_group');
  const {
    items: menuGroups = [],
    isLoading: isLoadingMenuGroups,
  } = productGroupStore.getters;
  const productGroupActions = productGroupStore.actions;

  const walletStore = useStore('wallet');
  const {
    items: wallets = [],
    isLoading: isLoadingWallets,
  } = walletStore.getters;
  const walletActions = walletStore.actions;

  const effectiveCompanyConfigs = useMemo(() => {
    if (companyConfigs && typeof companyConfigs === 'object') {
      return companyConfigs;
    }

    if (currentCompany?.configs && typeof currentCompany.configs === 'object') {
      return currentCompany.configs;
    }

    return {};
  }, [companyConfigs, currentCompany?.configs]);

  const [strategy, setStrategy] = useState('random');
  const [maxTasks, setMaxTasks] = useState('10');
  const [revenuePeriod, setRevenuePeriod] = useState('90');
  const [profiles, setProfiles] = useState(DEFAULT_AFTER_SALES_PROFILES);
  const [editingRevenueIndex, setEditingRevenueIndex] = useState(null);
  const [editingRevenueValue, setEditingRevenueValue] = useState('');

  const [orderPrintEnabled, setOrderPrintEnabled] = useState(false);
  const [orderPrintDevices, setOrderPrintDevices] = useState([]);
  const [orderPrintFooterText, setOrderPrintFooterText] = useState('');
  const [deviceRuntimeFooterText, setDeviceRuntimeFooterText] = useState('');
  const [orderPaymentEnabled, setOrderPaymentEnabled] = useState(false);
  const [orderPaymentDevices, setOrderPaymentDevices] = useState([]);
  const [posDefaultStatus, setPosDefaultStatus] = useState('');
  const [posPaidStatus, setPosPaidStatus] = useState('');
  const [posCashWallet, setPosCashWallet] = useState('');
  const [posWithdrawWallet, setPosWithdrawWallet] = useState('');
  const [posCieloWallet, setPosCieloWallet] = useState('');
  const [posInfinitePayWallet, setPosInfinitePayWallet] = useState('');
  const [cashRegisterNotifications, setCashRegisterNotifications] = useState('');
  const [menuHiddenCategoryIds, setMenuHiddenCategoryIds] = useState([]);
  const [menuHiddenGroupIds, setMenuHiddenGroupIds] = useState([]);

  const pickerMode = 'dropdown';

  const isMainCompanySelected = useMemo(() => {
    const currentCompanyId = normalizeEntityId(
      currentCompany?.id || currentCompany?.['@id'],
    );
    const defaultCompanyId = normalizeEntityId(
      defaultCompany?.id || defaultCompany?.['@id'],
    );

    return (
      currentCompanyId !== '' &&
      defaultCompanyId !== '' &&
      currentCompanyId === defaultCompanyId
    );
  }, [currentCompany, defaultCompany]);

  const scopedCompanyDeviceConfigs = useMemo(
    () =>
      filterDeviceConfigsByCompany(companyDeviceConfigs, currentCompany?.id),
    [companyDeviceConfigs, currentCompany?.id],
  );

  const paymentDevices = useMemo(
    () => getCompanyPaymentDeviceOptions(scopedCompanyDeviceConfigs),
    [scopedCompanyDeviceConfigs],
  );
  const printerOptions = useMemo(
    () =>
      getPrinterOptions({
        printers,
        deviceConfigs: scopedCompanyDeviceConfigs,
        companyId: currentCompany?.id,
      }),
    [currentCompany?.id, printers, scopedCompanyDeviceConfigs],
  );
  const displayPreparationDevices = useMemo(
    () =>
      scopedCompanyDeviceConfigs.filter(deviceConfig => {
        const deviceType = String(deviceConfig?.device?.type || '')
          .trim()
          .toUpperCase();
        if (deviceType !== DISPLAY_DEVICE_TYPE) {
          return false;
        }

        const configs = parseDeviceConfigs(deviceConfig?.configs);
        const linkedDisplayId = String(
          configs?.[DISPLAY_DEVICE_LINK_CONFIG_KEY] || '',
        )
          .replace(/\D+/g, '')
          .trim();
        const printerId = String(
          configs?.[DISPLAY_DEVICE_PRINTER_CONFIG_KEY] || '',
        ).trim();

        return linkedDisplayId !== '' && printerId !== '';
      }),
    [scopedCompanyDeviceConfigs],
  );

  useEffect(() => {
    if (!currentCompany?.id) {
      return;
    }

    printerActions.getPrinters({people: currentCompany.id}).catch(() => {});
    deviceConfigActions
      .getItems({people: '/people/' + currentCompany.id})
      .catch(() => {});
    statusActions.getItems({itemsPerPage: 200}).catch(() => {});
    walletActions.getItems({people: currentCompany.id, itemsPerPage: 200}).catch(() => {});
    categoryActions
      .getItems({
        context: 'products',
        company: currentCompany.id,
        itemsPerPage: 200,
        'order[name]': 'ASC',
      })
      .catch(() => {});
    productGroupActions
      .getItems({
        'parentProduct.company': '/people/' + currentCompany.id,
        itemsPerPage: 400,
        'order[groupOrder]': 'ASC',
        'order[productGroup]': 'ASC',
      })
      .catch(() => {});
  }, [
    categoryActions,
    currentCompany?.id,
    deviceConfigActions,
    printerActions,
    productGroupActions,
    statusActions,
    walletActions,
  ]);

  useEffect(() => {
    setStrategy(
      String(
        effectiveCompanyConfigs['salesman-distribution-strategy'] || 'random',
      ),
    );
    setMaxTasks(
      String(effectiveCompanyConfigs['salesman-max-tasks'] || '10'),
    );
    setRevenuePeriod(
      String(effectiveCompanyConfigs['after-sales-revenue-period'] || '90'),
    );
    setProfiles(
      normalizeProfiles(effectiveCompanyConfigs['after-sales-profiles']),
    );

    const nextOrderPrintDevices = normalizePrinterDeviceIds(
      effectiveCompanyConfigs[ORDER_PRINT_DEVICES_CONFIG_KEY],
    );
    setOrderPrintDevices(nextOrderPrintDevices);
    setOrderPrintEnabled(nextOrderPrintDevices.length > 0);
    setOrderPrintFooterText(
      normalizeTextConfigValue(
        effectiveCompanyConfigs[ORDER_PRINT_FOOTER_TEXT_CONFIG_KEY],
      ),
    );

    const nextOrderPaymentDevices = normalizeDeviceIds(
      effectiveCompanyConfigs[ORDER_PAYMENT_DEVICES_CONFIG_KEY],
    );
    setOrderPaymentDevices(nextOrderPaymentDevices);
    setOrderPaymentEnabled(nextOrderPaymentDevices.length > 0);
    setPosDefaultStatus(
      String(effectiveCompanyConfigs['pos-default-status'] || ''),
    );
    setPosPaidStatus(
      String(effectiveCompanyConfigs['pos-paid-status'] || ''),
    );
    setPosCashWallet(
      String(effectiveCompanyConfigs['pos-cash-wallet'] || ''),
    );
    setPosWithdrawWallet(
      String(
        effectiveCompanyConfigs['pos-withdrawl-wallet'] ||
          effectiveCompanyConfigs['pos-withdrawal-wallet'] ||
          '',
      ),
    );
    setPosCieloWallet(
      String(effectiveCompanyConfigs['pos-cielo-wallet'] || ''),
    );
    setPosInfinitePayWallet(
      String(effectiveCompanyConfigs['pos-infinite-pay-wallet'] || ''),
    );
    setCashRegisterNotifications(
      normalizeNotificationTargets(
        effectiveCompanyConfigs['cash-register-notifications'],
      ).join('\n'),
    );
    setMenuHiddenCategoryIds(
      normalizeIdList(
        effectiveCompanyConfigs[MENU_CATALOG_HIDDEN_CATEGORY_IDS_CONFIG_KEY],
      ),
    );
    setMenuHiddenGroupIds(
      normalizeIdList(
        effectiveCompanyConfigs[MENU_CATALOG_HIDDEN_GROUP_IDS_CONFIG_KEY],
      ),
    );
  }, [effectiveCompanyConfigs]);

  useEffect(() => {
    setDeviceRuntimeFooterText(
      normalizeRuntimeFooterText(
        defaultCompany?.configs?.[DEVICE_RUNTIME_FOOTER_TEXT_CONFIG_KEY],
      ),
    );
  }, [defaultCompany?.configs]);

  const syncConfigCache = useCallback(
    entries => {
      const baseConfigs =
        configsGetters.items && typeof configsGetters.items === 'object'
          ? configsGetters.items
          : effectiveCompanyConfigs;

      configActions.setItems({
        ...baseConfigs,
        ...entries,
      });
    },
    [configActions, configsGetters, effectiveCompanyConfigs],
  );

  const saveConfigs = useCallback(
    entries => {
      if (!currentCompany?.id) {
        Alert.alert(
          'Empresa nao selecionada',
          'Selecione uma empresa para salvar as configuracoes.',
        );
        return Promise.resolve(false);
      }

      const normalizedEntries = Object.entries(entries || {}).reduce(
        (accumulator, [key, value]) => {
          accumulator[key] = value;
          return accumulator;
        },
        {},
      );

      const requestEntries = Object.entries(normalizedEntries).reduce(
        (accumulator, [key, value]) => {
          accumulator[key] = toConfigRequestValue(value);
          return accumulator;
        },
        {},
      );

      const cacheEntries = Object.entries(normalizedEntries).reduce(
        (accumulator, [key, value]) => {
          accumulator[key] = toConfigCacheValue(value);
          return accumulator;
        },
        {},
      );

      return new Promise(resolve => {
        configActions.addToQueue(() =>
          configActions
            .addManyConfigs({
              configs: Object.entries(requestEntries).map(
                ([configKey, configValue]) => ({
                  configKey,
                  configValue,
                }),
              ),
              people: '/people/' + currentCompany.id,
              module: 4,
              visibility: 'public',
            })
            .then(data => {
              syncConfigCache(cacheEntries);
              resolve(true);
              return data;
            })
            .catch(err => {
              Alert.alert('Erro', err?.message || JSON.stringify(err));
              resolve(false);
              return null;
            }),
        );
        configActions.initQueue();
      });
    },
    [configActions, currentCompany?.id, syncConfigCache],
  );

  const saveConfig = useCallback(
    (key, value) => {
      if (!currentCompany?.id) {
        Alert.alert(
          'Empresa nao selecionada',
          'Selecione uma empresa para salvar as configuracoes.',
        );
        return Promise.resolve(false);
      }

      const requestValue = toConfigRequestValue(value);
      const cacheValue = toConfigCacheValue(value);

      return new Promise(resolve => {
        configActions.addToQueue(() =>
          configActions
            .addConfigs({
              configKey: key,
              configValue: requestValue,
              people: '/people/' + currentCompany.id,
              module: 4,
              visibility: 'public',
            })
            .then(data => {
              syncConfigCache({[key]: cacheValue});
              resolve(true);
              return data;
            })
            .catch(err => {
              Alert.alert('Erro', err?.message || JSON.stringify(err));
              resolve(false);
              return null;
            }),
        );
        configActions.initQueue();
      });
    },
    [configActions, currentCompany?.id, syncConfigCache],
  );

  const saveDeviceRuntimeFooter = useCallback(() => {
    if (!defaultCompany?.id) {
      Alert.alert(
        'Empresa principal indisponivel',
        'Nao foi possivel identificar a empresa principal para salvar o rodape.',
      );
      return Promise.resolve(false);
    }

    if (!isMainCompanySelected) {
      Alert.alert(
        'Empresa principal',
        'Troque para a empresa principal para editar o rodape dos devices.',
      );
      return Promise.resolve(false);
    }

    const normalizedText = normalizeRuntimeFooterText(deviceRuntimeFooterText);

    return new Promise(resolve => {
      configActions.addToQueue(() =>
        configActions
          .addConfigs({
            configKey: DEVICE_RUNTIME_FOOTER_TEXT_CONFIG_KEY,
            configValue: toConfigRequestValue(normalizedText),
            people: '/people/' + defaultCompany.id,
            module: 4,
            visibility: 'public',
          })
          .then(async data => {
            setDeviceRuntimeFooterText(normalizedText);
            syncConfigCache({
              [DEVICE_RUNTIME_FOOTER_TEXT_CONFIG_KEY]: normalizedText,
            });

            try {
              await peopleActions.defaultCompany();
            } catch (e) {}

            resolve(true);
            return data;
          })
          .catch(err => {
            Alert.alert('Erro', err?.message || JSON.stringify(err));
            resolve(false);
            return null;
          }),
      );
      configActions.initQueue();
    });
  }, [
    configActions,
    defaultCompany?.id,
    deviceRuntimeFooterText,
    isMainCompanySelected,
    peopleActions,
    syncConfigCache,
  ]);

  const saveProfiles = useCallback(() => {
    saveConfig('after-sales-profiles', profiles);
  }, [profiles, saveConfig]);

  const addProfile = useCallback(() => {
    setProfiles(current => [...current, {maxRevenue: 0, days: 30}]);
  }, []);

  const updateProfile = useCallback((index, key, value) => {
    setProfiles(current => {
      const copy = [...current];
      copy[index] = {
        ...copy[index],
        [key]: value,
      };
      return copy;
    });
  }, []);

  const removeProfile = useCallback(index => {
    setProfiles(current => current.filter((_, i) => i !== index));
  }, []);

  const formatRevenueDisplay = value => Formatter.formatMoney(value || 0);

  const formatRevenueEditValue = value => {
    if (value === null || value === undefined) {
      return '';
    }

    return String(value).replace('.', ',');
  };

  const handleRevenueFocus = (index, value) => {
    setEditingRevenueIndex(index);
    setEditingRevenueValue(formatRevenueEditValue(value));
  };

  const handleRevenueChange = value => {
    setEditingRevenueValue(value);
  };

  const handleRevenueBlur = index => {
    updateProfile(
      index,
      'maxRevenue',
      Formatter.formatFloat(editingRevenueValue),
    );
    setEditingRevenueIndex(null);
    setEditingRevenueValue('');
  };

  const formatDaysDisplay = value => {
    const days = parseInt(value, 10) || 0;
    return `${days} dias`;
  };

  const toggleOrderPrintDevice = useCallback(deviceId => {
    setOrderPrintDevices(current => {
      if (current.includes(deviceId)) {
        return current.filter(item => item !== deviceId);
      }

      return [...current, deviceId];
    });
  }, []);

  const saveOrderPrintDevices = useCallback(async () => {
    const normalizedDevices = Array.from(
      new Set(
        orderPrintDevices
          .map(item => String(item || '').trim())
          .filter(Boolean),
      ),
    );

    if (orderPrintEnabled && normalizedDevices.length === 0) {
      Alert.alert(
        'Impressora padrao',
        'Selecione pelo menos um device para ativar a impressao remota de pedidos.',
      );
      return;
    }

    await saveConfigs({
      [ORDER_PRINT_DEVICES_CONFIG_KEY]: orderPrintEnabled ? normalizedDevices : [],
      [ORDER_PRINT_FOOTER_TEXT_CONFIG_KEY]: orderPrintFooterText,
    });
  }, [
    orderPrintDevices,
    orderPrintEnabled,
    orderPrintFooterText,
    saveConfigs,
  ]);

  const toggleOrderPaymentDevice = useCallback(deviceId => {
    setOrderPaymentDevices(current => {
      if (current.includes(deviceId)) {
        return current.filter(item => item !== deviceId);
      }

      return [...current, deviceId];
    });
  }, []);

  const saveOrderPaymentDevices = useCallback(async () => {
    const normalizedDevices = orderPaymentDevices
      .map(item => String(item || '').trim())
      .filter(Boolean);

    if (orderPaymentEnabled && normalizedDevices.length === 0) {
      Alert.alert(
        'Pagamento remoto',
        'Selecione pelo menos um device para ativar o pagamento remoto de pedidos.',
      );
      return;
    }

    await saveConfig(
      ORDER_PAYMENT_DEVICES_CONFIG_KEY,
      orderPaymentEnabled ? normalizedDevices : [],
    );
  }, [orderPaymentDevices, orderPaymentEnabled, saveConfig]);

  const selectedPrinterCount = orderPrintDevices.length;
  const selectedPaymentDeviceCount = orderPaymentDevices.length;
  const configuredDisplayPreparationCount = displayPreparationDevices.length;
  const normalizedStatusOptions = useMemo(
    () => (Array.isArray(statuses) ? statuses : []),
    [statuses],
  );
  const normalizedWalletOptions = useMemo(
    () => (Array.isArray(wallets) ? wallets : []),
    [wallets],
  );
  const normalizedMenuCategories = useMemo(
    () => (Array.isArray(menuCategories) ? menuCategories : []),
    [menuCategories],
  );
  const normalizedMenuGroups = useMemo(
    () => (Array.isArray(menuGroups) ? menuGroups : []),
    [menuGroups],
  );

  const saveOperationalConfigs = useCallback(async () => {
    await saveConfigs({
      'pos-default-status': String(posDefaultStatus || '').trim(),
      'pos-paid-status': String(posPaidStatus || '').trim(),
      'pos-cash-wallet': String(posCashWallet || '').trim(),
      'pos-withdrawl-wallet': String(posWithdrawWallet || '').trim(),
      'pos-cielo-wallet': String(posCieloWallet || '').trim(),
      'pos-infinite-pay-wallet': String(posInfinitePayWallet || '').trim(),
      'cash-register-notifications': normalizeNotificationTargets(
        cashRegisterNotifications,
      ),
    });
  }, [
    cashRegisterNotifications,
    posCashWallet,
    posCieloWallet,
    posDefaultStatus,
    posInfinitePayWallet,
    posPaidStatus,
    posWithdrawWallet,
    saveConfigs,
  ]);

  const toggleMenuHiddenCategory = useCallback(categoryId => {
    const normalizedId = String(categoryId || '').replace(/\D+/g, '').trim();
    if (!normalizedId) {
      return;
    }

    setMenuHiddenCategoryIds(current =>
      current.includes(normalizedId)
        ? current.filter(item => item !== normalizedId)
        : [...current, normalizedId],
    );
  }, []);

  const toggleMenuHiddenGroup = useCallback(groupId => {
    const normalizedId = String(groupId || '').replace(/\D+/g, '').trim();
    if (!normalizedId) {
      return;
    }

    setMenuHiddenGroupIds(current =>
      current.includes(normalizedId)
        ? current.filter(item => item !== normalizedId)
        : [...current, normalizedId],
    );
  }, []);

  const saveMenuCatalogConfigs = useCallback(async () => {
    await saveConfigs({
      [MENU_CATALOG_HIDDEN_CATEGORY_IDS_CONFIG_KEY]: menuHiddenCategoryIds,
      [MENU_CATALOG_HIDDEN_GROUP_IDS_CONFIG_KEY]: menuHiddenGroupIds,
    });
  }, [menuHiddenCategoryIds, menuHiddenGroupIds, saveConfigs]);

  return (
    <SafeAreaView style={styles.Settings.container}>
      <StateStore
        stores={[
          'configs',
          'printer',
          'device_config',
          'status',
          'wallet',
          'categories',
          'product_group',
        ]}
      />
      <ScrollView contentContainerStyle={styles.Settings.scrollContent}>
        <View style={styles.Settings.mainContainer}>
          <Text style={localStyles.pageTitle}>Configurador geral</Text>
          <Text style={localStyles.pageSubtitle}>
            {currentCompany?.name || currentCompany?.alias || 'Empresa ativa'}
          </Text>

          <View style={localStyles.sectionCard}>
            <View style={localStyles.sectionHeader}>
              <View style={[localStyles.sectionIconWrap, {backgroundColor: '#E0F2FE'}]}>
                <Icon name="dvr" size={20} color="#0369A1" />
              </View>
              <View style={localStyles.sectionHeaderCopy}>
                <Text style={localStyles.sectionTitle}>Rodape dos devices</Text>
                <Text style={localStyles.sectionDescription}>
                  Exibe o nome do device e a versao do software em uma linha fina
                  no rodape. Quando existir texto livre na empresa principal,
                  ele entra na mesma linha ou alterna em telas pequenas.
                </Text>
              </View>
            </View>

            <Text style={localStyles.helperText}>
              {isMainCompanySelected
                ? 'Esse texto livre e salvo na empresa principal e compartilhado com todos os devices.'
                : 'Esse rodape pertence a empresa principal. Troque para ela para editar.'}
            </Text>

            <View style={localStyles.fieldBlock}>
              <Text style={localStyles.fieldLabel}>Texto livre</Text>
              <TextInput
                style={[
                  localStyles.input,
                  !isMainCompanySelected && localStyles.inputDisabled,
                ]}
                value={deviceRuntimeFooterText}
                onChangeText={setDeviceRuntimeFooterText}
                editable={isMainCompanySelected && !!defaultCompany?.id}
                placeholder="Ex.: www.seusite.com.br • (11) 99999-9999"
              />
              <Text style={localStyles.helperText}>
                No rodape pequeno, o app alterna entre nome do device / versao
                e esse texto.
              </Text>
            </View>

            <TouchableOpacity
              style={[
                globalStyles.button,
                localStyles.primaryButton,
                (!defaultCompany?.id ||
                  !isMainCompanySelected ||
                  isSaving) &&
                  localStyles.primaryButtonDisabled,
              ]}
              disabled={!defaultCompany?.id || !isMainCompanySelected || isSaving}
              onPress={saveDeviceRuntimeFooter}>
              <Text style={localStyles.primaryButtonText}>
                Salvar rodape dos devices
              </Text>
            </TouchableOpacity>
          </View>

          <View style={localStyles.sectionCard}>
            <View style={localStyles.sectionHeader}>
              <View style={[localStyles.sectionIconWrap, {backgroundColor: '#DBEAFE'}]}>
                <Icon name="print" size={20} color="#2563EB" />
              </View>
              <View style={localStyles.sectionHeaderCopy}>
                <Text style={localStyles.sectionTitle}>Impressao de conferencia</Text>
                <Text style={localStyles.sectionDescription}>
                  Define quais devices da empresa recebem a copia completa do
                  pedido para conferencia e qual texto livre sai no rodape usando
                  as configs `order-print-devices` e `order-print-footer-text`.
                </Text>
              </View>
            </View>

            <View style={localStyles.statusRow}>
              <Text style={localStyles.statusLabel}>Impressao padrao</Text>
              <TouchableOpacity
                style={[
                  localStyles.statusChip,
                  orderPrintEnabled
                    ? localStyles.statusChipEnabled
                    : localStyles.statusChipDisabled,
                ]}
                activeOpacity={0.85}
                onPress={() => setOrderPrintEnabled(current => !current)}>
                <Icon
                  name={orderPrintEnabled ? 'check-circle' : 'block'}
                  size={16}
                  color={orderPrintEnabled ? '#166534' : '#991B1B'}
                />
                <Text
                  style={[
                    localStyles.statusChipText,
                    {color: orderPrintEnabled ? '#166534' : '#991B1B'},
                  ]}>
                  {orderPrintEnabled ? 'Ativada' : 'Desativada'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={localStyles.helperText}>
              {orderPrintEnabled
                ? `${selectedPrinterCount} device(s) selecionado(s).`
                : 'Quando desativada, o backend nao usa impressoras padrao da empresa.'}
            </Text>

            {isLoadingPrinters ? (
              <ActivityIndicator size="small" style={localStyles.sectionLoader} />
            ) : printerOptions.length === 0 ? (
              <View style={localStyles.emptyBox}>
                <Text style={localStyles.emptyTitle}>
                  Nenhum device com impressao disponivel
                </Text>
                <Text style={localStyles.emptyText}>
                  Cadastre e configure um equipamento com suporte a impressao,
                  como uma Cielo, para a empresa ativa.
                </Text>
              </View>
            ) : (
              <View style={localStyles.printerList}>
                {printerOptions.map(printer => {
                  const deviceId = String(printer?.device || '').trim();
                  const active =
                    deviceId !== '' && orderPrintDevices.includes(deviceId);

                  return (
                    <TouchableOpacity
                      key={deviceId}
                      style={[
                        localStyles.printerItem,
                        active && localStyles.printerItemActive,
                      ]}
                      activeOpacity={0.85}
                      onPress={() => toggleOrderPrintDevice(deviceId)}>
                      <Icon
                        name={
                          active
                            ? 'check-circle'
                            : 'radio-button-unchecked'
                        }
                        size={20}
                        color={active ? '#2563EB' : '#94A3B8'}
                      />
                      <View style={localStyles.printerCopy}>
                        <Text style={localStyles.printerName}>
                          {getPrinterLabel(printer)}
                        </Text>
                        <Text style={localStyles.printerDevice}>
                          {deviceId}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={localStyles.fieldBlock}>
              <Text style={localStyles.fieldLabel}>Texto livre do rodape</Text>
              <TextInput
                style={[localStyles.input, localStyles.multilineInput]}
                value={orderPrintFooterText}
                multiline
                numberOfLines={4}
                onChangeText={setOrderPrintFooterText}
                placeholder="Mensagem exibida no rodape da impressao"
              />
              <Text style={localStyles.helperText}>
                Esse conteudo e salvo na config da empresa e sai no rodape de
                todas as impressoes de pedido.
              </Text>
            </View>

            <TouchableOpacity
              style={[
                globalStyles.button,
                localStyles.primaryButton,
                (!currentCompany?.id || isSaving) && localStyles.primaryButtonDisabled,
              ]}
              disabled={!currentCompany?.id || isSaving}
              onPress={saveOrderPrintDevices}>
              <Text style={localStyles.primaryButtonText}>
                Salvar configuracoes de impressao
              </Text>
            </TouchableOpacity>
          </View>

          <View style={localStyles.sectionCard}>
            <View style={localStyles.sectionHeader}>
              <View style={[localStyles.sectionIconWrap, {backgroundColor: '#FEF3C7'}]}>
                <Icon name="receipt-long" size={20} color="#B45309" />
              </View>
              <View style={localStyles.sectionHeaderCopy}>
                <Text style={localStyles.sectionTitle}>Impressao de preparo por fila</Text>
                <Text style={localStyles.sectionDescription}>
                  A copia de preparo e gerada automaticamente por fila nos
                  devices do tipo DISPLAY. Cada DISPLAY precisa estar vinculado
                  a um display e a uma impressora no detalhe do device para que
                  o backend envie a copia correta.
                </Text>
              </View>
            </View>

            <Text style={localStyles.helperText}>
              {configuredDisplayPreparationCount > 0
                ? `${configuredDisplayPreparationCount} device(s) DISPLAY prontos para imprimir filas automaticamente.`
                : 'Nenhum DISPLAY com display vinculado e impressora configurada ainda.'}
            </Text>

            {configuredDisplayPreparationCount > 0 ? (
              <View style={localStyles.printerList}>
                {displayPreparationDevices.map(deviceConfig => {
                  const configs = parseDeviceConfigs(deviceConfig?.configs);
                  const printerId = String(
                    configs?.[DISPLAY_DEVICE_PRINTER_CONFIG_KEY] || '',
                  ).trim();
                  const displayId = String(
                    configs?.[DISPLAY_DEVICE_LINK_CONFIG_KEY] || '',
                  )
                    .replace(/\D+/g, '')
                    .trim();
                  const alias =
                    deviceConfig?.device?.alias ||
                    deviceConfig?.device?.device ||
                    `Device #${deviceConfig?.id || '--'}`;

                  return (
                    <View
                      key={`display-print-${deviceConfig?.id || alias}`}
                      style={[localStyles.printerItem, localStyles.printerItemActive]}>
                      <Icon
                        name="check-circle"
                        size={20}
                        color="#B45309"
                      />
                      <View style={localStyles.printerCopy}>
                        <Text style={localStyles.printerName}>{alias}</Text>
                        <Text style={localStyles.printerDevice}>
                          {`Display #${displayId || '--'} • Impressora ${printerId || '--'}`}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={localStyles.emptyBox}>
                <Text style={localStyles.emptyTitle}>
                  Nenhum DISPLAY preparado para a fila
                </Text>
                <Text style={localStyles.emptyText}>
                  Abra o detalhe do device DISPLAY, selecione o display vinculado
                  e a impressora da fila. Sem isso, a impressao automatica por
                  preparo nao e disparada.
                </Text>
              </View>
            )}
          </View>

          <View style={localStyles.sectionCard}>
            <View style={localStyles.sectionHeader}>
              <View style={[localStyles.sectionIconWrap, {backgroundColor: '#FEF3C7'}]}>
                <Icon name="restaurant-menu" size={20} color="#B45309" />
              </View>
              <View style={localStyles.sectionHeaderCopy}>
                <Text style={localStyles.sectionTitle}>Cardapio em PDF</Text>
                <Text style={localStyles.sectionDescription}>
                  Define quais categorias e grupos de customizacao ficam
                  ocultos no arquivo de cardapio baixado pelo modulo de produtos.
                </Text>
              </View>
            </View>

            <Text style={localStyles.helperText}>
              {menuHiddenCategoryIds.length > 0 || menuHiddenGroupIds.length > 0
                ? `${menuHiddenCategoryIds.length} categoria(s) e ${menuHiddenGroupIds.length} grupo(s) oculto(s) no PDF.`
                : 'Nenhum filtro aplicado. O PDF usa todas as categorias e grupos visiveis da empresa.'}
            </Text>

            <View style={localStyles.fieldBlock}>
              <Text style={localStyles.fieldLabel}>Categorias ocultas</Text>
              <Text style={localStyles.helperText}>
                Toque nas categorias que nao devem aparecer no cardapio gerado.
              </Text>

              {isLoadingMenuCategories ? (
                <ActivityIndicator size="small" style={localStyles.sectionLoader} />
              ) : normalizedMenuCategories.length === 0 ? (
                <View style={localStyles.emptyBox}>
                  <Text style={localStyles.emptyTitle}>
                    Nenhuma categoria encontrada
                  </Text>
                  <Text style={localStyles.emptyText}>
                    Cadastre categorias de produtos para controlar a visibilidade
                    delas no PDF do cardapio.
                  </Text>
                </View>
              ) : (
                <View style={localStyles.printerList}>
                  {normalizedMenuCategories.map(categoryOption => {
                    const categoryId = String(categoryOption?.id || '').trim();
                    const hidden = menuHiddenCategoryIds.includes(categoryId);

                    return (
                      <TouchableOpacity
                        key={`menu-category-${categoryId}`}
                        style={[
                          localStyles.printerItem,
                          hidden && localStyles.printerItemActive,
                        ]}
                        activeOpacity={0.85}
                        onPress={() => toggleMenuHiddenCategory(categoryId)}>
                        <Icon
                          name={hidden ? 'visibility-off' : 'category'}
                          size={20}
                          color={hidden ? '#B45309' : '#94A3B8'}
                        />
                        <View style={localStyles.printerCopy}>
                          <Text style={localStyles.printerName}>
                            {categoryOption?.name || `Categoria #${categoryId}`}
                          </Text>
                          <Text style={localStyles.printerDevice}>
                            {hidden ? 'Oculta no PDF' : 'Visivel no PDF'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={localStyles.fieldBlock}>
              <Text style={localStyles.fieldLabel}>Grupos ocultos</Text>
              <Text style={localStyles.helperText}>
                Esses grupos deixam de aparecer dentro dos produtos customizaveis
                no cardapio em PDF.
              </Text>

              {isLoadingMenuGroups ? (
                <ActivityIndicator size="small" style={localStyles.sectionLoader} />
              ) : normalizedMenuGroups.length === 0 ? (
                <View style={localStyles.emptyBox}>
                  <Text style={localStyles.emptyTitle}>
                    Nenhum grupo de customizacao encontrado
                  </Text>
                  <Text style={localStyles.emptyText}>
                    Os grupos sao lidos dos produtos customizaveis da empresa.
                  </Text>
                </View>
              ) : (
                <View style={localStyles.printerList}>
                  {normalizedMenuGroups.map(groupOption => {
                    const groupId = String(groupOption?.id || '').trim();
                    const hidden = menuHiddenGroupIds.includes(groupId);

                    return (
                      <TouchableOpacity
                        key={`menu-group-${groupId}`}
                        style={[
                          localStyles.printerItem,
                          hidden && localStyles.printerItemActive,
                        ]}
                        activeOpacity={0.85}
                        onPress={() => toggleMenuHiddenGroup(groupId)}>
                        <Icon
                          name={hidden ? 'visibility-off' : 'tune'}
                          size={20}
                          color={hidden ? '#B45309' : '#94A3B8'}
                        />
                        <View style={localStyles.printerCopy}>
                          <Text style={localStyles.printerName}>
                            {getMenuGroupOptionLabel(groupOption)}
                          </Text>
                          <Text style={localStyles.printerDevice}>
                            {hidden ? 'Oculto no PDF' : 'Visivel no PDF'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[
                globalStyles.button,
                localStyles.primaryButton,
                (!currentCompany?.id || isSaving) && localStyles.primaryButtonDisabled,
              ]}
              disabled={!currentCompany?.id || isSaving}
              onPress={saveMenuCatalogConfigs}>
              <Text style={localStyles.primaryButtonText}>
                Salvar filtros do cardapio
              </Text>
            </TouchableOpacity>
          </View>

          <View style={localStyles.sectionCard}>
            <View style={localStyles.sectionHeader}>
              <View style={[localStyles.sectionIconWrap, {backgroundColor: '#EDE9FE'}]}>
                <Icon name="credit-card" size={20} color="#7C3AED" />
              </View>
              <View style={localStyles.sectionHeaderCopy}>
                <Text style={localStyles.sectionTitle}>Pagamento remoto de pedidos</Text>
                <Text style={localStyles.sectionDescription}>
                  Define a ordem padrao dos devices que recebem pedidos para
                  pagamento remoto. Quando um device nao tem destino proprio,
                  o primeiro da lista vira o fallback padrao.
                </Text>
              </View>
            </View>

            <View style={localStyles.statusRow}>
              <Text style={localStyles.statusLabel}>Pagamento padrao</Text>
              <TouchableOpacity
                style={[
                  localStyles.statusChip,
                  orderPaymentEnabled
                    ? localStyles.statusChipEnabled
                    : localStyles.statusChipDisabled,
                ]}
                activeOpacity={0.85}
                onPress={() => setOrderPaymentEnabled(current => !current)}>
                <Icon
                  name={orderPaymentEnabled ? 'check-circle' : 'block'}
                  size={16}
                  color={orderPaymentEnabled ? '#166534' : '#991B1B'}
                />
                <Text
                  style={[
                    localStyles.statusChipText,
                    {color: orderPaymentEnabled ? '#166534' : '#991B1B'},
                  ]}>
                  {orderPaymentEnabled ? 'Ativado' : 'Desativado'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={localStyles.helperText}>
              {orderPaymentEnabled
                ? `${selectedPaymentDeviceCount} device(s) configurado(s) para fallback remoto.`
                : 'Quando desativado, devices sem gateway local nao recebem fallback remoto por empresa.'}
            </Text>

            {isLoadingDeviceConfigs ? (
              <ActivityIndicator size="small" style={localStyles.sectionLoader} />
            ) : paymentDevices.length === 0 ? (
              <View style={localStyles.emptyBox}>
                <Text style={localStyles.emptyTitle}>
                  Nenhum device com pagamento remoto disponivel
                </Text>
                <Text style={localStyles.emptyText}>
                  Configure ao menos um device da empresa com gateway Cielo ou
                  Infinite Pay para usar o pagamento remoto.
                </Text>
              </View>
            ) : (
              <View style={localStyles.printerList}>
                {paymentDevices.map(paymentDevice => {
                  const deviceId = String(paymentDevice.deviceId || '').trim();
                  const active =
                    deviceId !== '' && orderPaymentDevices.includes(deviceId);

                  return (
                    <TouchableOpacity
                      key={deviceId}
                      style={[
                        localStyles.printerItem,
                        active && localStyles.printerItemActive,
                      ]}
                      activeOpacity={0.85}
                      onPress={() => toggleOrderPaymentDevice(deviceId)}>
                      <Icon
                        name={
                          active
                            ? 'check-circle'
                            : 'radio-button-unchecked'
                        }
                        size={20}
                        color={active ? '#7C3AED' : '#94A3B8'}
                      />
                      <View style={localStyles.printerCopy}>
                        <Text style={localStyles.printerName}>
                          {paymentDevice.alias}
                        </Text>
                        <Text style={localStyles.printerDevice}>
                          {paymentDevice.gatewayLabel} • {deviceId}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <TouchableOpacity
              style={[
                globalStyles.button,
                localStyles.primaryButton,
                (!currentCompany?.id || isSaving) && localStyles.primaryButtonDisabled,
              ]}
              disabled={!currentCompany?.id || isSaving}
              onPress={saveOrderPaymentDevices}>
              <Text style={localStyles.primaryButtonText}>
                Salvar devices de pagamento
              </Text>
            </TouchableOpacity>
          </View>

          <View style={localStyles.sectionCard}>
            <View style={localStyles.sectionHeader}>
              <View style={[localStyles.sectionIconWrap, {backgroundColor: '#DCFCE7'}]}>
                <Icon name="point-of-sale" size={20} color="#166534" />
              </View>
              <View style={localStyles.sectionHeaderCopy}>
                <Text style={localStyles.sectionTitle}>Operacao e PDV</Text>
                <Text style={localStyles.sectionDescription}>
                  Status, carteiras e notificacoes usadas pelos fluxos de pedido,
                  pagamento e fechamento de caixa.
                </Text>
              </View>
            </View>

            <View style={localStyles.fieldBlock}>
              <Text style={localStyles.fieldLabel}>Status padrao do PDV</Text>
              <Picker
                selectedValue={posDefaultStatus}
                mode={pickerMode}
                onValueChange={value => setPosDefaultStatus(String(value || ''))}
                style={styles.Settings.picker}>
                <Picker.Item label="Selecione um status" value="" />
                {normalizedStatusOptions.map(statusOption => (
                  <Picker.Item
                    key={statusOption.id}
                    label={`${statusOption.context || 'geral'} • ${statusOption.status}`}
                    value={String(statusOption.id)}
                  />
                ))}
              </Picker>
            </View>

            <View style={localStyles.fieldBlock}>
              <Text style={localStyles.fieldLabel}>Status pago</Text>
              <Picker
                selectedValue={posPaidStatus}
                mode={pickerMode}
                onValueChange={value => setPosPaidStatus(String(value || ''))}
                style={styles.Settings.picker}>
                <Picker.Item label="Selecione um status" value="" />
                {normalizedStatusOptions.map(statusOption => (
                  <Picker.Item
                    key={`paid-${statusOption.id}`}
                    label={`${statusOption.context || 'geral'} • ${statusOption.status}`}
                    value={String(statusOption.id)}
                  />
                ))}
              </Picker>
            </View>

            <View style={localStyles.fieldBlock}>
              <Text style={localStyles.fieldLabel}>Carteira de dinheiro</Text>
              <Picker
                selectedValue={posCashWallet}
                mode={pickerMode}
                onValueChange={value => setPosCashWallet(String(value || ''))}
                style={styles.Settings.picker}>
                <Picker.Item label="Selecione uma carteira" value="" />
                {normalizedWalletOptions.map(walletOption => (
                  <Picker.Item
                    key={`cash-${walletOption.id}`}
                    label={walletOption.wallet}
                    value={String(walletOption.id)}
                  />
                ))}
              </Picker>
            </View>

            <View style={localStyles.fieldBlock}>
              <Text style={localStyles.fieldLabel}>Carteira de sangria</Text>
              <Picker
                selectedValue={posWithdrawWallet}
                mode={pickerMode}
                onValueChange={value => setPosWithdrawWallet(String(value || ''))}
                style={styles.Settings.picker}>
                <Picker.Item label="Selecione uma carteira" value="" />
                {normalizedWalletOptions.map(walletOption => (
                  <Picker.Item
                    key={`withdraw-${walletOption.id}`}
                    label={walletOption.wallet}
                    value={String(walletOption.id)}
                  />
                ))}
              </Picker>
            </View>

            <View style={localStyles.fieldBlock}>
              <Text style={localStyles.fieldLabel}>Carteira Cielo</Text>
              <Picker
                selectedValue={posCieloWallet}
                mode={pickerMode}
                onValueChange={value => setPosCieloWallet(String(value || ''))}
                style={styles.Settings.picker}>
                <Picker.Item label="Selecione uma carteira" value="" />
                {normalizedWalletOptions.map(walletOption => (
                  <Picker.Item
                    key={`cielo-${walletOption.id}`}
                    label={walletOption.wallet}
                    value={String(walletOption.id)}
                  />
                ))}
              </Picker>
            </View>

            <View style={localStyles.fieldBlock}>
              <Text style={localStyles.fieldLabel}>Carteira Infinite Pay</Text>
              <Picker
                selectedValue={posInfinitePayWallet}
                mode={pickerMode}
                onValueChange={value => setPosInfinitePayWallet(String(value || ''))}
                style={styles.Settings.picker}>
                <Picker.Item label="Selecione uma carteira" value="" />
                {normalizedWalletOptions.map(walletOption => (
                  <Picker.Item
                    key={`infinite-${walletOption.id}`}
                    label={walletOption.wallet}
                    value={String(walletOption.id)}
                  />
                ))}
              </Picker>
            </View>

            <View style={localStyles.fieldBlock}>
              <Text style={localStyles.fieldLabel}>
                Notificacoes de fechamento de caixa
              </Text>
              <TextInput
                style={[localStyles.input, localStyles.multilineInput]}
                value={cashRegisterNotifications}
                multiline
                numberOfLines={4}
                onChangeText={setCashRegisterNotifications}
                placeholder="Um numero por linha ou separado por virgula"
              />
            </View>

            {(isLoadingStatuses || isLoadingWallets) && (
              <ActivityIndicator size="small" style={localStyles.sectionLoader} />
            )}

            <TouchableOpacity
              style={[
                globalStyles.button,
                localStyles.primaryButton,
                (!currentCompany?.id || isSaving) && localStyles.primaryButtonDisabled,
              ]}
              disabled={!currentCompany?.id || isSaving}
              onPress={saveOperationalConfigs}>
              <Text style={localStyles.primaryButtonText}>
                Salvar configuracoes do PDV
              </Text>
            </TouchableOpacity>
          </View>

          <View style={localStyles.sectionCard}>
            <View style={localStyles.sectionHeader}>
              <View style={[localStyles.sectionIconWrap, {backgroundColor: '#EDE9FE'}]}>
                <Icon name="groups" size={20} color="#7C3AED" />
              </View>
              <View style={localStyles.sectionHeaderCopy}>
                <Text style={localStyles.sectionTitle}>CRM</Text>
                <Text style={localStyles.sectionDescription}>
                  Configuracoes comerciais e regras de distribuicao de atendimento.
                </Text>
              </View>
            </View>

            <View style={localStyles.fieldBlock}>
              <Text style={localStyles.fieldLabel}>
                {global.t?.t('configs', 'label', 'salesmanDistributionStrategy')}
              </Text>

              <Picker
                selectedValue={strategy}
                mode={pickerMode}
                onValueChange={value => {
                  setStrategy(value);
                  saveConfig('salesman-distribution-strategy', value);
                }}
                style={styles.Settings.picker}>
                <Picker.Item
                  label={global.t?.t('configs', 'option', 'random')}
                  value="random"
                />
                <Picker.Item
                  label={global.t?.t('configs', 'option', 'roundRobin')}
                  value="round_robin"
                />
                <Picker.Item
                  label={global.t?.t('configs', 'option', 'leastClients')}
                  value="least_clients"
                />
                <Picker.Item
                  label={global.t?.t('configs', 'option', 'lastReceived')}
                  value="last_received"
                />
              </Picker>
            </View>

            <View style={localStyles.fieldBlock}>
              <Text style={localStyles.fieldLabel}>
                {global.t?.t('configs', 'label', 'maxTasksPerSalesman')}
              </Text>

              <TextInput
                style={localStyles.input}
                value={maxTasks}
                keyboardType="numeric"
                onChangeText={setMaxTasks}
                onBlur={() => saveConfig('salesman-max-tasks', maxTasks)}
              />
            </View>

            <View style={localStyles.fieldBlock}>
              <Text style={localStyles.fieldLabel}>
                {global.t?.t('configs', 'label', 'revenuePeriod')}
              </Text>

              <TextInput
                style={localStyles.input}
                value={revenuePeriod}
                keyboardType="numeric"
                onChangeText={setRevenuePeriod}
                onBlur={() =>
                  saveConfig('after-sales-revenue-period', revenuePeriod)
                }
              />
            </View>

            <View style={localStyles.fieldBlock}>
              <Text style={localStyles.fieldLabel}>
                {global.t?.t('configs', 'label', 'afterSalesProfiles')}
              </Text>

              {profiles.map((profile, index) => (
                <View key={index} style={localStyles.profileRow}>
                  <TextInput
                    style={[localStyles.input, localStyles.profileInput]}
                    keyboardType="decimal-pad"
                    value={
                      editingRevenueIndex === index
                        ? editingRevenueValue
                        : formatRevenueDisplay(profile.maxRevenue)
                    }
                    placeholder={global.t?.t(
                      'configs',
                      'placeholder',
                      'revenueAbove',
                    )}
                    onFocus={() =>
                      handleRevenueFocus(index, profile.maxRevenue)
                    }
                    onChangeText={handleRevenueChange}
                    onBlur={() => handleRevenueBlur(index)}
                  />

                  <TextInput
                    style={[
                      localStyles.input,
                      localStyles.profileInput,
                      localStyles.profileInputSpacing,
                    ]}
                    keyboardType="numeric"
                    value={formatDaysDisplay(profile.days)}
                    placeholder="Dias"
                    onChangeText={value =>
                      updateProfile(
                        index,
                        'days',
                        parseInt(Formatter.onlyNumbers(value), 10) || 0,
                      )
                    }
                  />

                  <TouchableOpacity
                    onPress={() => removeProfile(index)}
                    style={localStyles.removeProfileButton}>
                    <Icon name="delete" size={22} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                style={[globalStyles.button, localStyles.primaryButton]}
                onPress={addProfile}>
                <Text style={localStyles.primaryButtonText}>
                  {global.t?.t('configs', 'button', 'addProfile')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[globalStyles.button, localStyles.secondaryButton]}
                onPress={saveProfiles}>
                <Text style={localStyles.primaryButtonText}>
                  {global.t?.t('configs', 'button', 'saveProfiles')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {isSaving && (
            <ActivityIndicator size="large" style={localStyles.sectionLoader} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
    marginBottom: 20,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionHeaderCopy: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#64748B',
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusChipEnabled: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  statusChipDisabled: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  statusChipText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  helperText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 14,
  },
  emptyBox: {
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#64748B',
  },
  printerList: {
    gap: 10,
  },
  printerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  printerItemActive: {
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
  },
  printerCopy: {
    flex: 1,
    marginLeft: 12,
  },
  printerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  printerDevice: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  primaryButton: {
    marginTop: 16,
    justifyContent: 'center',
  },
  secondaryButton: {
    marginTop: 10,
    justifyContent: 'center',
    backgroundColor: '#334155',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  fieldBlock: {
    marginTop: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 6,
  },
  inputDisabled: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
  },
  multilineInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  profileInput: {
    flex: 1,
    marginTop: 0,
  },
  profileInputSpacing: {
    marginLeft: 10,
  },
  removeProfileButton: {
    marginLeft: 10,
    padding: 4,
  },
  sectionLoader: {
    marginTop: 18,
  },
});

export default GeneralSettings;
