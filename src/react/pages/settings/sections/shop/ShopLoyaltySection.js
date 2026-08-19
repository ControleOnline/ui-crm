/*
 * @agents Loyalty coupons settings for shop general settings.
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
  normalizeBooleanConfig,
  normalizeShopLoyaltyRequiredSales,
  normalizeShopProductId,
  normalizeShopProductIds,
  SHOP_LOYALTY_COUPONS_ENABLED_CONFIG_KEY,
  SHOP_LOYALTY_GIFT_PRODUCT_ID_CONFIG_KEY,
  SHOP_LOYALTY_PRODUCT_IDS_CONFIG_KEY,
  SHOP_LOYALTY_REQUIRED_SALES_CONFIG_KEY,
  saveAndUpdateConfigValue,
  toggleAndSaveBooleanConfig,
} from '@controleonline/ui-common/src/react/utils/shopConfig';
import GeneralSettingsSection from '../GeneralSettingsSection';
import {
  ConfigToggleRow,
  SelectionModal,
  resolveProductLabel,
  resolveProductMeta,
  useShopProductBrowser,
  useShopProductSearch,
} from './shopSettingsShared';

const ShopLoyaltySection = ({
  effectiveCompanyConfigs,
  localStyles,
  saveConfig,
  themePalette,
  globalStyles,
  currentCompanyId,
  loyaltyCouponsEnabled,
  setLoyaltyCouponsEnabled,
}) => {
  const productActions = useStore('products').actions;
  const [loyaltyRequiredSales, setLoyaltyRequiredSales] = useState('');
  const [loyaltyProductIds, setLoyaltyProductIds] = useState([]);
  const [loyaltyGiftProductId, setLoyaltyGiftProductId] = useState('');
  const [selectedLoyaltyProducts, setSelectedLoyaltyProducts] = useState([]);
  const [selectedGiftProduct, setSelectedGiftProduct] = useState(null);
  const [isHydratingLoyaltyProducts, setIsHydratingLoyaltyProducts] = useState(false);
  const [isHydratingGiftProduct, setIsHydratingGiftProduct] = useState(false);
  const [loyaltySelectorVisible, setLoyaltySelectorVisible] = useState(false);
  const [giftSelectorVisible, setGiftSelectorVisible] = useState(false);

  const loyaltyBrowser = useShopProductBrowser({
    companyId: currentCompanyId,
    visible: loyaltySelectorVisible,
  });
  const giftBrowser = useShopProductBrowser({
    companyId: currentCompanyId,
    visible: giftSelectorVisible,
  });
  const loyaltySearch = useShopProductSearch(currentCompanyId);
  const giftSearch = useShopProductSearch(currentCompanyId);

  useEffect(() => {
    setLoyaltyCouponsEnabled(
      normalizeBooleanConfig(
        effectiveCompanyConfigs?.[SHOP_LOYALTY_COUPONS_ENABLED_CONFIG_KEY],
      ),
    );
    setLoyaltyRequiredSales(
      String(
        normalizeShopLoyaltyRequiredSales(
          effectiveCompanyConfigs?.[SHOP_LOYALTY_REQUIRED_SALES_CONFIG_KEY],
        ) || '',
      ),
    );
    setLoyaltyProductIds(
      normalizeShopProductIds(
        effectiveCompanyConfigs?.[SHOP_LOYALTY_PRODUCT_IDS_CONFIG_KEY],
      ),
    );
    setLoyaltyGiftProductId(
      normalizeShopProductId(
        effectiveCompanyConfigs?.[SHOP_LOYALTY_GIFT_PRODUCT_ID_CONFIG_KEY],
      ),
    );
  }, [effectiveCompanyConfigs, setLoyaltyCouponsEnabled]);

  useEffect(() => {
    if (loyaltyProductIds.length === 0) {
      setSelectedLoyaltyProducts([]);
      setIsHydratingLoyaltyProducts(false);
      return;
    }
    let cancelled = false;
    setIsHydratingLoyaltyProducts(true);
    Promise.all(
      loyaltyProductIds.map(async productId => {
        try {
          return await productActions.get(productId);
        } catch {
          return {id: productId};
        }
      }),
    )
      .then(items => {
        if (cancelled) return;
        setSelectedLoyaltyProducts(
          items.filter(Boolean).sort((left, right) => {
            const leftIndex = loyaltyProductIds.indexOf(
              normalizeShopProductId(left),
            );
            const rightIndex = loyaltyProductIds.indexOf(
              normalizeShopProductId(right),
            );
            return leftIndex - rightIndex;
          }),
        );
      })
      .finally(() => {
        if (!cancelled) setIsHydratingLoyaltyProducts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loyaltyProductIds, productActions]);

  useEffect(() => {
    if (!loyaltyGiftProductId) {
      setSelectedGiftProduct(null);
      setIsHydratingGiftProduct(false);
      return;
    }
    let cancelled = false;
    setIsHydratingGiftProduct(true);
    productActions
      .get(loyaltyGiftProductId)
      .then(item => {
        if (!cancelled) setSelectedGiftProduct(item || {id: loyaltyGiftProductId});
      })
      .catch(() => {
        if (!cancelled) setSelectedGiftProduct({id: loyaltyGiftProductId});
      })
      .finally(() => {
        if (!cancelled) setIsHydratingGiftProduct(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loyaltyGiftProductId, productActions]);

  const loyaltySelectedIds = useMemo(
    () => new Set(loyaltyProductIds),
    [loyaltyProductIds],
  );
  const visibleLoyaltyResults = useMemo(
    () =>
      loyaltySearch.results.filter(
        product => !loyaltySelectedIds.has(normalizeShopProductId(product)),
      ),
    [loyaltySearch.results, loyaltySelectedIds],
  );
  const visibleGiftResults = useMemo(
    () =>
      giftSearch.results.filter(
        product =>
          normalizeShopProductId(product) !==
          normalizeShopProductId(selectedGiftProduct),
      ),
    [giftSearch.results, selectedGiftProduct],
  );

  const toggleLoyaltyProduct = useCallback(
    product => {
      const productId = normalizeShopProductId(product);
      if (!productId) return;
      const nextProductIds = loyaltyProductIds.includes(productId)
        ? loyaltyProductIds.filter(item => item !== productId)
        : [...loyaltyProductIds, productId];
      saveAndUpdateConfigValue({
        configKey: SHOP_LOYALTY_PRODUCT_IDS_CONFIG_KEY,
        nextValue: nextProductIds,
        saveConfig,
        setValue: setLoyaltyProductIds,
      });
    },
    [loyaltyProductIds, saveConfig],
  );

  const selectGiftProduct = useCallback(
    product => {
      const productId = normalizeShopProductId(product);
      saveAndUpdateConfigValue({
        configKey: SHOP_LOYALTY_GIFT_PRODUCT_ID_CONFIG_KEY,
        nextValue: productId,
        saveConfig,
        setValue: setLoyaltyGiftProductId,
      });
      setGiftSelectorVisible(false);
    },
    [saveConfig],
  );

  const clearGiftProduct = useCallback(() => {
    saveAndUpdateConfigValue({
      configKey: SHOP_LOYALTY_GIFT_PRODUCT_ID_CONFIG_KEY,
      nextValue: '',
      saveConfig,
      setValue: setLoyaltyGiftProductId,
    });
  }, [saveConfig]);

  return (
    <>
      <GeneralSettingsSection
        description="Configure produtos participantes, meta de vendas e brinde do cartao fidelidade."
        icon="card-giftcard"
        iconBackgroundColor={themePalette.cardIconBackground}
        iconColor={themePalette.cardIconColor}
        title="Cupons de fidelidade">
        <ConfigToggleRow
          label="Cupons de fidelidade"
          description="Ativa o programa de fidelidade no shop."
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
        <View style={localStyles.fieldBlock}>
          <Text style={localStyles.fieldLabel}>Vendas necessarias</Text>
          <TextInput
            value={loyaltyRequiredSales}
            onChangeText={setLoyaltyRequiredSales}
            onBlur={() =>
              saveAndUpdateConfigValue({
                configKey: SHOP_LOYALTY_REQUIRED_SALES_CONFIG_KEY,
                nextValue: loyaltyRequiredSales,
                saveConfig,
                setValue: setLoyaltyRequiredSales,
              })
            }
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={themePalette.inputPlaceholderText}
            style={localStyles.input}
          />
        </View>
        <View style={localStyles.fieldBlock}>
          <Text style={localStyles.fieldLabel}>Produtos participantes</Text>
          <View style={localStyles.selectorRow}>
            <TextInput
              value={loyaltySearch.query}
              onChangeText={loyaltySearch.setQuery}
              placeholder="Buscar produto participante..."
              placeholderTextColor={themePalette.inputPlaceholderText}
              style={[localStyles.input, localStyles.selectorInput]}
            />
            <TouchableOpacity
              style={localStyles.selectorListButton}
              activeOpacity={0.85}
              onPress={() => setLoyaltySelectorVisible(true)}>
              <Icon name="view-list" size={18} color={themePalette.buttonIcon} />
              <Text style={localStyles.selectorListButtonText}>Lista</Text>
            </TouchableOpacity>
          </View>
          {isHydratingLoyaltyProducts || loyaltySearch.isLoading ? (
            <ActivityIndicator
              size="small"
              color={themePalette.loadingSpinner}
              style={localStyles.sectionLoader}
            />
          ) : null}
          <View style={localStyles.printerList}>
            {selectedLoyaltyProducts.map(product => {
              const productId = normalizeShopProductId(product);
              return (
                <TouchableOpacity
                  key={`shop-loyalty-selected-${productId}`}
                  style={[localStyles.printerItem, localStyles.printerItemActive]}
                  activeOpacity={0.85}
                  onPress={() => toggleLoyaltyProduct(product)}>
                  <Icon name="remove-circle-outline" size={20} color={themePalette.iconDanger} />
                  <View style={localStyles.printerCopy}>
                    <Text style={localStyles.printerName}>{resolveProductLabel(product)}</Text>
                    <Text style={localStyles.printerDevice}>
                      {resolveProductMeta(product) || 'Toque para remover'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            {visibleLoyaltyResults.map(product => {
              const productId = normalizeShopProductId(product);
              return (
                <TouchableOpacity
                  key={`shop-loyalty-search-${productId}`}
                  style={localStyles.printerItem}
                  activeOpacity={0.85}
                  onPress={() => toggleLoyaltyProduct(product)}>
                  <Icon name="inventory-2" size={20} color={themePalette.cardIconColor} />
                  <View style={localStyles.printerCopy}>
                    <Text style={localStyles.printerName}>{resolveProductLabel(product)}</Text>
                    <Text style={localStyles.printerDevice}>
                      {resolveProductMeta(product) || 'Toque para incluir'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <View style={localStyles.fieldBlock}>
          <Text style={localStyles.fieldLabel}>Produto brinde</Text>
          <View style={localStyles.selectorRow}>
            <TextInput
              value={giftSearch.query}
              onChangeText={giftSearch.setQuery}
              placeholder="Buscar produto brinde..."
              placeholderTextColor={themePalette.inputPlaceholderText}
              style={[localStyles.input, localStyles.selectorInput]}
            />
            <TouchableOpacity
              style={localStyles.selectorListButton}
              activeOpacity={0.85}
              onPress={() => setGiftSelectorVisible(true)}>
              <Icon name="view-list" size={18} color={themePalette.buttonIcon} />
              <Text style={localStyles.selectorListButtonText}>Lista</Text>
            </TouchableOpacity>
          </View>
          {isHydratingGiftProduct ? (
            <ActivityIndicator
              size="small"
              color={themePalette.loadingSpinner}
              style={localStyles.sectionLoader}
            />
          ) : selectedGiftProduct ? (
            <TouchableOpacity
              style={[localStyles.printerItem, localStyles.printerItemActive]}
              activeOpacity={0.85}
              onPress={clearGiftProduct}>
              <Icon name="remove-circle-outline" size={20} color={themePalette.iconDanger} />
              <View style={localStyles.printerCopy}>
                <Text style={localStyles.printerName}>
                  {resolveProductLabel(selectedGiftProduct)}
                </Text>
                <Text style={localStyles.printerDevice}>Toque para limpar</Text>
              </View>
            </TouchableOpacity>
          ) : null}
          <View style={localStyles.printerList}>
            {visibleGiftResults.map(product => {
              const productId = normalizeShopProductId(product);
              return (
                <TouchableOpacity
                  key={`shop-gift-search-${productId}`}
                  style={localStyles.printerItem}
                  activeOpacity={0.85}
                  onPress={() => selectGiftProduct(product)}>
                  <Icon name="card-giftcard" size={20} color={themePalette.cardIconColor} />
                  <View style={localStyles.printerCopy}>
                    <Text style={localStyles.printerName}>{resolveProductLabel(product)}</Text>
                    <Text style={localStyles.printerDevice}>Toque para selecionar</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </GeneralSettingsSection>

      <SelectionModal
        visible={loyaltySelectorVisible}
        title="Selecionar produtos participantes"
        helperText="Toque nos produtos que contam para a fidelidade."
        browser={loyaltyBrowser}
        globalStyles={globalStyles}
        onClose={() => setLoyaltySelectorVisible(false)}
        onSelect={toggleLoyaltyProduct}
        selectedIds={new Set(loyaltyProductIds)}
        emptyIconName="inventory-2"
        emptyTitle="Nenhum produto encontrado"
        emptyText="Tente outro termo para localizar um produto existente."
        resolveItemId={normalizeShopProductId}
        resolveItemLabel={resolveProductLabel}
        resolveItemMeta={product => resolveProductMeta(product) || 'Toque para selecionar'}
        palette={themePalette}
        searchPlaceholder="Pesquisar produto..."
        selectionMeta={() => 'Participa da fidelidade'}
        styles={localStyles}
      />
      <SelectionModal
        visible={giftSelectorVisible}
        title="Selecionar produto brinde"
        helperText="Toque em um produto existente para defini-lo como brinde."
        browser={giftBrowser}
        globalStyles={globalStyles}
        onClose={() => setGiftSelectorVisible(false)}
        onSelect={selectGiftProduct}
        selectedItemId={loyaltyGiftProductId}
        emptyIconName="inventory-2"
        emptyTitle="Nenhum produto encontrado"
        emptyText="Tente outro termo para localizar um produto existente."
        resolveItemId={normalizeShopProductId}
        resolveItemLabel={resolveProductLabel}
        resolveItemMeta={product => resolveProductMeta(product) || 'Toque para selecionar'}
        palette={themePalette}
        searchPlaceholder="Pesquisar produto..."
        selectionMeta={() => 'Selecionado como brinde'}
        styles={localStyles}
      />
    </>
  );
};

export default ShopLoyaltySection;
