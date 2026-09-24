/*
 * @agents Shop general settings: home toggles, franchise locator, catalog, checkout, loyalty.
 */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Text, TextInput, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import css from '@controleonline/ui-orders/src/react/css/orders';
import {
  getEnabledShopHomeOptions,
  normalizeBooleanConfig,
  normalizeShopCatalogProductTypes,
  normalizeShopMoneyConfig,
  normalizeShopPrimaryEntry,
  normalizeShopTextConfig,
  SHOP_BOTTOM_BAR_ENABLED_CONFIG_KEY,
  SHOP_CATALOG_DEFAULT_PRODUCT_TYPES,
  SHOP_CATALOG_PRODUCT_TYPES_CONFIG_KEY,
  SHOP_CHARGE_ON_DELIVERY_ENABLED_CONFIG_KEY,
  SHOP_DELIVERY_FEE_ENABLED_CONFIG_KEY,
  SHOP_DELIVERY_FEE_VALUE_CONFIG_KEY,
  SHOP_FRANCHISE_LOCATOR_ENABLED_CONFIG_KEY,
  SHOP_GOOGLE_MAPS_API_KEY_CONFIG_KEY,
  SHOP_HOME_OPTION_FRANCHISE_LOCATOR,
  SHOP_HOME_OPTION_LOYALTY,
  SHOP_HOME_OPTION_SALES,
  SHOP_LOYALTY_COUPONS_ENABLED_CONFIG_KEY,
  SHOP_PRIMARY_ENTRY_CONFIG_KEY,
  SHOP_SALES_PAGE_ENABLED_CONFIG_KEY,
  saveAndUpdateConfigValue,
  toggleAndSaveBooleanConfig,
} from '@controleonline/ui-common/src/react/utils/shopConfig';
import {
  useGeneralSettingsPalette,
  useGeneralSettingsStyles,
} from '../GeneralSettings.styles';
import GeneralSettingsSection from '../GeneralSettingsSection';
import {useGeneralSettingsConfig} from '../GeneralSettings.shared';
import {ConfigToggleRow} from './shop/shopSettingsShared';
import ShopFranchiseLocatorSection from './shop/ShopFranchiseLocatorSection';
import ShopLoyaltySection from './shop/ShopLoyaltySection';

const SHOP_HOME_OPTIONS = [
  {
    key: SHOP_HOME_OPTION_SALES,
    label: 'Pagina de vendas',
    description:
      'Libera a vitrine principal do shop para navegacao por categorias e produtos.',
  },
  {
    key: SHOP_HOME_OPTION_FRANCHISE_LOCATOR,
    label: 'Localizador de franquias',
    description:
      'Libera a entrada do shop focada em encontrar unidades ou franquias.',
  },
  {
    key: SHOP_HOME_OPTION_LOYALTY,
    label: 'Cartao fidelidade',
    description:
      'Libera a entrada do shop para acompanhar a fidelidade e os brindes.',
  },
];

const SHOP_CATALOG_PRODUCT_TYPE_OPTIONS = [
  {
    key: 'product',
    label: 'Produtos',
    description: 'Exibe produtos simples no cardapio do shop.',
  },
  {
    key: 'manufactured',
    label: 'Produtos fabricados',
    description: 'Exibe itens produzidos ou montados pela loja.',
  },
  {
    key: 'custom',
    label: 'Produtos customizaveis',
    description: 'Exibe itens com grupos de complementos e variacoes.',
  },
  {
    key: 'service',
    label: 'Servicos',
    description: 'Exibe servicos quando a loja opera como shop de servicos.',
  },
];

const ShopSection = () => {
  const {globalStyles} = css();
  const localStyles = useGeneralSettingsStyles();
  const {
    currentCompany,
    defaultCompanyLabel,
    effectiveCompanyConfigs,
    isMainCompanySelected,
    saveConfig,
    saveConfigs,
  } = useGeneralSettingsConfig();
  const themePalette = useGeneralSettingsPalette();

  const [salesPageEnabled, setSalesPageEnabled] = useState(false);
  const [franchiseLocatorEnabled, setFranchiseLocatorEnabled] = useState(false);
  const [bottomBarEnabled, setBottomBarEnabled] = useState(false);
  const [chargeOnDeliveryEnabled, setChargeOnDeliveryEnabled] = useState(false);
  const [deliveryFeeEnabled, setDeliveryFeeEnabled] = useState(false);
  const [deliveryFeeValue, setDeliveryFeeValue] = useState('');
  const [catalogProductTypes, setCatalogProductTypes] = useState(
    SHOP_CATALOG_DEFAULT_PRODUCT_TYPES,
  );
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState('');
  const [primaryEntry, setPrimaryEntry] = useState('');
  const [loyaltyCouponsEnabled, setLoyaltyCouponsEnabled] = useState(false);

  useEffect(() => {
    const nextSalesPageEnabled = normalizeBooleanConfig(
      effectiveCompanyConfigs[SHOP_SALES_PAGE_ENABLED_CONFIG_KEY],
    );
    const nextFranchiseLocatorEnabled = normalizeBooleanConfig(
      effectiveCompanyConfigs[SHOP_FRANCHISE_LOCATOR_ENABLED_CONFIG_KEY],
    );
    const nextLoyaltyCouponsEnabled = normalizeBooleanConfig(
      effectiveCompanyConfigs[SHOP_LOYALTY_COUPONS_ENABLED_CONFIG_KEY],
    );
    setSalesPageEnabled(nextSalesPageEnabled);
    setFranchiseLocatorEnabled(nextFranchiseLocatorEnabled);
    setBottomBarEnabled(
      normalizeBooleanConfig(
        effectiveCompanyConfigs[SHOP_BOTTOM_BAR_ENABLED_CONFIG_KEY],
      ),
    );
    setChargeOnDeliveryEnabled(
      normalizeBooleanConfig(
        effectiveCompanyConfigs[SHOP_CHARGE_ON_DELIVERY_ENABLED_CONFIG_KEY],
      ),
    );
    setDeliveryFeeEnabled(
      normalizeBooleanConfig(
        effectiveCompanyConfigs[SHOP_DELIVERY_FEE_ENABLED_CONFIG_KEY],
      ),
    );
    setDeliveryFeeValue(
      String(
        normalizeShopMoneyConfig(
          effectiveCompanyConfigs[SHOP_DELIVERY_FEE_VALUE_CONFIG_KEY],
        ) || '',
      ),
    );
    setCatalogProductTypes(
      normalizeShopCatalogProductTypes(
        effectiveCompanyConfigs[SHOP_CATALOG_PRODUCT_TYPES_CONFIG_KEY],
      ),
    );
    setGoogleMapsApiKey(
      normalizeShopTextConfig(
        effectiveCompanyConfigs[SHOP_GOOGLE_MAPS_API_KEY_CONFIG_KEY],
      ),
    );
    setLoyaltyCouponsEnabled(nextLoyaltyCouponsEnabled);
    setPrimaryEntry(
      normalizeShopPrimaryEntry(
        effectiveCompanyConfigs[SHOP_PRIMARY_ENTRY_CONFIG_KEY],
        {
          salesPageEnabled: nextSalesPageEnabled,
          franchiseLocatorEnabled: nextFranchiseLocatorEnabled,
          loyaltyCouponsEnabled: nextLoyaltyCouponsEnabled,
        },
      ),
    );
  }, [effectiveCompanyConfigs]);

  useEffect(() => {
    const nextPrimaryEntry = normalizeShopPrimaryEntry(primaryEntry, {
      salesPageEnabled,
      franchiseLocatorEnabled,
      loyaltyCouponsEnabled,
    });
    if (nextPrimaryEntry === primaryEntry) {
      return;
    }
    setPrimaryEntry(nextPrimaryEntry);
    saveConfig(SHOP_PRIMARY_ENTRY_CONFIG_KEY, nextPrimaryEntry).catch(() => {});
  }, [
    franchiseLocatorEnabled,
    loyaltyCouponsEnabled,
    primaryEntry,
    salesPageEnabled,
    saveConfig,
  ]);

  const enabledHomeOptions = useMemo(
    () =>
      getEnabledShopHomeOptions({
        salesPageEnabled,
        franchiseLocatorEnabled,
        loyaltyCouponsEnabled,
      }),
    [franchiseLocatorEnabled, loyaltyCouponsEnabled, salesPageEnabled],
  );

  const primaryEntryOptions = useMemo(
    () =>
      SHOP_HOME_OPTIONS.filter(option =>
        enabledHomeOptions.includes(option.key),
      ),
    [enabledHomeOptions],
  );

  const toggleCatalogProductType = useCallback(
    typeKey => {
      const nextTypes = catalogProductTypes.includes(typeKey)
        ? catalogProductTypes.filter(item => item !== typeKey)
        : [...catalogProductTypes, typeKey];
      const normalized = nextTypes.length
        ? nextTypes
        : SHOP_CATALOG_DEFAULT_PRODUCT_TYPES;
      saveAndUpdateConfigValue({
        configKey: SHOP_CATALOG_PRODUCT_TYPES_CONFIG_KEY,
        nextValue: normalized,
        saveConfig,
        setValue: setCatalogProductTypes,
      });
    },
    [catalogProductTypes, saveConfig],
  );

  if (!isMainCompanySelected) {
    return (
      <GeneralSettingsSection
        description="Centraliza a configuracao da home do shop e das franquias visiveis no localizador."
        icon="shopping-bag"
        iconBackgroundColor={themePalette.cardIconBackground}
        iconColor={themePalette.cardIconColor}
        title="Home do shop">
        <View style={localStyles.emptyBox}>
          <Text style={localStyles.emptyTitle}>Disponivel na empresa principal</Text>
          <Text style={localStyles.emptyText}>
            Selecione a empresa principal ({defaultCompanyLabel}) para configurar o shop.
          </Text>
        </View>
      </GeneralSettingsSection>
    );
  }

  return (
    <>
      <GeneralSettingsSection
        description="Centraliza a configuracao da home do shop e das franquias visiveis no localizador."
        icon="shopping-bag"
        iconBackgroundColor={themePalette.cardIconBackground}
        iconColor={themePalette.cardIconColor}
        title="Home do shop">
        <ConfigToggleRow
          label="Pagina de vendas"
          description="Libera a vitrine principal do shop."
          palette={themePalette}
          styles={localStyles}
          value={salesPageEnabled}
          onToggle={() =>
            toggleAndSaveBooleanConfig({
              configKey: SHOP_SALES_PAGE_ENABLED_CONFIG_KEY,
              nextValue: !salesPageEnabled,
              saveConfig,
              setValue: setSalesPageEnabled,
            })
          }
        />
        <ConfigToggleRow
          label="Localizador de franquias"
          description="Libera a entrada do shop focada em encontrar unidades ou franquias."
          palette={themePalette}
          styles={localStyles}
          value={franchiseLocatorEnabled}
          onToggle={() =>
            toggleAndSaveBooleanConfig({
              configKey: SHOP_FRANCHISE_LOCATOR_ENABLED_CONFIG_KEY,
              nextValue: !franchiseLocatorEnabled,
              saveConfig,
              setValue: setFranchiseLocatorEnabled,
            })
          }
        />
        <ConfigToggleRow
          label="Cartao fidelidade"
          description="Libera a entrada do shop para acompanhar a fidelidade e os brindes."
          palette={themePalette}
          styles={localStyles}
          value={loyaltyCouponsEnabled}
          onToggle={() =>
            toggleAndSaveBooleanConfig({
              configKey: SHOP_LOYALTY_COUPONS_ENABLED_CONFIG_KEY,
              nextValue: !loyaltyCouponsEnabled,
              saveConfig,
              setValue: setLoyaltyCouponsEnabled,
            })
          }
        />
        <ConfigToggleRow
          label="Barra inferior do shop"
          description="Exibe a navegacao inferior nas telas do shop."
          palette={themePalette}
          styles={localStyles}
          value={bottomBarEnabled}
          onToggle={() =>
            toggleAndSaveBooleanConfig({
              configKey: SHOP_BOTTOM_BAR_ENABLED_CONFIG_KEY,
              nextValue: !bottomBarEnabled,
              saveConfig,
              setValue: setBottomBarEnabled,
            })
          }
        />
        <View style={localStyles.fieldBlock}>
          <Text style={localStyles.fieldLabel}>Entrada principal</Text>
          {primaryEntryOptions.length === 0 ? (
            <Text style={localStyles.helperText}>
              Ative ao menos uma opcao da home para definir a entrada principal.
            </Text>
          ) : (
            primaryEntryOptions.map(option => {
              const selected = primaryEntry === option.key;
              const locked = primaryEntryOptions.length === 1;
              return (
                <TouchableOpacity
                  key={`shop-primary-entry-${option.key}`}
                  style={[
                    localStyles.printerItem,
                    selected && localStyles.printerItemActive,
                  ]}
                  activeOpacity={0.85}
                  disabled={locked}
                  onPress={() => {
                    if (locked || selected) return;
                    saveAndUpdateConfigValue({
                      configKey: SHOP_PRIMARY_ENTRY_CONFIG_KEY,
                      nextValue: option.key,
                      saveConfig,
                      setValue: setPrimaryEntry,
                    });
                  }}>
                  <Icon
                    name={selected ? 'check-circle' : 'radio-button-unchecked'}
                    size={20}
                    color={
                      selected ? themePalette.iconActive : themePalette.iconDisabled
                    }
                  />
                  <View style={localStyles.printerCopy}>
                    <Text style={localStyles.printerName}>{option.label}</Text>
                    <Text style={localStyles.printerDevice}>{option.description}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
        <View style={localStyles.fieldBlock}>
          <Text style={localStyles.fieldLabel}>Google Maps API Key</Text>
          <TextInput
            value={googleMapsApiKey}
            onChangeText={setGoogleMapsApiKey}
            onBlur={() =>
              saveAndUpdateConfigValue({
                configKey: SHOP_GOOGLE_MAPS_API_KEY_CONFIG_KEY,
                nextValue: googleMapsApiKey,
                saveConfig,
                setValue: setGoogleMapsApiKey,
              })
            }
            placeholder="Chave da API do Google Maps"
            placeholderTextColor={themePalette.inputPlaceholderText}
            style={localStyles.input}
          />
        </View>
        <ShopFranchiseLocatorSection
          currentCompanyId={currentCompany?.id}
          effectiveCompanyConfigs={effectiveCompanyConfigs}
          localStyles={localStyles}
          saveConfigs={saveConfigs}
          themePalette={themePalette}
          globalStyles={globalStyles}
        />
      </GeneralSettingsSection>

      <GeneralSettingsSection
        description="Define quais tipos de itens aparecem no cardapio."
        icon="category"
        iconBackgroundColor={themePalette.cardIconBackground}
        iconColor={themePalette.cardIconColor}
        title="Catalogo do shop">
        <View style={localStyles.printerList}>
          {SHOP_CATALOG_PRODUCT_TYPE_OPTIONS.map(option => {
            const selected = catalogProductTypes.includes(option.key);
            return (
              <TouchableOpacity
                key={`shop-catalog-type-${option.key}`}
                style={[
                  localStyles.printerItem,
                  selected && localStyles.printerItemActive,
                ]}
                activeOpacity={0.85}
                onPress={() => toggleCatalogProductType(option.key)}>
                <Icon
                  name={selected ? 'check-circle' : 'radio-button-unchecked'}
                  size={20}
                  color={
                    selected ? themePalette.iconActive : themePalette.iconDisabled
                  }
                />
                <View style={localStyles.printerCopy}>
                  <Text style={localStyles.printerName}>{option.label}</Text>
                  <Text style={localStyles.printerDevice}>{option.description}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </GeneralSettingsSection>

      <GeneralSettingsSection
        description="Opcoes de pagamento e taxa no checkout do shop."
        icon="point-of-sale"
        iconBackgroundColor={themePalette.cardIconBackground}
        iconColor={themePalette.cardIconColor}
        title="Checkout do shop">
        <ConfigToggleRow
          label="Cobrar na entrega"
          description="Libera registrar pedidos pagos manualmente na entrega."
          palette={themePalette}
          styles={localStyles}
          value={chargeOnDeliveryEnabled}
          onToggle={() =>
            toggleAndSaveBooleanConfig({
              configKey: SHOP_CHARGE_ON_DELIVERY_ENABLED_CONFIG_KEY,
              nextValue: !chargeOnDeliveryEnabled,
              saveConfig,
              setValue: setChargeOnDeliveryEnabled,
            })
          }
        />
        <ConfigToggleRow
          label="Taxa de entrega"
          description="Habilita cobranca de taxa de entrega no checkout."
          palette={themePalette}
          styles={localStyles}
          value={deliveryFeeEnabled}
          onToggle={() =>
            toggleAndSaveBooleanConfig({
              configKey: SHOP_DELIVERY_FEE_ENABLED_CONFIG_KEY,
              nextValue: !deliveryFeeEnabled,
              saveConfig,
              setValue: setDeliveryFeeEnabled,
            })
          }
        />
        {deliveryFeeEnabled ? (
          <View style={localStyles.fieldBlock}>
            <Text style={localStyles.fieldLabel}>Valor da taxa de entrega</Text>
            <TextInput
              value={deliveryFeeValue}
              onChangeText={setDeliveryFeeValue}
              onBlur={() =>
                saveAndUpdateConfigValue({
                  configKey: SHOP_DELIVERY_FEE_VALUE_CONFIG_KEY,
                  nextValue: deliveryFeeValue,
                  saveConfig,
                  setValue: setDeliveryFeeValue,
                })
              }
              keyboardType="decimal-pad"
              placeholder="0,00"
              placeholderTextColor={themePalette.inputPlaceholderText}
              style={localStyles.input}
            />
          </View>
        ) : null}
      </GeneralSettingsSection>

      <ShopLoyaltySection
        effectiveCompanyConfigs={effectiveCompanyConfigs}
        localStyles={localStyles}
        saveConfig={saveConfig}
        themePalette={themePalette}
        globalStyles={globalStyles}
        currentCompanyId={currentCompany?.id}
        loyaltyCouponsEnabled={loyaltyCouponsEnabled}
        setLoyaltyCouponsEnabled={setLoyaltyCouponsEnabled}
      />
    </>
  );
};

export default ShopSection;
