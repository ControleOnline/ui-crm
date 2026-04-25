import {useCallback, useMemo} from 'react';
import {Alert} from 'react-native';

import {useStore} from '@store';

export const ORDER_PRINT_DEVICES_CONFIG_KEY = 'order-print-devices';
export const ORDER_PRINT_FOOTER_TEXT_CONFIG_KEY = 'order-print-footer-text';
export const DISPLAY_DEVICE_TYPE = 'DISPLAY';
export const DISPLAY_DEVICE_LINK_CONFIG_KEY = 'display-id';
export const DISPLAY_DEVICE_PRINTER_CONFIG_KEY = 'printer';
export const MENU_CATALOG_HIDDEN_CATEGORY_IDS_CONFIG_KEY =
  'menu-catalog-hidden-category-ids';
export const MENU_CATALOG_HIDDEN_GROUP_IDS_CONFIG_KEY =
  'menu-catalog-hidden-group-ids';
export const GENERAL_SETTINGS_PICKER_MODE = 'dropdown';

export const DEFAULT_AFTER_SALES_PROFILES = [
  {maxRevenue: 10000, days: 30},
  {maxRevenue: 1000, days: 60},
  {maxRevenue: 0, days: 120},
];

export const parseJsonValue = (value, fallback) => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  return value;
};

export const normalizeProfiles = value => {
  const parsed = parseJsonValue(value, DEFAULT_AFTER_SALES_PROFILES);
  return Array.isArray(parsed) && parsed.length > 0
    ? parsed
    : DEFAULT_AFTER_SALES_PROFILES;
};

export const normalizeIdList = value => {
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

export const normalizeNotificationTargets = value => {
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

export const normalizeEntityId = value =>
  String(value || '')
    .replace(/\D+/g, '')
    .trim();

export const normalizeTextConfigValue = value => {
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
    } catch {
      return value;
    }

    return value;
  }

  return String(value);
};

export const parseDeviceConfigs = value => {
  const parsed = parseJsonValue(value, {});
  return parsed && typeof parsed === 'object' ? parsed : {};
};

export const getMenuGroupOptionLabel = group => {
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

export const toConfigRequestValue = value => {
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
    } catch {
      return JSON.stringify(value);
    }
  }

  return JSON.stringify(value);
};

export const toConfigCacheValue = value => {
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

const isMethodNotAllowedError = error => {
  const status = Number(
    error?.status || error?.response?.status || error?.data?.status || 0,
  );

  if (status === 405) {
    return true;
  }

  const details = String(
    error?.detail || error?.message || JSON.stringify(error || {}),
  ).toLowerCase();

  return details.includes('method not allowed') || details.includes('405');
};

export const useGeneralSettingsConfig = () => {
  const peopleStore = useStore('people');
  const {currentCompany, defaultCompany} = peopleStore.getters;
  const peopleActions = peopleStore.actions;

  const configsStore = useStore('configs');
  const configsGetters = configsStore.getters;
  const {items: companyConfigs, isSaving} = configsGetters;
  const configActions = configsStore.actions;

  const effectiveCompanyConfigs = useMemo(() => {
    if (companyConfigs && typeof companyConfigs === 'object') {
      return companyConfigs;
    }

    if (currentCompany?.configs && typeof currentCompany.configs === 'object') {
      return currentCompany.configs;
    }

    return {};
  }, [companyConfigs, currentCompany?.configs]);

  const selectedCompanyId = useMemo(
    () => normalizeEntityId(currentCompany?.id || currentCompany?.['@id']),
    [currentCompany?.['@id'], currentCompany?.id],
  );
  const defaultCompanyId = useMemo(
    () => normalizeEntityId(defaultCompany?.id || defaultCompany?.['@id']),
    [defaultCompany?.['@id'], defaultCompany?.id],
  );
  const isMainCompanySelected =
    selectedCompanyId !== '' &&
    defaultCompanyId !== '' &&
    selectedCompanyId === defaultCompanyId;
  const defaultCompanyLabel =
    defaultCompany?.alias || defaultCompany?.name || 'empresa principal';

  const syncConfigCache = useCallback(
    entries => {
      const baseConfigs =
        companyConfigs && typeof companyConfigs === 'object'
          ? companyConfigs
          : effectiveCompanyConfigs;

      configActions.setItems({
        ...baseConfigs,
        ...entries,
      });
    },
    [companyConfigs, configActions, effectiveCompanyConfigs],
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
        configActions.addToQueue(async () => {
          const requestConfigItems = Object.entries(requestEntries).map(
            ([configKey, configValue]) => ({
              configKey,
              configValue,
            }),
          );

          try {
            const data = await configActions.addManyConfigs({
              configs: requestConfigItems,
              people: '/people/' + currentCompany.id,
              module: 4,
              visibility: 'public',
            });

            syncConfigCache(cacheEntries);
            resolve(true);
            return data;
          } catch (err) {
            if (!isMethodNotAllowedError(err)) {
              Alert.alert('Erro', err?.message || JSON.stringify(err));
              resolve(false);
              return null;
            }

            try {
              for (const item of requestConfigItems) {
                await configActions.addConfigs({
                  configKey: item.configKey,
                  configValue: item.configValue,
                  people: '/people/' + currentCompany.id,
                  module: 4,
                  visibility: 'public',
                });
              }

              syncConfigCache(cacheEntries);
              resolve(true);
              return true;
            } catch (fallbackErr) {
              Alert.alert(
                'Erro',
                fallbackErr?.message || JSON.stringify(fallbackErr),
              );
              resolve(false);
              return null;
            }
          }
        });
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

  return {
    configActions,
    currentCompany,
    defaultCompany,
    defaultCompanyLabel,
    effectiveCompanyConfigs,
    isMainCompanySelected,
    isSaving,
    peopleActions,
    saveConfig,
    saveConfigs,
  };
};
