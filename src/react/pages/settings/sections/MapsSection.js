/*
 * @agents This section controls map keys, shop primary entry (mapa vs vitrine),
 * franchise-locator enablement, franchise address categories and the franchise
 * directory (companies + addresses visibility) for app_type=shop.
 * Lat/long persist via Address API + DefaultAddress explicit fields.
 * app-community#360 — maps settings live here (not the Shop tab).
 */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {useStore} from '@store';
import {
  useGeneralSettingsPalette,
  useGeneralSettingsStyles,
} from '../GeneralSettings.styles';
import GeneralSettingsSection from '../GeneralSettingsSection';
import ShopFranchiseLocatorSection from './shop/ShopFranchiseLocatorSection';
import {useGeneralSettingsConfig} from '../GeneralSettings.shared';
import {
  GOOGLE_MAPS_ANDROID_API_KEY_CONFIG_KEY,
  GOOGLE_MAPS_WEB_API_KEY_CONFIG_KEY,
  resolveGoogleMapsSettings,
} from '@controleonline/ui-common/src/react/utils/googleMapsConfig';
import {
  getEnabledShopHomeOptions,
  normalizeBooleanConfig,
  normalizeShopPrimaryEntry,
  resolveShopSettings,
  saveAndUpdateConfigValue,
  SHOP_FRANCHISE_ADDRESS_CATEGORY_CONTEXT,
  SHOP_FRANCHISE_ADDRESS_CATEGORY_IDS_CONFIG_KEY,
  SHOP_FRANCHISE_LOCATOR_ENABLED_CONFIG_KEY,
  SHOP_HOME_OPTION_FRANCHISE_LOCATOR,
  SHOP_HOME_OPTION_SALES,
  SHOP_PRIMARY_ENTRY_CONFIG_KEY,
  SHOP_SALES_PAGE_ENABLED_CONFIG_KEY,
} from '@controleonline/ui-common/src/react/utils/shopConfig';

const PRIMARY_ENTRY_LABELS = {
  [SHOP_HOME_OPTION_SALES]: 'Vitrine do shop',
  [SHOP_HOME_OPTION_FRANCHISE_LOCATOR]: 'Mapa das franquias',
};

const MapsSection = () => {
  const localStyles = useGeneralSettingsStyles();
  const themePalette = useGeneralSettingsPalette();
  const categoriesStore = useStore('categories');
  const categoryActions = categoriesStore.actions;
  const {
    currentCompany,
    defaultCompany,
    effectiveCompanyConfigs,
    saveConfig,
    saveConfigs,
    saveDefaultCompanyConfigs,
  } = useGeneralSettingsConfig();

  const [webGoogleMapsApiKey, setWebGoogleMapsApiKey] = useState('');
  const [androidGoogleMapsApiKey, setAndroidGoogleMapsApiKey] = useState('');
  const [franchiseAddressCategories, setFranchiseAddressCategories] =
    useState([]);
  const [franchiseAddressCategoryIds, setFranchiseAddressCategoryIds] =
    useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [salesPageEnabled, setSalesPageEnabled] = useState(false);
  const [franchiseLocatorEnabled, setFranchiseLocatorEnabled] = useState(false);
  const [primaryEntry, setPrimaryEntry] = useState('');

  const defaultCompanyId = defaultCompany?.id || defaultCompany?.['@id'];
  const defaultCompanyIri = defaultCompanyId
    ? '/people/' + defaultCompanyId
    : '';
  const shopSettings = useMemo(
    () => resolveShopSettings(effectiveCompanyConfigs),
    [effectiveCompanyConfigs],
  );

  useEffect(() => {
    const nextSettings = resolveGoogleMapsSettings(effectiveCompanyConfigs);
    setWebGoogleMapsApiKey(nextSettings.webGoogleMapsApiKey);
    setAndroidGoogleMapsApiKey(nextSettings.androidGoogleMapsApiKey);
    setFranchiseAddressCategoryIds(
      shopSettings.franchiseAddressCategoryIds || [],
    );

    const nextSales = normalizeBooleanConfig(
      effectiveCompanyConfigs?.[SHOP_SALES_PAGE_ENABLED_CONFIG_KEY],
    );
    const nextLocator = normalizeBooleanConfig(
      effectiveCompanyConfigs?.[SHOP_FRANCHISE_LOCATOR_ENABLED_CONFIG_KEY],
    );
    setSalesPageEnabled(nextSales);
    setFranchiseLocatorEnabled(nextLocator);
    setPrimaryEntry(
      normalizeShopPrimaryEntry(
        effectiveCompanyConfigs?.[SHOP_PRIMARY_ENTRY_CONFIG_KEY],
        {
          salesPageEnabled: nextSales,
          franchiseLocatorEnabled: nextLocator,
          loyaltyCouponsEnabled: false,
        },
      ),
    );
  }, [effectiveCompanyConfigs, shopSettings.franchiseAddressCategoryIds]);

  useEffect(() => {
    if (!defaultCompanyIri || !categoryActions?.getItems) {
      setFranchiseAddressCategories([]);
      return undefined;
    }

    let isMounted = true;
    setIsLoadingCategories(true);

    categoryActions
      .getItems({
        context: SHOP_FRANCHISE_ADDRESS_CATEGORY_CONTEXT,
        people: defaultCompanyIri,
        itemsPerPage: 100,
      })
      .then(result => {
        const items = Array.isArray(result)
          ? result
          : result?.member ||
            result?.['hydra:member'] ||
            categoriesStore.getters?.items ||
            [];

        if (isMounted) {
          setFranchiseAddressCategories(Array.isArray(items) ? items : []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setFranchiseAddressCategories([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingCategories(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [categoryActions, categoriesStore.getters, defaultCompanyIri]);

  const enabledHomeOptions = useMemo(
    () =>
      getEnabledShopHomeOptions({
        salesPageEnabled,
        franchiseLocatorEnabled,
        loyaltyCouponsEnabled: false,
      }),
    [franchiseLocatorEnabled, salesPageEnabled],
  );

  const primaryEntryOptions = useMemo(
    () =>
      enabledHomeOptions
        .filter(
          option =>
            option === SHOP_HOME_OPTION_SALES ||
            option === SHOP_HOME_OPTION_FRANCHISE_LOCATOR,
        )
        .map(option => ({
          value: option,
          label: PRIMARY_ENTRY_LABELS[option] || option,
        })),
    [enabledHomeOptions],
  );

  const saveMapsSettings = useCallback(async () => {
    await saveConfigs({
      [GOOGLE_MAPS_WEB_API_KEY_CONFIG_KEY]: String(
        webGoogleMapsApiKey || '',
      ).trim(),
      [GOOGLE_MAPS_ANDROID_API_KEY_CONFIG_KEY]: String(
        androidGoogleMapsApiKey || '',
      ).trim(),
    });
  }, [androidGoogleMapsApiKey, saveConfigs, webGoogleMapsApiKey]);

  const toggleFranchiseAddressCategory = useCallback(
    category => {
      const categoryId = String(category?.id || category?.['@id'] || '')
        .replace(/\D+/g, '')
        .trim();
      if (!categoryId) {
        return;
      }
      const nextIds = franchiseAddressCategoryIds.includes(categoryId)
        ? franchiseAddressCategoryIds.filter(id => id !== categoryId)
        : [...franchiseAddressCategoryIds, categoryId];
      setFranchiseAddressCategoryIds(nextIds);
      const saved = saveDefaultCompanyConfigs?.({
        [SHOP_FRANCHISE_ADDRESS_CATEGORY_IDS_CONFIG_KEY]: nextIds,
      });
      if (!saved) {
        setFranchiseAddressCategoryIds(franchiseAddressCategoryIds);
      }
    },
    [franchiseAddressCategoryIds, saveDefaultCompanyConfigs],
  );

  const toggleSalesPage = useCallback(() => {
    const next = !salesPageEnabled;
    saveAndUpdateConfigValue({
      configKey: SHOP_SALES_PAGE_ENABLED_CONFIG_KEY,
      nextValue: next,
      saveConfig,
      setValue: setSalesPageEnabled,
    });
  }, [salesPageEnabled, saveConfig]);

  const toggleFranchiseLocator = useCallback(() => {
    const next = !franchiseLocatorEnabled;
    saveAndUpdateConfigValue({
      configKey: SHOP_FRANCHISE_LOCATOR_ENABLED_CONFIG_KEY,
      nextValue: next,
      saveConfig,
      setValue: setFranchiseLocatorEnabled,
    });
  }, [franchiseLocatorEnabled, saveConfig]);

  const selectPrimaryEntry = useCallback(
    value => {
      if (primaryEntryOptions.length <= 1) {
        return;
      }
      saveAndUpdateConfigValue({
        configKey: SHOP_PRIMARY_ENTRY_CONFIG_KEY,
        nextValue: value,
        saveConfig,
        setValue: setPrimaryEntry,
      });
    },
    [primaryEntryOptions.length, saveConfig],
  );

  return (
    <GeneralSettingsSection
      description="Chaves do Google Maps, tela principal do shop (mapa de franquias vs vitrine), localizador, categorias e lista de franquias/endereços visíveis no mapa do shop."
      icon="map"
      iconBackgroundColor={themePalette.cardIconBackground}
      iconColor={themePalette.cardIconColor}
      title="Mapas">
      <View style={localStyles.fieldBlock}>
        <Text style={localStyles.fieldLabel}>Chave do Google Maps Web</Text>
        <Text style={localStyles.helperText}>
          Usada no display web e no mapa de franquias do shop.
        </Text>
        <TextInput
          value={webGoogleMapsApiKey}
          onChangeText={setWebGoogleMapsApiKey}
          onBlur={saveMapsSettings}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Cole a chave do Google Maps para web"
          placeholderTextColor={themePalette.inputPlaceholderText}
          style={localStyles.input}
        />
      </View>

      <View style={localStyles.fieldBlock}>
        <Text style={localStyles.fieldLabel}>Chave do Google Maps Android</Text>
        <Text style={localStyles.helperText}>
          Reserve para fluxos nativos. O display de entregas no Android usa a
          chave web (WebView).
        </Text>
        <TextInput
          value={androidGoogleMapsApiKey}
          onChangeText={setAndroidGoogleMapsApiKey}
          onBlur={saveMapsSettings}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Cole a chave do Google Maps para Android"
          placeholderTextColor={themePalette.inputPlaceholderText}
          style={localStyles.input}
        />
      </View>

      <View style={localStyles.settingRow}>
        <View style={localStyles.settingCopy}>
          <Text style={localStyles.statusLabel}>Vitrine do shop</Text>
          <Text style={localStyles.settingDescription}>
            Ativa a vitrine principal (categorias/produtos) como entrada do
            app_type=shop.
          </Text>
        </View>
        <TouchableOpacity
          style={[
            localStyles.statusChip,
            salesPageEnabled
              ? localStyles.statusChipEnabled
              : localStyles.statusChipDisabled,
          ]}
          activeOpacity={0.85}
          onPress={toggleSalesPage}>
          <Icon
            name={salesPageEnabled ? 'check-circle' : 'block'}
            size={16}
            color={
              salesPageEnabled
                ? themePalette.badgeSelectedText
                : themePalette.badgeDisabledText
            }
          />
          <Text
            style={[
              localStyles.statusChipText,
              {
                color: salesPageEnabled
                  ? themePalette.badgeSelectedText
                  : themePalette.badgeDisabledText,
              },
            ]}>
            {salesPageEnabled ? 'Ativado' : 'Desativado'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={localStyles.settingRow}>
        <View style={localStyles.settingCopy}>
          <Text style={localStyles.statusLabel}>Localizador de franquias</Text>
          <Text style={localStyles.settingDescription}>
            Ativa o mapa das franquias como entrada do app_type=shop.
          </Text>
        </View>
        <TouchableOpacity
          style={[
            localStyles.statusChip,
            franchiseLocatorEnabled
              ? localStyles.statusChipEnabled
              : localStyles.statusChipDisabled,
          ]}
          activeOpacity={0.85}
          onPress={toggleFranchiseLocator}>
          <Icon
            name={franchiseLocatorEnabled ? 'check-circle' : 'block'}
            size={16}
            color={
              franchiseLocatorEnabled
                ? themePalette.badgeSelectedText
                : themePalette.badgeDisabledText
            }
          />
          <Text
            style={[
              localStyles.statusChipText,
              {
                color: franchiseLocatorEnabled
                  ? themePalette.badgeSelectedText
                  : themePalette.badgeDisabledText,
              },
            ]}>
            {franchiseLocatorEnabled ? 'Ativado' : 'Desativado'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={localStyles.fieldBlock}>
        <Text style={localStyles.fieldLabel}>Tela principal do shop</Text>
        <Text style={localStyles.helperText}>
          {primaryEntryOptions.length === 0
            ? 'Ative a vitrine e/ou o localizador acima para escolher a entrada principal.'
            : primaryEntryOptions.length === 1
              ? 'Apenas uma entrada está ativa — ela é usada automaticamente.'
              : 'Escolha qual entrada o app_type=shop abre primeiro: mapa das franquias ou vitrine.'}
        </Text>
        {primaryEntryOptions.length > 0 && (
          <View
            testID="maps-primary-entry-options"
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 8,
              marginTop: 8,
            }}>
            {primaryEntryOptions.map(option => {
              const selected = primaryEntry === option.value;
              const locked = primaryEntryOptions.length === 1;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    localStyles.statusChip,
                    selected
                      ? localStyles.statusChipEnabled
                      : localStyles.statusChipDisabled,
                  ]}
                  activeOpacity={locked ? 1 : 0.85}
                  onPress={() => selectPrimaryEntry(option.value)}
                  disabled={locked}>
                  <Icon
                    name={
                      option.value === SHOP_HOME_OPTION_FRANCHISE_LOCATOR
                        ? 'map'
                        : 'storefront'
                    }
                    size={16}
                    color={
                      selected
                        ? themePalette.badgeSelectedText
                        : themePalette.badgeDisabledText
                    }
                  />
                  <Text
                    style={[
                      localStyles.statusChipText,
                      {
                        color: selected
                          ? themePalette.badgeSelectedText
                          : themePalette.badgeDisabledText,
                      },
                    ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      <View style={localStyles.fieldBlock}>
        <Text style={localStyles.fieldLabel}>
          Categorias de endereços no mapa de franquias
        </Text>
        {isLoadingCategories ? (
          <ActivityIndicator size={22} color={themePalette.primary} />
        ) : franchiseAddressCategories.length === 0 ? (
          <Text style={localStyles.helperText}>
            Nenhuma categoria de endereço encontrada.
          </Text>
        ) : (
          <View>
            {franchiseAddressCategories.map(category => {
              const categoryId = String(category?.id || category?.['@id'] || '')
                .replace(/\D+/g, '')
                .trim();
              const selected = franchiseAddressCategoryIds.includes(categoryId);

              return (
                <TouchableOpacity
                  activeOpacity={0.85}
                  key={category?.['@id'] || category?.id}
                  onPress={() => toggleFranchiseAddressCategory(category)}
                  style={[
                    localStyles.franchiseAddressOption,
                    selected && localStyles.franchiseAddressOptionActive,
                  ]}>
                  <View style={localStyles.franchiseAddressOptionCopy}>
                    <Text style={localStyles.franchiseAddressName}>
                      {category?.name || `Categoria #${categoryId}`}
                    </Text>
                  </View>
                  <Icon
                    name={selected ? 'check-box' : 'check-box-outline-blank'}
                    size={22}
                    color={
                      selected ? themePalette.primary : themePalette.textMuted
                    }
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      <Text style={localStyles.helperText}>
        Latitude/Longitude: campos explícitos no formulário DefaultAddress e
        persistidos na tabela de endereço (API). A lista abaixo controla quais
        franquias e endereços aparecem no mapa do shop (chaves
        shop-franchise-visible-*).
      </Text>

      <View testID="maps-franchise-locator">
      <ShopFranchiseLocatorSection
        currentCompanyId={currentCompany?.id || currentCompany?.['@id']}
        effectiveCompanyConfigs={effectiveCompanyConfigs}
        localStyles={localStyles}
        saveConfigs={saveConfigs}
        themePalette={themePalette}
      />
      </View>
    </GeneralSettingsSection>
  );
};

export default MapsSection;
