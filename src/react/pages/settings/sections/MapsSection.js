/*
 * @agents This section controls map keys, shop primary entry (mapa vs vitrine)
 * and franchise-locator enablement for app_type=shop. Detailed franchise/address
 * visibility lists remain in the Shop tab (shared config keys).
 */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Text, TextInput, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {
  useGeneralSettingsPalette,
  useGeneralSettingsStyles,
} from '../GeneralSettings.styles';
import GeneralSettingsSection from '../GeneralSettingsSection';
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
  saveAndUpdateConfigValue,
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
  const {effectiveCompanyConfigs, saveConfig, saveConfigs} =
    useGeneralSettingsConfig();

  const [webGoogleMapsApiKey, setWebGoogleMapsApiKey] = useState('');
  const [androidGoogleMapsApiKey, setAndroidGoogleMapsApiKey] = useState('');
  const [salesPageEnabled, setSalesPageEnabled] = useState(false);
  const [franchiseLocatorEnabled, setFranchiseLocatorEnabled] = useState(false);
  const [primaryEntry, setPrimaryEntry] = useState('');

  useEffect(() => {
    const nextSettings = resolveGoogleMapsSettings(effectiveCompanyConfigs);
    setWebGoogleMapsApiKey(nextSettings.webGoogleMapsApiKey);
    setAndroidGoogleMapsApiKey(nextSettings.androidGoogleMapsApiKey);

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
  }, [effectiveCompanyConfigs]);

  const enabledHomeOptions = useMemo(
    () =>
      getEnabledShopHomeOptions({
        salesPageEnabled,
        franchiseLocatorEnabled,
        loyaltyCouponsEnabled: false,
      }),
    [franchiseLocatorEnabled, salesPageEnabled],
  );

  const primaryEntryOptions = useMemo(() => {
    return enabledHomeOptions
      .filter(
        option =>
          option === SHOP_HOME_OPTION_SALES ||
          option === SHOP_HOME_OPTION_FRANCHISE_LOCATOR,
      )
      .map(option => ({
        value: option,
        label: PRIMARY_ENTRY_LABELS[option] || option,
      }));
  }, [enabledHomeOptions]);

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
      description="Chaves do Google Maps, tela principal do shop (mapa de franquias vs vitrine) e ativação do localizador. Endereços por franquia (lat/long + visibilidade no mapa) usam a aba Shop e o formulário de endereço."
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
            Ativa o mapa das franquias como entrada do app_type=shop. Endereços
            ativos (com lat/long) são configurados na aba Shop.
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
          <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8}}>
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

      <Text style={localStyles.helperText}>
        Latitude/Longitude dos endereços: já persistidos na tabela de endereço
        (API) e no formulário DefaultAddress. Visibilidade por franquia no mapa:
        lista e toggles na aba Shop (mesmas chaves de config
        shop-franchise-visible-*).
      </Text>
    </GeneralSettingsSection>
  );
};

export default MapsSection;
