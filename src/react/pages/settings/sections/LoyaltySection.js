/*
 * @agents Loyalty (Fidelidade) tab in General Settings.
 * Product multi-select (participants) and single-select (gift).
 * refs: ControleOnline/ui-manager#12
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
import css from '@controleonline/ui-orders/src/react/css/orders';
import {useStore} from '@store';
import {
  SHOP_LOYALTY_COUPONS_ENABLED_CONFIG_KEY,
  SHOP_LOYALTY_GIFT_PRODUCT_ID_CONFIG_KEY,
  SHOP_LOYALTY_PRODUCT_IDS_CONFIG_KEY,
  SHOP_LOYALTY_REQUIRED_SALES_CONFIG_KEY,
  normalizeBooleanConfig,
  normalizeShopEntityId,
  normalizeShopEntityIds,
  normalizeShopLoyaltyRequiredSales,
  normalizeShopProductId,
  saveAndUpdateConfigValue,
} from '@controleonline/ui-common/src/react/utils/shopConfig';

import {
  useGeneralSettingsPalette,
  useGeneralSettingsStyles,
} from '../GeneralSettings.styles';
import GeneralSettingsSection from '../GeneralSettingsSection';
import {useGeneralSettingsConfig} from '../GeneralSettings.shared';
import {
  ProductSelectionModal,
  resolveProductLabel,
  resolveProductMeta,
  useProductBrowser,
} from './LoyaltyProductPicker';

const t = (type, key) => global.t?.t?.('configs', type, key);

const LoyaltySection = () => {
  const {globalStyles} = css();
  const palette = useGeneralSettingsPalette();
  const styles = useGeneralSettingsStyles();
  const {currentCompany, effectiveCompanyConfigs, saveConfig} =
    useGeneralSettingsConfig();
  const productActions = useStore('products').actions;

  const [enabled, setEnabled] = useState(false);
  const [requiredSales, setRequiredSales] = useState('');
  const [productIds, setProductIds] = useState([]);
  const [giftProductId, setGiftProductId] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedGiftProduct, setSelectedGiftProduct] = useState(null);
  const [isHydratingProducts, setIsHydratingProducts] = useState(false);
  const [isHydratingGift, setIsHydratingGift] = useState(false);
  const [participantsVisible, setParticipantsVisible] = useState(false);
  const [giftVisible, setGiftVisible] = useState(false);

  const participantsBrowser = useProductBrowser({
    companyId: currentCompany?.id,
    visible: participantsVisible,
  });
  const giftBrowser = useProductBrowser({
    companyId: currentCompany?.id,
    visible: giftVisible,
  });

  useEffect(() => {
    setEnabled(
      normalizeBooleanConfig(
        effectiveCompanyConfigs[SHOP_LOYALTY_COUPONS_ENABLED_CONFIG_KEY],
      ),
    );
    setRequiredSales(
      String(
        normalizeShopLoyaltyRequiredSales(
          effectiveCompanyConfigs[SHOP_LOYALTY_REQUIRED_SALES_CONFIG_KEY],
        ),
      ),
    );
    setProductIds(
      normalizeShopEntityIds(
        effectiveCompanyConfigs[SHOP_LOYALTY_PRODUCT_IDS_CONFIG_KEY],
      ),
    );
    setGiftProductId(
      normalizeShopEntityId(
        effectiveCompanyConfigs[SHOP_LOYALTY_GIFT_PRODUCT_ID_CONFIG_KEY],
      ),
    );
  }, [effectiveCompanyConfigs]);

  useEffect(() => {
    if (productIds.length === 0) {
      setSelectedProducts([]);
      setIsHydratingProducts(false);
      return undefined;
    }

    let cancelled = false;
    setIsHydratingProducts(true);

    Promise.all(
      productIds.map(async productId => {
        try {
          const product = await productActions.get(productId);
          return product || {id: productId};
        } catch {
          return {id: productId};
        }
      }),
    )
      .then(items => {
        if (!cancelled) {
          setSelectedProducts(
            items.filter(Boolean).sort((left, right) => {
              const leftIndex = productIds.indexOf(normalizeShopProductId(left));
              const rightIndex = productIds.indexOf(
                normalizeShopProductId(right),
              );
              return leftIndex - rightIndex;
            }),
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsHydratingProducts(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [productIds, productActions]);

  useEffect(() => {
    if (!giftProductId) {
      setSelectedGiftProduct(null);
      setIsHydratingGift(false);
      return undefined;
    }

    let cancelled = false;
    setIsHydratingGift(true);

    productActions
      .get(giftProductId)
      .then(product => {
        if (!cancelled) {
          setSelectedGiftProduct(product || {id: giftProductId});
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSelectedGiftProduct({id: giftProductId});
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsHydratingGift(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [giftProductId, productActions]);

  const selectedIdSet = useMemo(() => new Set(productIds), [productIds]);

  const toggleEnabled = () => {
    const nextValue = !enabled;
    setEnabled(nextValue);
    saveConfig(
      SHOP_LOYALTY_COUPONS_ENABLED_CONFIG_KEY,
      nextValue ? '1' : '0',
    );
  };

  const saveRequiredSales = value => {
    const normalizedValue = String(normalizeShopLoyaltyRequiredSales(value));
    setRequiredSales(normalizedValue);
    saveConfig(SHOP_LOYALTY_REQUIRED_SALES_CONFIG_KEY, normalizedValue);
  };

  const toggleParticipant = useCallback(
    product => {
      const productId = normalizeShopProductId(product);
      if (!productId) {
        return;
      }

      const nextProductIds = productIds.includes(productId)
        ? productIds.filter(item => item !== productId)
        : [...productIds, productId];

      saveAndUpdateConfigValue({
        configKey: SHOP_LOYALTY_PRODUCT_IDS_CONFIG_KEY,
        nextValue: nextProductIds,
        saveConfig,
        setValue: setProductIds,
      });
    },
    [productIds, saveConfig],
  );

  const selectGift = useCallback(
    product => {
      const productId = normalizeShopProductId(product);
      saveAndUpdateConfigValue({
        configKey: SHOP_LOYALTY_GIFT_PRODUCT_ID_CONFIG_KEY,
        nextValue: productId,
        saveConfig,
        setValue: setGiftProductId,
      });
      setGiftVisible(false);
    },
    [saveConfig],
  );

  const clearGift = useCallback(() => {
    saveAndUpdateConfigValue({
      configKey: SHOP_LOYALTY_GIFT_PRODUCT_ID_CONFIG_KEY,
      nextValue: '',
      saveConfig,
      setValue: setGiftProductId,
    });
  }, [saveConfig]);

  return (
    <>
      <GeneralSettingsSection
        description={t('description', 'loyalty')}
        icon="loyalty"
        iconBackgroundColor={palette.cardIconBackground}
        iconColor={palette.cardIconColor}
        title={t('title', 'loyalty')}>
        <View style={styles.settingRow}>
          <View style={{flex: 1}}>
            <Text style={styles.statusLabel}>
              {t('label', 'loyaltyEnabled')}
            </Text>
            <Text style={styles.helperText}>
              {t('description', 'loyaltyEnabled')}
            </Text>
          </View>
          <TouchableOpacity
            onPress={toggleEnabled}
            activeOpacity={0.85}
            style={[
              styles.statusChip,
              enabled ? styles.statusChipActive : styles.statusChipDisabled,
            ]}>
            <Icon
              name={enabled ? 'check-circle' : 'block'}
              size={16}
              color={
                enabled ? palette.badgeSelectedText : palette.badgeDisabledText
              }
            />
            <Text
              style={[
                styles.statusChipText,
                {
                  color: enabled
                    ? palette.badgeSelectedText
                    : palette.badgeDisabledText,
                },
              ]}>
              {enabled ? t('status', 'active') : t('status', 'inactive')}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.statusLabel}>
          {t('label', 'loyaltyRequiredSales')}
        </Text>
        <TextInput
          keyboardType="numeric"
          onBlur={() => saveRequiredSales(requiredSales)}
          onChangeText={setRequiredSales}
          style={styles.selectionSearchInput}
          value={requiredSales}
        />

        <View style={[styles.fieldBlock, {marginTop: 14}]}>
          <Text style={styles.fieldLabel}>
            {t('label', 'loyaltyProducts') || 'Produtos participantes'}
          </Text>
          <Text style={styles.helperText}>
            {t('message', 'loyaltyProductsSummary') || 'Resumo:'}{' '}
            {productIds.length}
          </Text>
          <TouchableOpacity
            style={[
              styles.selectorListButton,
              {marginTop: 8, alignSelf: 'flex-start'},
            ]}
            activeOpacity={0.85}
            onPress={() => setParticipantsVisible(true)}>
            <Icon name="view-list" size={18} color={palette.buttonIcon} />
            <Text style={styles.selectorListButtonText}>
              Selecionar produtos
            </Text>
          </TouchableOpacity>

          {isHydratingProducts ? (
            <ActivityIndicator
              size="small"
              color={palette.loadingSpinner}
              style={styles.sectionLoader}
            />
          ) : selectedProducts.length === 0 ? (
            <View style={[styles.emptyBox, {marginTop: 10}]}>
              <Text style={styles.emptyTitle}>Lista de participantes vazia</Text>
              <Text style={styles.emptyText}>
                Os produtos escolhidos aparecerão aqui para remoção rápida.
              </Text>
            </View>
          ) : (
            <View style={[styles.printerList, {marginTop: 10}]}>
              {selectedProducts.map(product => {
                const productId = normalizeShopProductId(product);
                return (
                  <TouchableOpacity
                    key={`loyalty-selected-${productId}`}
                    style={[styles.printerItem, styles.printerItemActive]}
                    activeOpacity={0.85}
                    onPress={() => toggleParticipant(product)}>
                    <Icon
                      name="remove-circle-outline"
                      size={20}
                      color={palette.iconDanger}
                    />
                    <View style={styles.printerCopy}>
                      <Text style={styles.printerName}>
                        {resolveProductLabel(product)}
                      </Text>
                      <Text style={styles.printerDevice}>
                        {resolveProductMeta(product) || 'Toque para remover'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={[styles.fieldBlock, {marginTop: 14}]}>
          <Text style={styles.fieldLabel}>
            {t('message', 'loyaltyGiftProduct') || 'Produto brinde'}
          </Text>
          <Text style={styles.helperText}>
            Escolha o produto entregue ao atingir a meta de vendas.
          </Text>
          <View style={[styles.selectorRow, {marginTop: 8}]}>
            <TouchableOpacity
              style={[styles.selectorListButton, {alignSelf: 'flex-start'}]}
              activeOpacity={0.85}
              onPress={() => setGiftVisible(true)}>
              <Icon name="view-list" size={18} color={palette.buttonIcon} />
              <Text style={styles.selectorListButtonText}>
                Selecionar brinde
              </Text>
            </TouchableOpacity>
            {giftProductId ? (
              <TouchableOpacity
                style={[styles.selectorListButton, {marginLeft: 8}]}
                activeOpacity={0.85}
                onPress={clearGift}>
                <Icon name="clear" size={18} color={palette.iconDanger} />
                <Text style={styles.selectorListButtonText}>Limpar</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {isHydratingGift ? (
            <ActivityIndicator
              size="small"
              color={palette.loadingSpinner}
              style={styles.sectionLoader}
            />
          ) : selectedGiftProduct ? (
            <View style={[styles.printerList, {marginTop: 10}]}>
              <View style={[styles.printerItem, styles.printerItemActive]}>
                <Icon
                  name="card-giftcard"
                  size={20}
                  color={palette.iconActive}
                />
                <View style={styles.printerCopy}>
                  <Text style={styles.printerName}>
                    {resolveProductLabel(selectedGiftProduct)}
                  </Text>
                  <Text style={styles.printerDevice}>
                    {resolveProductMeta(selectedGiftProduct) ||
                      `ID ${giftProductId}`}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={[styles.emptyBox, {marginTop: 10}]}>
              <Text style={styles.emptyTitle}>Nenhum brinde definido</Text>
              <Text style={styles.emptyText}>
                {t('message', 'loyaltyGiftProduct')} -
              </Text>
            </View>
          )}
        </View>
      </GeneralSettingsSection>

      <ProductSelectionModal
        visible={participantsVisible}
        title="Selecionar produtos participantes"
        helperText="Toque nos produtos para adicionar ou remover da regra de fidelidade."
        browser={participantsBrowser}
        onClose={() => setParticipantsVisible(false)}
        onSelect={toggleParticipant}
        selectedIds={selectedIdSet}
        multiSelect
        palette={palette}
        styles={styles}
        globalStyles={globalStyles}
      />

      <ProductSelectionModal
        visible={giftVisible}
        title="Selecionar produto brinde"
        helperText="Toque em um produto existente para defini-lo como brinde."
        browser={giftBrowser}
        onClose={() => setGiftVisible(false)}
        onSelect={selectGift}
        selectedItemId={giftProductId}
        multiSelect={false}
        palette={palette}
        styles={styles}
        globalStyles={globalStyles}
      />
    </>
  );
};

export default LoyaltySection;
