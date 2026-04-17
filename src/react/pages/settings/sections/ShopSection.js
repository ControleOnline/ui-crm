import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import css from '@controleonline/ui-orders/src/react/css/orders';
import {useStore} from '@store';
import {searchCompanyProducts} from '@controleonline/ui-common/src/react/utils/commercialDocumentOrders';
import {
  getEnabledShopHomeOptions,
  normalizeBooleanConfig,
  normalizeShopLoyaltyRequiredSales,
  normalizeShopPrimaryEntry,
  normalizeShopProductId,
  normalizeShopProductIds,
  SHOP_BOTTOM_BAR_ENABLED_CONFIG_KEY,
  SHOP_FRANCHISE_LOCATOR_ENABLED_CONFIG_KEY,
  SHOP_HOME_OPTION_FRANCHISE_LOCATOR,
  SHOP_HOME_OPTION_SALES,
  SHOP_LOYALTY_COUPONS_ENABLED_CONFIG_KEY,
  SHOP_LOYALTY_GIFT_PRODUCT_ID_CONFIG_KEY,
  SHOP_LOYALTY_PRODUCT_IDS_CONFIG_KEY,
  SHOP_LOYALTY_REQUIRED_SALES_CONFIG_KEY,
  SHOP_PRIMARY_ENTRY_CONFIG_KEY,
  SHOP_SALES_PAGE_ENABLED_CONFIG_KEY,
} from '@controleonline/ui-common/src/react/utils/shopConfig';

import localStyles from '../GeneralSettings.styles';
import GeneralSettingsSection from '../GeneralSettingsSection';
import {useGeneralSettingsConfig} from '../GeneralSettings.shared';

const SHOP_HOME_OPTIONS = [
  {
    key: SHOP_HOME_OPTION_SALES,
    icon: 'storefront',
    label: 'Pagina de vendas',
    description:
      'Libera a vitrine principal do shop para navegacao por categorias e produtos.',
  },
  {
    key: SHOP_HOME_OPTION_FRANCHISE_LOCATOR,
    icon: 'place',
    label: 'Localizador de franquias',
    description:
      'Libera a entrada do shop focada em encontrar unidades ou franquias.',
  },
];

const resolveProductLabel = product => {
  const normalizedId = normalizeShopProductId(product);
  return (
    String(
      product?.product ||
        product?.name ||
        product?.description ||
        (normalizedId ? `Produto #${normalizedId}` : 'Produto'),
    ).trim() || 'Produto'
  );
};

const resolveProductMeta = product => {
  const sku = String(product?.sku || '').trim();
  const price = Number(product?.price || 0);
  const priceLabel = Number.isFinite(price)
    ? `R$ ${price.toFixed(2).replace('.', ',')}`
    : '';

  return [sku ? `SKU ${sku}` : null, price > 0 ? priceLabel : null]
    .filter(Boolean)
    .join(' • ');
};

const ConfigToggleRow = ({description, label, value, onToggle}) => (
  <View style={localStyles.settingRow}>
    <View style={localStyles.settingCopy}>
      <Text style={localStyles.statusLabel}>{label}</Text>
      <Text style={localStyles.settingDescription}>{description}</Text>
    </View>
    <TouchableOpacity
      style={[
        localStyles.statusChip,
        value
          ? localStyles.statusChipEnabled
          : localStyles.statusChipDisabled,
      ]}
      activeOpacity={0.85}
      onPress={onToggle}>
      <Icon
        name={value ? 'check-circle' : 'block'}
        size={16}
        color={value ? '#166534' : '#991B1B'}
      />
      <Text
        style={[
          localStyles.statusChipText,
          {color: value ? '#166534' : '#991B1B'},
        ]}>
        {value ? 'Ativado' : 'Desativado'}
      </Text>
    </TouchableOpacity>
  </View>
);

const useShopProductSearch = currentCompanyId => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const trimmedQuery = String(query || '').trim();

    if (!currentCompanyId || !trimmedQuery) {
      setResults([]);
      setIsLoading(false);
      return undefined;
    }

    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const items = await searchCompanyProducts({
          companyId: currentCompanyId,
          query: trimmedQuery,
          itemsPerPage: 8,
        });

        if (!cancelled) {
          setResults(Array.isArray(items) ? items : []);
        }
      } catch {
        if (!cancelled) {
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [currentCompanyId, query]);

  return {
    isLoading,
    query,
    results,
    setQuery,
  };
};

const ShopSection = () => {
  const {globalStyles} = css();
  const {
    currentCompany,
    effectiveCompanyConfigs,
    isSaving,
    saveConfigs,
  } = useGeneralSettingsConfig();

  const productActions = useStore('products').actions;

  const [salesPageEnabled, setSalesPageEnabled] = useState(false);
  const [franchiseLocatorEnabled, setFranchiseLocatorEnabled] = useState(false);
  const [bottomBarEnabled, setBottomBarEnabled] = useState(false);
  const [primaryEntry, setPrimaryEntry] = useState('');

  const [loyaltyCouponsEnabled, setLoyaltyCouponsEnabled] = useState(false);
  const [loyaltyRequiredSales, setLoyaltyRequiredSales] = useState('');
  const [loyaltyProductIds, setLoyaltyProductIds] = useState([]);
  const [loyaltyGiftProductId, setLoyaltyGiftProductId] = useState('');

  const [selectedLoyaltyProducts, setSelectedLoyaltyProducts] = useState([]);
  const [selectedGiftProduct, setSelectedGiftProduct] = useState(null);
  const [isHydratingLoyaltyProducts, setIsHydratingLoyaltyProducts] =
    useState(false);
  const [isHydratingGiftProduct, setIsHydratingGiftProduct] = useState(false);

  const loyaltySearch = useShopProductSearch(currentCompany?.id);
  const giftSearch = useShopProductSearch(currentCompany?.id);

  useEffect(() => {
    const nextSalesPageEnabled = normalizeBooleanConfig(
      effectiveCompanyConfigs[SHOP_SALES_PAGE_ENABLED_CONFIG_KEY],
    );
    const nextFranchiseLocatorEnabled = normalizeBooleanConfig(
      effectiveCompanyConfigs[SHOP_FRANCHISE_LOCATOR_ENABLED_CONFIG_KEY],
    );

    setSalesPageEnabled(nextSalesPageEnabled);
    setFranchiseLocatorEnabled(nextFranchiseLocatorEnabled);
    setBottomBarEnabled(
      normalizeBooleanConfig(
        effectiveCompanyConfigs[SHOP_BOTTOM_BAR_ENABLED_CONFIG_KEY],
      ),
    );
    setPrimaryEntry(
      normalizeShopPrimaryEntry(
        effectiveCompanyConfigs[SHOP_PRIMARY_ENTRY_CONFIG_KEY],
        {
          salesPageEnabled: nextSalesPageEnabled,
          franchiseLocatorEnabled: nextFranchiseLocatorEnabled,
        },
      ),
    );
    setLoyaltyCouponsEnabled(
      normalizeBooleanConfig(
        effectiveCompanyConfigs[SHOP_LOYALTY_COUPONS_ENABLED_CONFIG_KEY],
      ),
    );
    setLoyaltyRequiredSales(
      String(
        normalizeShopLoyaltyRequiredSales(
          effectiveCompanyConfigs[SHOP_LOYALTY_REQUIRED_SALES_CONFIG_KEY],
        ) || '',
      ),
    );
    setLoyaltyProductIds(
      normalizeShopProductIds(
        effectiveCompanyConfigs[SHOP_LOYALTY_PRODUCT_IDS_CONFIG_KEY],
      ),
    );
    setLoyaltyGiftProductId(
      normalizeShopProductId(
        effectiveCompanyConfigs[SHOP_LOYALTY_GIFT_PRODUCT_ID_CONFIG_KEY],
      ),
    );
  }, [effectiveCompanyConfigs]);

  useEffect(() => {
    setPrimaryEntry(currentValue =>
      normalizeShopPrimaryEntry(currentValue, {
        salesPageEnabled,
        franchiseLocatorEnabled,
      }),
    );
  }, [franchiseLocatorEnabled, salesPageEnabled]);

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
          const product = await productActions.get(productId);
          return product || {id: productId};
        } catch {
          return {id: productId};
        }
      }),
    )
      .then(items => {
        if (!cancelled) {
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
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsHydratingLoyaltyProducts(false);
        }
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
      .then(product => {
        if (!cancelled) {
          setSelectedGiftProduct(product || {id: loyaltyGiftProductId});
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSelectedGiftProduct({id: loyaltyGiftProductId});
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsHydratingGiftProduct(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loyaltyGiftProductId, productActions]);

  const enabledHomeOptions = useMemo(
    () =>
      getEnabledShopHomeOptions({
        salesPageEnabled,
        franchiseLocatorEnabled,
      }),
    [franchiseLocatorEnabled, salesPageEnabled],
  );

  const resolvedPrimaryEntry = useMemo(
    () =>
      normalizeShopPrimaryEntry(primaryEntry, {
        salesPageEnabled,
        franchiseLocatorEnabled,
      }),
    [franchiseLocatorEnabled, primaryEntry, salesPageEnabled],
  );

  const primaryEntryOptions = useMemo(
    () =>
      SHOP_HOME_OPTIONS.filter(option =>
        enabledHomeOptions.includes(option.key),
      ),
    [enabledHomeOptions],
  );

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

  const toggleLoyaltyProduct = useCallback(product => {
    const productId = normalizeShopProductId(product);
    if (!productId) {
      return;
    }

    setLoyaltyProductIds(currentIds =>
      currentIds.includes(productId)
        ? currentIds.filter(item => item !== productId)
        : [...currentIds, productId],
    );
  }, []);

  const selectGiftProduct = useCallback(product => {
    const productId = normalizeShopProductId(product);
    setLoyaltyGiftProductId(productId);
    giftSearch.setQuery('');
  }, [giftSearch]);

  const saveHomeSettings = useCallback(async () => {
    await saveConfigs({
      [SHOP_SALES_PAGE_ENABLED_CONFIG_KEY]: salesPageEnabled,
      [SHOP_FRANCHISE_LOCATOR_ENABLED_CONFIG_KEY]: franchiseLocatorEnabled,
      [SHOP_PRIMARY_ENTRY_CONFIG_KEY]: normalizeShopPrimaryEntry(primaryEntry, {
        salesPageEnabled,
        franchiseLocatorEnabled,
      }),
      [SHOP_BOTTOM_BAR_ENABLED_CONFIG_KEY]: bottomBarEnabled,
    });
  }, [
    bottomBarEnabled,
    franchiseLocatorEnabled,
    primaryEntry,
    salesPageEnabled,
    saveConfigs,
  ]);

  const saveLoyaltySettings = useCallback(async () => {
    const normalizedRequiredSales = normalizeShopLoyaltyRequiredSales(
      loyaltyRequiredSales,
    );

    if (loyaltyCouponsEnabled && loyaltyProductIds.length === 0) {
      Alert.alert(
        'Cupons de fidelidade',
        'Selecione pelo menos um produto participante antes de salvar.',
      );
      return;
    }

    if (loyaltyCouponsEnabled && normalizedRequiredSales < 1) {
      Alert.alert(
        'Cupons de fidelidade',
        'Informe quantas vendas sao necessarias para liberar o brinde.',
      );
      return;
    }

    if (loyaltyCouponsEnabled && !loyaltyGiftProductId) {
      Alert.alert(
        'Cupons de fidelidade',
        'Selecione o produto que sera entregue como brinde.',
      );
      return;
    }

    await saveConfigs({
      [SHOP_LOYALTY_COUPONS_ENABLED_CONFIG_KEY]: loyaltyCouponsEnabled,
      [SHOP_LOYALTY_PRODUCT_IDS_CONFIG_KEY]: loyaltyProductIds,
      [SHOP_LOYALTY_REQUIRED_SALES_CONFIG_KEY]: normalizedRequiredSales,
      [SHOP_LOYALTY_GIFT_PRODUCT_ID_CONFIG_KEY]: loyaltyGiftProductId,
    });
  }, [
    loyaltyCouponsEnabled,
    loyaltyGiftProductId,
    loyaltyProductIds,
    loyaltyRequiredSales,
    saveConfigs,
  ]);

  return (
    <>
      <GeneralSettingsSection
        description="Controla quais entradas aparecem na home do shop, qual delas vira a principal e quando a barra inferior de troca deve aparecer."
        icon="shopping-bag"
        iconBackgroundColor="#CCFBF1"
        iconColor="#0F766E"
        title="Home do shop">
        <ConfigToggleRow
          label="Pagina de vendas"
          description="Ativa a vitrine principal do shop."
          value={salesPageEnabled}
          onToggle={() => setSalesPageEnabled(current => !current)}
        />

        <ConfigToggleRow
          label="Localizador de franquias"
          description="Ativa a entrada do shop para localizar unidades ou franquias."
          value={franchiseLocatorEnabled}
          onToggle={() => setFranchiseLocatorEnabled(current => !current)}
        />

        <ConfigToggleRow
          label="Barra inferior no shop"
          description="Quando ativada, o shop pode mostrar uma barra inferior para alternar entre entradas. Quando desativada, a troca fica apenas no menu suspenso acima das categorias."
          value={bottomBarEnabled}
          onToggle={() => setBottomBarEnabled(current => !current)}
        />

        <Text style={localStyles.helperText}>
          {enabledHomeOptions.length === 0
            ? 'Nenhuma entrada do shop esta ativa para esta empresa.'
            : enabledHomeOptions.length === 1
              ? 'Apenas uma entrada esta ativa, entao ela ja vira a principal automaticamente.'
              : 'Mais de uma entrada esta ativa. Escolha abaixo qual delas deve abrir como principal no shop.'}
        </Text>

        <View style={localStyles.fieldBlock}>
          <Text style={localStyles.fieldLabel}>Entrada principal</Text>
          {primaryEntryOptions.length === 0 ? (
            <View style={localStyles.emptyBox}>
              <Text style={localStyles.emptyTitle}>
                Nenhuma opcao disponivel
              </Text>
              <Text style={localStyles.emptyText}>
                Ative pelo menos uma entrada para definir a principal.
              </Text>
            </View>
          ) : (
            <View style={localStyles.printerList}>
              {primaryEntryOptions.map(option => {
                const active = option.key === resolvedPrimaryEntry;
                const locked = primaryEntryOptions.length === 1;

                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      localStyles.printerItem,
                      active && localStyles.printerItemActive,
                    ]}
                    activeOpacity={0.85}
                    disabled={locked}
                    onPress={() => setPrimaryEntry(option.key)}>
                    <Icon
                      name={active ? 'star' : 'star-border'}
                      size={20}
                      color={active ? '#0F766E' : '#94A3B8'}
                    />
                    <View style={localStyles.printerCopy}>
                      <Text style={localStyles.printerName}>
                        {option.label}
                      </Text>
                      <Text style={localStyles.printerDevice}>
                        {locked
                          ? 'Principal automatica enquanto for a unica opcao ativa.'
                          : option.description}
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
          onPress={saveHomeSettings}>
          <Text style={localStyles.primaryButtonText}>
            Salvar home do shop
          </Text>
        </TouchableOpacity>
      </GeneralSettingsSection>

      <GeneralSettingsSection
        description="Prepara a configuracao dos cupons de fidelidade do shop, definindo se a regra fica ativa, quais produtos participam e qual brinde sera entregue."
        icon="redeem"
        iconBackgroundColor="#FEF3C7"
        iconColor="#B45309"
        title="Cupons de fidelidade">
        <ConfigToggleRow
          label="Cupons de fidelidade"
          description="Ativa a regra de acumulo de vendas para liberar um brinde no shop."
          value={loyaltyCouponsEnabled}
          onToggle={() => setLoyaltyCouponsEnabled(current => !current)}
        />

        <Text style={localStyles.helperText}>
          {loyaltyCouponsEnabled
            ? 'Defina os produtos participantes, a quantidade de vendas e o produto que sera entregue como brinde.'
            : 'As configuracoes abaixo podem ficar preparadas agora e serao usadas quando a fidelidade for ativada.'}
        </Text>

        <View style={localStyles.fieldBlock}>
          <Text style={localStyles.fieldLabel}>
            Quantidade de vendas para ganhar o brinde
          </Text>
          <TextInput
            value={loyaltyRequiredSales}
            onChangeText={value =>
              setLoyaltyRequiredSales(value.replace(/\D+/g, ''))
            }
            keyboardType="number-pad"
            placeholder="Ex.: 10"
            placeholderTextColor="#94A3B8"
            style={localStyles.input}
          />
        </View>

        <View style={localStyles.fieldBlock}>
          <Text style={localStyles.fieldLabel}>Produtos participantes</Text>
          <Text style={localStyles.helperText}>
            Busque e selecione os produtos que contam para a fidelidade.
          </Text>
          <TextInput
            value={loyaltySearch.query}
            onChangeText={loyaltySearch.setQuery}
            placeholder="Buscar produto participante..."
            placeholderTextColor="#94A3B8"
            style={localStyles.input}
          />

          {loyaltySearch.isLoading ? (
            <ActivityIndicator size="small" style={localStyles.sectionLoader} />
          ) : String(loyaltySearch.query || '').trim() &&
            visibleLoyaltyResults.length === 0 ? (
            <View style={localStyles.emptyBox}>
              <Text style={localStyles.emptyTitle}>
                Nenhum produto encontrado
              </Text>
              <Text style={localStyles.emptyText}>
                Tente outro termo para localizar os produtos participantes.
              </Text>
            </View>
          ) : (
            visibleLoyaltyResults.length > 0 && (
              <View style={localStyles.printerList}>
                {visibleLoyaltyResults.map(product => {
                  const productId = normalizeShopProductId(product);

                  return (
                    <TouchableOpacity
                      key={`shop-loyalty-search-${productId}`}
                      style={localStyles.printerItem}
                      activeOpacity={0.85}
                      onPress={() => {
                        toggleLoyaltyProduct(product);
                        loyaltySearch.setQuery('');
                      }}>
                      <Icon name="add-circle" size={20} color="#0F766E" />
                      <View style={localStyles.printerCopy}>
                        <Text style={localStyles.printerName}>
                          {resolveProductLabel(product)}
                        </Text>
                        <Text style={localStyles.printerDevice}>
                          {resolveProductMeta(product) || 'Toque para adicionar'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )
          )}

          <Text style={localStyles.helperText}>
            {loyaltyProductIds.length > 0
              ? `${loyaltyProductIds.length} produto(s) participante(s) selecionado(s).`
              : 'Nenhum produto participante selecionado ainda.'}
          </Text>

          {isHydratingLoyaltyProducts ? (
            <ActivityIndicator size="small" style={localStyles.sectionLoader} />
          ) : selectedLoyaltyProducts.length === 0 ? (
            <View style={localStyles.emptyBox}>
              <Text style={localStyles.emptyTitle}>
                Lista de participantes vazia
              </Text>
              <Text style={localStyles.emptyText}>
                Os produtos escolhidos aparecerao aqui para remocao rapida.
              </Text>
            </View>
          ) : (
            <View style={localStyles.printerList}>
              {selectedLoyaltyProducts.map(product => {
                const productId = normalizeShopProductId(product);

                return (
                  <TouchableOpacity
                    key={`shop-loyalty-selected-${productId}`}
                    style={[
                      localStyles.printerItem,
                      localStyles.printerItemActive,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => toggleLoyaltyProduct(productId)}>
                    <Icon
                      name="remove-circle-outline"
                      size={20}
                      color="#B45309"
                    />
                    <View style={localStyles.printerCopy}>
                      <Text style={localStyles.printerName}>
                        {resolveProductLabel(product)}
                      </Text>
                      <Text style={localStyles.printerDevice}>
                        {resolveProductMeta(product) || 'Toque para remover'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={localStyles.fieldBlock}>
          <Text style={localStyles.fieldLabel}>Produto brinde</Text>
          <Text style={localStyles.helperText}>
            Busque o produto que sera entregue quando a meta for atingida.
          </Text>
          <TextInput
            value={giftSearch.query}
            onChangeText={giftSearch.setQuery}
            placeholder="Buscar produto brinde..."
            placeholderTextColor="#94A3B8"
            style={localStyles.input}
          />

          {giftSearch.isLoading ? (
            <ActivityIndicator size="small" style={localStyles.sectionLoader} />
          ) : String(giftSearch.query || '').trim() &&
            visibleGiftResults.length === 0 ? (
            <View style={localStyles.emptyBox}>
              <Text style={localStyles.emptyTitle}>
                Nenhum produto encontrado
              </Text>
              <Text style={localStyles.emptyText}>
                Tente outro termo para localizar o produto brinde.
              </Text>
            </View>
          ) : (
            visibleGiftResults.length > 0 && (
              <View style={localStyles.printerList}>
                {visibleGiftResults.map(product => {
                  const productId = normalizeShopProductId(product);

                  return (
                    <TouchableOpacity
                      key={`shop-gift-search-${productId}`}
                      style={localStyles.printerItem}
                      activeOpacity={0.85}
                      onPress={() => selectGiftProduct(product)}>
                      <Icon name="redeem" size={20} color="#B45309" />
                      <View style={localStyles.printerCopy}>
                        <Text style={localStyles.printerName}>
                          {resolveProductLabel(product)}
                        </Text>
                        <Text style={localStyles.printerDevice}>
                          {resolveProductMeta(product) || 'Toque para selecionar'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )
          )}

          {isHydratingGiftProduct ? (
            <ActivityIndicator size="small" style={localStyles.sectionLoader} />
          ) : selectedGiftProduct ? (
            <TouchableOpacity
              style={[
                localStyles.printerItem,
                localStyles.printerItemActive,
              ]}
              activeOpacity={0.85}
              onPress={() => setLoyaltyGiftProductId('')}>
              <Icon name="card-giftcard" size={20} color="#B45309" />
              <View style={localStyles.printerCopy}>
                <Text style={localStyles.printerName}>
                  {resolveProductLabel(selectedGiftProduct)}
                </Text>
                <Text style={localStyles.printerDevice}>
                  {resolveProductMeta(selectedGiftProduct) ||
                    'Toque para remover o brinde selecionado'}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={localStyles.emptyBox}>
              <Text style={localStyles.emptyTitle}>
                Nenhum brinde selecionado
              </Text>
              <Text style={localStyles.emptyText}>
                Escolha um produto para ser entregue como recompensa.
              </Text>
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
          onPress={saveLoyaltySettings}>
          <Text style={localStyles.primaryButtonText}>
            Salvar fidelidade do shop
          </Text>
        </TouchableOpacity>
      </GeneralSettingsSection>
    </>
  );
};

export default ShopSection;
