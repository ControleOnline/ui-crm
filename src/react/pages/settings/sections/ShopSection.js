/*
 * @agents This section controls the shop home, entry, franchise, and loyalty settings.
 * Keep the visible toggles and persistence routed through shared config values.
 */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';
import css from '@controleonline/ui-orders/src/react/css/orders';
import AnimatedModal from '@controleonline/ui-common/src/react/components/AnimatedModal';
import {useStore} from '@store';
import {searchCompanyProducts} from '@controleonline/ui-common/src/react/utils/commercialDocumentOrders';
import {buildAddressOptionSummary} from '@controleonline/ui-common/src/react/utils/entityDisplay';
import {
  fetchShopFranchiseDirectory,
  resolveFranchiseCompanyLabel,
} from '@controleonline/ui-common/src/react/utils/shopFranchises';
import {
  getEnabledShopHomeOptions,
  normalizeBooleanConfig,
  normalizeShopCatalogProductTypes,
  normalizeShopEntityId,
  normalizeShopEntityIds,
  normalizeShopLoyaltyRequiredSales,
  normalizeShopMoneyConfig,
  normalizeShopPrimaryEntry,
  normalizeShopProductId,
  normalizeShopProductIds,
  normalizeShopTextConfig,
  SHOP_BOTTOM_BAR_ENABLED_CONFIG_KEY,
  SHOP_CATALOG_DEFAULT_PRODUCT_TYPES,
  SHOP_CATALOG_PRODUCT_TYPES_CONFIG_KEY,
  SHOP_CHARGE_ON_DELIVERY_ENABLED_CONFIG_KEY,
  SHOP_DELIVERY_FEE_ENABLED_CONFIG_KEY,
  SHOP_DELIVERY_FEE_VALUE_CONFIG_KEY,
  SHOP_FRANCHISE_VISIBLE_ADDRESS_IDS_CONFIG_KEY,
  SHOP_FRANCHISE_VISIBLE_COMPANY_IDS_CONFIG_KEY,
  SHOP_FRANCHISE_LOCATOR_ENABLED_CONFIG_KEY,
  SHOP_HOME_OPTION_FRANCHISE_LOCATOR,
  SHOP_HOME_OPTION_LOYALTY,
  SHOP_HOME_OPTION_SALES,
  SHOP_GOOGLE_MAPS_API_KEY_CONFIG_KEY,
  SHOP_LOYALTY_COUPONS_ENABLED_CONFIG_KEY,
  SHOP_LOYALTY_GIFT_PRODUCT_ID_CONFIG_KEY,
  SHOP_LOYALTY_PRODUCT_IDS_CONFIG_KEY,
  SHOP_LOYALTY_REQUIRED_SALES_CONFIG_KEY,
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

const resolveCompanyLabel = company =>
  resolveFranchiseCompanyLabel(company) || 'Franquia';

const resolveCompanyMeta = company => {
  const documentLabel = Array.isArray(company?.document)
    ? String(company?.document?.[0]?.document || '').trim()
    : String(company?.document?.document || company?.document || '').trim();

  return documentLabel || 'Empresa vinculada como franquia';
};

const resolveAddressLabel = address => {
  const summary = buildAddressOptionSummary(address);
  return summary.primary || address?.nickname || 'Endereco';
};

const resolveAddressDetail = address => {
  const summary = buildAddressOptionSummary(address);

  return [
    summary.secondary,
    address?.searchFor,
    address?.openingHours,
  ]
    .filter(Boolean)
    .join(' • ');
};

const buildNormalizedSearchText = (...values) =>
  values
    .flatMap(value => {
      if (Array.isArray(value)) {
        return value;
      }

      return [value];
    })
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

const filterSelectableItems = ({
  items = [],
  query = '',
  resolveSearchText,
}) => {
  const normalizedQuery = String(query || '').trim().toLowerCase();

  if (!normalizedQuery) {
    return items;
  }

  return items.filter(item =>
    String(resolveSearchText?.(item) || '')
      .toLowerCase()
      .includes(normalizedQuery),
  );
};

const ConfigToggleRow = ({description, label, onToggle, palette, styles, value}) => (
  <View style={styles.settingRow}>
    <View style={styles.settingCopy}>
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={styles.settingDescription}>{description}</Text>
    </View>
    <TouchableOpacity
      style={[
        styles.statusChip,
        value
          ? styles.statusChipEnabled
          : styles.statusChipDisabled,
      ]}
      activeOpacity={0.85}
      onPress={onToggle}>
      <Icon
        name={value ? 'check-circle' : 'block'}
        size={16}
        color={value ? palette.badgeSelectedText : palette.badgeDisabledText}
      />
      <Text
        style={[
          styles.statusChipText,
          {color: value ? palette.badgeSelectedText : palette.badgeDisabledText},
        ]}>
        {value ? 'Ativado' : 'Desativado'}
      </Text>
    </TouchableOpacity>
  </View>
);

const useShopProductBrowser = ({companyId, visible}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!visible || !companyId) {
      setResults([]);
      setIsLoading(false);
      return undefined;
    }

    const trimmedQuery = String(query || '').trim();
    let cancelled = false;

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const items = await searchCompanyProducts({
          companyId,
          query: trimmedQuery,
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
    }, trimmedQuery ? 250 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [companyId, query, visible]);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setResults([]);
      setIsLoading(false);
    }
  }, [visible]);

  return {
    isLoading,
    query,
    results,
    setQuery,
  };
};

const useShopProductSearch = companyId => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const trimmedQuery = String(query || '').trim();

    if (!companyId || !trimmedQuery) {
      setResults([]);
      setIsLoading(false);
      return undefined;
    }

    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const items = await searchCompanyProducts({
          companyId,
          query: trimmedQuery,
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
  }, [companyId, query]);

  return {
    isLoading,
    query,
    results,
    setQuery,
  };
};

const useLocalSelectionBrowser = ({items, visible, resolveSearchText}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!visible) {
      setQuery('');
    }
  }, [visible]);

  const results = useMemo(
    () =>
      filterSelectableItems({
        items,
        query,
        resolveSearchText,
      }),
    [items, query, resolveSearchText],
  );

  return {
    isLoading: false,
    query,
    results,
    setQuery,
  };
};

const SelectionModal = ({
  visible,
  title,
  helperText,
  browser,
  globalStyles,
  onClose,
  onSelect,
  selectedIds,
  selectedItemId,
  multiSelect = false,
  emptyIconName = 'inventory-2',
  emptyTitle = 'Nenhum item encontrado',
  emptyText = 'A lista ainda nao trouxe itens para selecionar.',
  resolveItemId = normalizeShopEntityId,
  resolveItemLabel = item => String(item?.name || item?.label || 'Item'),
  resolveItemMeta = () => 'Toque para selecionar',
  searchPlaceholder = 'Pesquisar item...',
  selectionMeta,
  palette,
  styles,
}) => {
  const normalizedSelectedIds = selectedIds || new Set();
  const normalizedSelectedItemId = String(selectedItemId || '').trim();

  return (
    <AnimatedModal visible={visible} onRequestClose={onClose}>
      <View style={styles.selectionModal}>
        <View style={styles.selectionModalHeader}>
          <View style={styles.selectionModalHeaderCopy}>
            <Text style={styles.selectionModalTitle}>{title}</Text>
            {!!helperText && (
              <Text style={styles.selectionModalSubtitle}>
                {helperText}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.selectionModalClose}
            activeOpacity={0.85}>
            <Icon name="close" size={20} color={palette.modalCloseIcon} />
          </TouchableOpacity>
        </View>

        <View style={styles.selectionSearchWrap}>
          <Icon
            name="search"
            size={18}
            color={palette.inputIcon}
            style={styles.selectionSearchIcon}
          />
          <TextInput
            value={browser.query}
            onChangeText={browser.setQuery}
            placeholder={searchPlaceholder}
            placeholderTextColor={palette.inputPlaceholderText}
            style={styles.selectionSearchInput}
            autoFocus={visible}
            returnKeyType="search"
          />
          {!!browser.query && (
            <TouchableOpacity
              onPress={() => browser.setQuery('')}
              activeOpacity={0.85}>
              <Icon name="cancel" size={18} color={palette.inputIcon} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          style={styles.selectionModalList}
          contentContainerStyle={styles.selectionModalListContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {browser.isLoading ? (
            <View style={styles.searchEmptyState}>
              <ActivityIndicator size="small" color={palette.loadingSpinner} />
              <Text style={styles.searchEmptyStateText}>
                Carregando itens...
              </Text>
            </View>
          ) : browser.results.length === 0 ? (
            <View style={styles.searchEmptyState}>
              <Icon name={emptyIconName} size={36} color={palette.iconDisabled} />
              <Text style={styles.searchEmptyStateTitle}>
                {emptyTitle}
              </Text>
              <Text style={styles.searchEmptyStateText}>
                {String(browser.query || '').trim()
                  ? emptyText
                  : 'Nenhum item disponivel apareceu para selecao.'}
              </Text>
            </View>
          ) : (
            browser.results.map(item => {
              const itemId = resolveItemId(item);
              const selected = multiSelect
                ? normalizedSelectedIds.has(itemId)
                : itemId === normalizedSelectedItemId;

              return (
                <TouchableOpacity
                  key={`shop-picker-${itemId}`}
                  style={[
                    styles.selectionModalItem,
                    selected && styles.selectionModalItemActive,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => onSelect(item)}>
                  <Icon
                    name={
                      selected
                        ? multiSelect
                          ? 'check-circle'
                          : 'radio-button-checked'
                        : multiSelect
                          ? 'add-circle-outline'
                          : 'radio-button-unchecked'
                    }
                    size={20}
                    color={selected ? palette.iconActive : palette.iconDisabled}
                  />
                  <View style={styles.selectionModalItemCopy}>
                    <Text style={styles.selectionModalItemTitle}>
                      {resolveItemLabel(item)}
                    </Text>
                    <Text style={styles.selectionModalItemMeta}>
                      {(selected
                        ? selectionMeta?.(item, {selected, multiSelect})
                        : null) ||
                        resolveItemMeta(item) ||
                        'Toque para selecionar'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        {multiSelect && (
          <TouchableOpacity
            style={[
              globalStyles.button,
              styles.primaryButton,
              styles.selectionModalActionButton,
            ]}
            onPress={onClose}>
            <Text style={styles.primaryButtonText}>Concluir selecao</Text>
          </TouchableOpacity>
        )}
      </View>
    </AnimatedModal>
  );
};

const ShopSection = () => {
  const {globalStyles} = css();
  const navigation = useNavigation();
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

  const productActions = useStore('products').actions;

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
  const [visibleFranchiseCompanyIds, setVisibleFranchiseCompanyIds] = useState(
    [],
  );
  const [visibleFranchiseAddressIds, setVisibleFranchiseAddressIds] = useState(
    [],
  );
  const [franchiseCompanySearch, setFranchiseCompanySearch] = useState('');
  const [franchiseDirectory, setFranchiseDirectory] = useState([]);
  const [isLoadingFranchiseDirectory, setIsLoadingFranchiseDirectory] =
    useState(false);
  const [franchiseCompanySelectorVisible, setFranchiseCompanySelectorVisible] =
    useState(false);

  const [loyaltyCouponsEnabled, setLoyaltyCouponsEnabled] = useState(false);
  const [loyaltyRequiredSales, setLoyaltyRequiredSales] = useState('');
  const [loyaltyProductIds, setLoyaltyProductIds] = useState([]);
  const [loyaltyGiftProductId, setLoyaltyGiftProductId] = useState('');

  const [selectedLoyaltyProducts, setSelectedLoyaltyProducts] = useState([]);
  const [selectedGiftProduct, setSelectedGiftProduct] = useState(null);
  const [isHydratingLoyaltyProducts, setIsHydratingLoyaltyProducts] =
    useState(false);
  const [isHydratingGiftProduct, setIsHydratingGiftProduct] = useState(false);
  const [loyaltySelectorVisible, setLoyaltySelectorVisible] = useState(false);
  const [giftSelectorVisible, setGiftSelectorVisible] = useState(false);

  const loyaltyBrowser = useShopProductBrowser({
    companyId: currentCompany?.id,
    visible: loyaltySelectorVisible,
  });
  const giftBrowser = useShopProductBrowser({
    companyId: currentCompany?.id,
    visible: giftSelectorVisible,
  });
  const loyaltySearch = useShopProductSearch(currentCompany?.id);
  const giftSearch = useShopProductSearch(currentCompany?.id);
  const availableFranchiseCompanies = useMemo(
    () => franchiseDirectory.filter(Boolean),
    [franchiseDirectory],
  );
  const availableFranchiseAddresses = useMemo(
    () =>
      franchiseDirectory.flatMap(company =>
        (company?.shopAddresses || []).map(address => ({
          ...address,
          linkedCompany: {
            id: company?.id,
            alias: company?.alias,
            name: company?.name,
          },
        })),
      ),
    [franchiseDirectory],
  );
  const franchiseCompanyBrowser = useLocalSelectionBrowser({
    items: availableFranchiseCompanies,
    visible: franchiseCompanySelectorVisible,
    resolveSearchText: company =>
      buildNormalizedSearchText(
        resolveCompanyLabel(company),
        resolveCompanyMeta(company),
      ),
  });

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
    const nextLoyaltyCouponsEnabled = normalizeBooleanConfig(
      effectiveCompanyConfigs[SHOP_LOYALTY_COUPONS_ENABLED_CONFIG_KEY],
    );
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
    setVisibleFranchiseCompanyIds(
      normalizeShopEntityIds(
        effectiveCompanyConfigs[SHOP_FRANCHISE_VISIBLE_COMPANY_IDS_CONFIG_KEY],
      ),
    );
    setVisibleFranchiseAddressIds(
      normalizeShopEntityIds(
        effectiveCompanyConfigs[SHOP_FRANCHISE_VISIBLE_ADDRESS_IDS_CONFIG_KEY],
      ),
    );
    setLoyaltyCouponsEnabled(nextLoyaltyCouponsEnabled);
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
    const nextPrimaryEntry = normalizeShopPrimaryEntry(primaryEntry, {
      salesPageEnabled,
      franchiseLocatorEnabled,
      loyaltyCouponsEnabled,
    });

    if (nextPrimaryEntry === primaryEntry) {
      return;
    }

    setPrimaryEntry(nextPrimaryEntry);
    saveConfig(SHOP_PRIMARY_ENTRY_CONFIG_KEY, nextPrimaryEntry).catch(
      () => {},
    );
  }, [
    franchiseLocatorEnabled,
    loyaltyCouponsEnabled,
    primaryEntry,
    salesPageEnabled,
    saveConfig,
  ]);

  useEffect(() => {
    if (!currentCompany?.id) {
      setFranchiseDirectory([]);
      setIsLoadingFranchiseDirectory(false);
      return;
    }

    let cancelled = false;
    setIsLoadingFranchiseDirectory(true);

    fetchShopFranchiseDirectory({
      companyId: currentCompany.id,
    })
      .then(items => {
        if (!cancelled) {
          setFranchiseDirectory(Array.isArray(items) ? items : []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFranchiseDirectory([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingFranchiseDirectory(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentCompany?.id]);

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
        loyaltyCouponsEnabled,
      }),
    [franchiseLocatorEnabled, loyaltyCouponsEnabled, salesPageEnabled],
  );

  const resolvedPrimaryEntry = useMemo(
    () =>
      normalizeShopPrimaryEntry(primaryEntry, {
        salesPageEnabled,
        franchiseLocatorEnabled,
        loyaltyCouponsEnabled,
      }),
    [
      franchiseLocatorEnabled,
      loyaltyCouponsEnabled,
      primaryEntry,
      salesPageEnabled,
    ],
  );

  const primaryEntryOptions = useMemo(
    () =>
      SHOP_HOME_OPTIONS.filter(option =>
        enabledHomeOptions.includes(option.key),
      ),
    [enabledHomeOptions],
  );
  const franchiseCompaniesById = useMemo(
    () =>
      availableFranchiseCompanies.reduce((accumulator, company) => {
        const companyId = normalizeShopEntityId(company);
        if (companyId) {
          accumulator[companyId] = company;
        }
        return accumulator;
      }, {}),
    [availableFranchiseCompanies],
  );
  const franchiseAddressesById = useMemo(
    () =>
      availableFranchiseAddresses.reduce((accumulator, address) => {
        const addressId = normalizeShopEntityId(address);
        if (addressId) {
          accumulator[addressId] = address;
        }
        return accumulator;
      }, {}),
    [availableFranchiseAddresses],
  );
  const selectedFranchiseCompanies = useMemo(
    () =>
      visibleFranchiseCompanyIds
        .map(companyId => franchiseCompaniesById[companyId])
        .filter(Boolean),
    [franchiseCompaniesById, visibleFranchiseCompanyIds],
  );
  const selectedFranchiseAddressGroups = useMemo(
    () =>
      selectedFranchiseCompanies.map(company => {
        const linkedCompany = {
          id: company?.id,
          alias: company?.alias,
          name: company?.name,
        };
        const addresses = (company?.shopAddresses || []).map(address => ({
          ...address,
          linkedCompany,
        }));
        const selectedCount = addresses.filter(address =>
          visibleFranchiseAddressIds.includes(normalizeShopEntityId(address)),
        ).length;

        return {
          addresses,
          company,
          selectedCount,
        };
      }),
    [selectedFranchiseCompanies, visibleFranchiseAddressIds],
  );
  const hasFranchiseCompanySearch = String(franchiseCompanySearch || '').trim() !== '';
  const visibleFranchiseCompanyResults = useMemo(
    () => {
      if (!hasFranchiseCompanySearch) {
        return [];
      }

      return filterSelectableItems({
        items: availableFranchiseCompanies.filter(
          company =>
            !visibleFranchiseCompanyIds.includes(normalizeShopEntityId(company)),
        ),
        query: franchiseCompanySearch,
        resolveSearchText: company =>
          buildNormalizedSearchText(
            resolveCompanyLabel(company),
            resolveCompanyMeta(company),
          ),
      });
    },
    [
      availableFranchiseCompanies,
      franchiseCompanySearch,
      hasFranchiseCompanySearch,
      visibleFranchiseCompanyIds,
    ],
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

  useEffect(() => {
    if (visibleFranchiseCompanyIds.length === 0) {
      if (visibleFranchiseAddressIds.length === 0) {
        return;
      }

      setVisibleFranchiseAddressIds([]);
      saveConfigs({
        [SHOP_FRANCHISE_VISIBLE_COMPANY_IDS_CONFIG_KEY]:
          visibleFranchiseCompanyIds,
        [SHOP_FRANCHISE_VISIBLE_ADDRESS_IDS_CONFIG_KEY]: [],
      });
      return;
    }

    if (Object.keys(franchiseAddressesById).length === 0) {
      return;
    }

    const nextAddressIds = visibleFranchiseAddressIds.filter(addressId => {
      const address = franchiseAddressesById[addressId];
      if (!address) {
        return false;
      }

      return visibleFranchiseCompanyIds.includes(
        normalizeShopEntityId(address?.linkedCompany),
      );
    });

    if (
      nextAddressIds.length === visibleFranchiseAddressIds.length &&
      nextAddressIds.every(
        (addressId, index) => addressId === visibleFranchiseAddressIds[index],
      )
    ) {
      return;
    }

    setVisibleFranchiseAddressIds(nextAddressIds);
    saveConfigs({
      [SHOP_FRANCHISE_VISIBLE_COMPANY_IDS_CONFIG_KEY]:
        visibleFranchiseCompanyIds,
      [SHOP_FRANCHISE_VISIBLE_ADDRESS_IDS_CONFIG_KEY]: nextAddressIds,
    });
  }, [
    franchiseAddressesById,
    saveConfigs,
    visibleFranchiseAddressIds,
    visibleFranchiseCompanyIds,
  ]);

  const saveFranchiseVisibility = useCallback(
    (nextCompanyIds, nextAddressIds) => {
      setVisibleFranchiseCompanyIds(nextCompanyIds);
      setVisibleFranchiseAddressIds(nextAddressIds);

      return saveConfigs({
        [SHOP_FRANCHISE_VISIBLE_COMPANY_IDS_CONFIG_KEY]: nextCompanyIds,
        [SHOP_FRANCHISE_VISIBLE_ADDRESS_IDS_CONFIG_KEY]: nextAddressIds,
      });
    },
    [saveConfigs],
  );

  const toggleLoyaltyProduct = useCallback(
    product => {
      const productId = normalizeShopProductId(product);
      if (!productId) {
        return;
      }

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

  const toggleFranchiseCompany = useCallback(
    company => {
      const companyId = normalizeShopEntityId(company);
      if (!companyId) {
        return;
      }

      const nextCompanyIds = visibleFranchiseCompanyIds.includes(companyId)
        ? visibleFranchiseCompanyIds.filter(item => item !== companyId)
        : [...visibleFranchiseCompanyIds, companyId];
      const nextAddressIds = visibleFranchiseAddressIds.filter(addressId => {
        const address = franchiseAddressesById[addressId];
        if (!address) {
          return false;
        }

        return nextCompanyIds.includes(
          normalizeShopEntityId(address?.linkedCompany),
        );
      });

      saveFranchiseVisibility(nextCompanyIds, nextAddressIds);
    },
    [
      franchiseAddressesById,
      saveFranchiseVisibility,
      visibleFranchiseAddressIds,
      visibleFranchiseCompanyIds,
    ],
  );

  const toggleFranchiseAddress = useCallback(
    address => {
      const addressId = normalizeShopEntityId(address);
      if (!addressId) {
        return;
      }

      const nextAddressIds = visibleFranchiseAddressIds.includes(addressId)
        ? visibleFranchiseAddressIds.filter(item => item !== addressId)
        : [...visibleFranchiseAddressIds, addressId];

      saveFranchiseVisibility(visibleFranchiseCompanyIds, nextAddressIds);
    },
    [saveFranchiseVisibility, visibleFranchiseAddressIds, visibleFranchiseCompanyIds],
  );

  const toggleCatalogProductType = useCallback(
    productType => {
      const normalizedTypes = normalizeShopCatalogProductTypes(
        catalogProductTypes,
      );
      const nextTypes = normalizedTypes.includes(productType)
        ? normalizedTypes.filter(type => type !== productType)
        : [...normalizedTypes, productType];

      saveAndUpdateConfigValue({
        configKey: SHOP_CATALOG_PRODUCT_TYPES_CONFIG_KEY,
        nextValue: nextTypes,
        saveConfig,
        setValue: setCatalogProductTypes,
      });
    },
    [catalogProductTypes, saveConfig],
  );

  const selectPrimaryEntry = useCallback(
    optionKey => {
      saveAndUpdateConfigValue({
        configKey: SHOP_PRIMARY_ENTRY_CONFIG_KEY,
        nextValue: optionKey,
        saveConfig,
        setValue: setPrimaryEntry,
      });
    },
    [saveConfig],
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
          <Text style={localStyles.emptyTitle}>
            Configuracao disponivel apenas na empresa principal
          </Text>
          <Text style={localStyles.emptyText}>
            {`Abra a empresa principal (${defaultCompanyLabel}) para editar a home do shop e o localizador de franquias.`}
          </Text>
        </View>
      </GeneralSettingsSection>
    );
  }

  return (
    <>
      <GeneralSettingsSection
        description="Controla quais entradas aparecem na home do shop, qual delas vira a principal e quando a barra inferior de troca deve aparecer."
        icon="shopping-bag"
        iconBackgroundColor={themePalette.cardIconBackground}
        iconColor={themePalette.cardIconColor}
        title="Home do shop">
        <ConfigToggleRow
          label="Pagina de vendas"
          description="Ativa a vitrine principal do shop."
          palette={themePalette}
          styles={localStyles}
          value={salesPageEnabled}
          onToggle={() =>
            toggleAndSaveBooleanConfig({
              configKey: SHOP_SALES_PAGE_ENABLED_CONFIG_KEY,
              currentValue: salesPageEnabled,
              saveConfig,
              setValue: setSalesPageEnabled,
            })
          }
        />

        <ConfigToggleRow
          label="Localizador de franquias"
          description="Ativa a entrada do shop para localizar unidades ou franquias."
          palette={themePalette}
          styles={localStyles}
          value={franchiseLocatorEnabled}
          onToggle={() =>
            toggleAndSaveBooleanConfig({
              configKey: SHOP_FRANCHISE_LOCATOR_ENABLED_CONFIG_KEY,
              currentValue: franchiseLocatorEnabled,
              saveConfig,
              setValue: setFranchiseLocatorEnabled,
            })
          }
        />

        <ConfigToggleRow
          label="Barra inferior no shop"
          description="Quando ativada, o shop pode mostrar uma barra inferior para alternar entre entradas. Quando desativada, a troca fica apenas no menu suspenso acima das categorias."
          palette={themePalette}
          styles={localStyles}
          value={bottomBarEnabled}
          onToggle={() =>
            toggleAndSaveBooleanConfig({
              configKey: SHOP_BOTTOM_BAR_ENABLED_CONFIG_KEY,
              currentValue: bottomBarEnabled,
              saveConfig,
              setValue: setBottomBarEnabled,
            })
          }
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
                    onPress={() => selectPrimaryEntry(option.key)}>
                    <Icon
                      name={active ? 'star' : 'star-border'}
                      size={20}
                      color={active ? themePalette.iconActive : themePalette.iconDisabled}
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

        <View style={localStyles.fieldBlock}>
          <Text style={localStyles.fieldLabel}>
            Franquias exibidas no localizador
          </Text>
          <Text style={localStyles.helperText}>
            Selecione quais empresas vinculadas como franquia podem aparecer no
            mapa do shop.
          </Text>
          <View style={localStyles.selectorRow}>
            <TextInput
              value={franchiseCompanySearch}
              onChangeText={setFranchiseCompanySearch}
              placeholder="Buscar franquia..."
              placeholderTextColor={themePalette.inputPlaceholderText}
              style={[localStyles.input, localStyles.selectorInput]}
            />
            <TouchableOpacity
              style={localStyles.selectorListButton}
              activeOpacity={0.85}
              onPress={() => setFranchiseCompanySelectorVisible(true)}>
              <Icon name="view-list" size={18} color={themePalette.buttonIcon} />
              <Text style={localStyles.selectorListButtonText}>Lista</Text>
            </TouchableOpacity>
          </View>

          {isLoadingFranchiseDirectory ? (
            <ActivityIndicator
              size="small"
              color={themePalette.loadingSpinner}
              style={localStyles.sectionLoader}
            />
          ) : String(franchiseCompanySearch || '').trim() &&
            visibleFranchiseCompanyResults.length === 0 ? (
            <View style={localStyles.emptyBox}>
              <Text style={localStyles.emptyTitle}>
                Nenhuma franquia encontrada
              </Text>
              <Text style={localStyles.emptyText}>
                Tente outro termo ou abra a lista completa ao lado.
              </Text>
            </View>
          ) : (
            visibleFranchiseCompanyResults.length > 0 && (
              <View style={localStyles.printerList}>
                {visibleFranchiseCompanyResults.map(company => {
                  const companyId = normalizeShopEntityId(company);

                  return (
                    <TouchableOpacity
                      key={`shop-franchise-company-search-${companyId}`}
                      style={localStyles.printerItem}
                      activeOpacity={0.85}
                      onPress={() => {
                        toggleFranchiseCompany(company);
                        setFranchiseCompanySearch('');
                      }}>
                      <Icon
                        name="storefront"
                        size={20}
                        color={themePalette.cardIconColor}
                      />
                      <View style={localStyles.printerCopy}>
                        <Text style={localStyles.printerName}>
                          {resolveCompanyLabel(company)}
                        </Text>
                        <Text style={localStyles.printerDevice}>
                          {resolveCompanyMeta(company) || 'Toque para liberar'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )
          )}

          <Text style={localStyles.helperText}>
            {visibleFranchiseCompanyIds.length > 0
              ? `${visibleFranchiseCompanyIds.length} franquia(s) liberada(s) para o localizador.`
              : 'Nenhuma franquia liberada ainda.'}
          </Text>

          {selectedFranchiseCompanies.length === 0 ? (
            <View style={localStyles.emptyBox}>
              <Text style={localStyles.emptyTitle}>
                Lista de franquias vazia
              </Text>
              <Text style={localStyles.emptyText}>
                As empresas selecionadas aparecerao aqui para remocao rapida.
              </Text>
            </View>
          ) : (
            <View style={localStyles.printerList}>
              {selectedFranchiseCompanies.map(company => {
                const companyId = normalizeShopEntityId(company);

                return (
                  <TouchableOpacity
                    key={`shop-franchise-company-selected-${companyId}`}
                    style={[
                      localStyles.printerItem,
                      localStyles.printerItemActive,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => toggleFranchiseCompany(company)}>
                    <Icon
                      name="remove-circle-outline"
                      size={20}
                      color={themePalette.iconDanger}
                    />
                    <View style={localStyles.printerCopy}>
                      <Text style={localStyles.printerName}>
                        {resolveCompanyLabel(company)}
                      </Text>
                      <Text style={localStyles.printerDevice}>
                        {resolveCompanyMeta(company) || 'Toque para remover'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={localStyles.fieldBlock}>
          <Text style={localStyles.fieldLabel}>
            Enderecos exibidos no localizador
          </Text>
          <Text style={localStyles.helperText}>
            Abaixo de cada franquia selecionada, marque quais enderecos entram
            no mapa. Ao remover a franquia acima, os enderecos dela saem junto.
          </Text>

          {visibleFranchiseCompanyIds.length === 0 ? (
            <View style={localStyles.emptyBox}>
              <Text style={localStyles.emptyTitle}>
                Selecione franquias primeiro
              </Text>
              <Text style={localStyles.emptyText}>
                Os enderecos aparecem agrupados logo abaixo de cada franquia
                liberada acima.
              </Text>
            </View>
          ) : isLoadingFranchiseDirectory ? (
            <ActivityIndicator
              size="small"
              color={themePalette.loadingSpinner}
              style={localStyles.sectionLoader}
            />
          ) : (
            <View style={localStyles.franchiseAddressGroupList}>
              {selectedFranchiseAddressGroups.map(({company, addresses, selectedCount}) => {
                const companyId = normalizeShopEntityId(company);

                return (
                  <View
                    key={`shop-franchise-address-group-${companyId}`}
                    style={localStyles.franchiseAddressGroup}>
                    <View style={localStyles.franchiseAddressGroupHeader}>
                      <View style={localStyles.franchiseAddressGroupBadge}>
                        <Icon
                          name="storefront"
                          size={18}
                          color={themePalette.cardIconColor}
                        />
                      </View>
                      <View style={localStyles.franchiseAddressGroupCopy}>
                        <Text style={localStyles.printerName}>
                          {resolveCompanyLabel(company)}
                        </Text>
                        <Text style={localStyles.printerDevice}>
                          {addresses.length > 0
                            ? `${selectedCount} de ${addresses.length} endereco(s) liberado(s).`
                            : 'Nenhum endereco disponivel para essa franquia.'}
                        </Text>
                      </View>
                      
                      {/* @agents Show the address creation action only when there are no addresses yet. */}
                      {addresses.length === 0 && (
                        <TouchableOpacity
                          style={localStyles.franchiseAddressAddBtn}
                          activeOpacity={0.7}
                          onPress={() =>
                            navigation.navigate('ClientDetails', {client: company})
                          }>
                          <Icon name="add" size={16} color={themePalette.inputIcon} />
                        </TouchableOpacity>
                      )}

                    </View>

                    {addresses.length === 0 ? (
                      <View style={localStyles.emptyBox}>
                        <Text style={localStyles.emptyTitle}>
                          Nenhum endereco cadastrado
                        </Text>
                        <Text style={localStyles.emptyText}>
                          Essa franquia ainda nao trouxe enderecos para liberar
                          no localizador.
                        </Text>
                      </View>
                    ) : (
                      <View style={localStyles.franchiseAddressOptionList}>
                        {addresses.map(address => {
                          const addressId = normalizeShopEntityId(address);
                          const selected =
                            visibleFranchiseAddressIds.includes(addressId);

                          return (
                            <TouchableOpacity
                              key={`shop-franchise-address-inline-${companyId}-${addressId}`}
                              style={[
                                localStyles.franchiseAddressOption,
                                selected &&
                                  localStyles.franchiseAddressOptionActive,
                              ]}
                              activeOpacity={0.85}
                              onPress={() => toggleFranchiseAddress(address)}>
                              <Icon
                                name={
                                  selected
                                    ? 'check-circle'
                                    : 'radio-button-unchecked'
                                }
                                size={20}
                                color={
                                  selected
                                    ? themePalette.iconActive
                                    : themePalette.iconDisabled
                                }
                              />
                              <View style={localStyles.franchiseAddressOptionCopy}>
                                <Text style={localStyles.printerName}>
                                  {resolveAddressLabel(address)}
                                </Text>
                                <Text style={localStyles.printerDevice}>
                                  {resolveAddressDetail(address) ||
                                    'Toque para liberar no mapa'}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          <Text style={localStyles.helperText}>
            {visibleFranchiseAddressIds.length > 0
              ? `${visibleFranchiseAddressIds.length} endereco(s) liberado(s) para o mapa.`
              : 'Nenhum endereco liberado ainda.'}
          </Text>
        </View>

      </GeneralSettingsSection>

      <GeneralSettingsSection
        description="Define quais tipos de itens aparecem no cardapio. Use isso para separar shops de produtos, servicos ou lojas com itens customizaveis."
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
                    selected
                      ? themePalette.iconActive
                      : themePalette.iconDisabled
                  }
                />
                <View style={localStyles.printerCopy}>
                  <Text style={localStyles.printerName}>{option.label}</Text>
                  <Text style={localStyles.printerDevice}>
                    {option.description}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </GeneralSettingsSection>

      <GeneralSettingsSection
        description="Controla como o shop apresenta a cobranca ao cliente. O checkout online continua usando as carteiras e meios integrados da empresa, como Asaas. Quando a opcao abaixo estiver ativa, o cliente tambem pode registrar o pedido para cobrar na entrega usando um meio manual da loja."
        icon="payments"
        iconBackgroundColor={themePalette.cardIconBackground}
        iconColor={themePalette.cardIconColor}
        title="Checkout do shop">
        <ConfigToggleRow
          label="Cobrar na entrega"
          description="Libera uma acao no checkout para registrar pedidos que serao pagos manualmente na entrega."
          palette={themePalette}
          styles={localStyles}
          value={chargeOnDeliveryEnabled}
          onToggle={() =>
            toggleAndSaveBooleanConfig({
              configKey: SHOP_CHARGE_ON_DELIVERY_ENABLED_CONFIG_KEY,
              currentValue: chargeOnDeliveryEnabled,
              saveConfig,
              setValue: setChargeOnDeliveryEnabled,
            })
          }
        />

        <Text style={localStyles.helperText}>
          {chargeOnDeliveryEnabled
            ? 'O checkout exibira a opcao para cobrar na entrega, usando as formas manuais cadastradas nas carteiras da empresa.'
            : 'Quando desativada, o shop oferece apenas as cobrancas online integradas no checkout.'}
        </Text>

        <ConfigToggleRow
          label="Taxa fixa de entrega"
          description="Quando ativada, soma uma taxa de entrega configurada no checkout quando nao houver cotacao automatica."
          palette={themePalette}
          styles={localStyles}
          value={deliveryFeeEnabled}
          onToggle={() =>
            toggleAndSaveBooleanConfig({
              configKey: SHOP_DELIVERY_FEE_ENABLED_CONFIG_KEY,
              currentValue: deliveryFeeEnabled,
              saveConfig,
              setValue: setDeliveryFeeEnabled,
            })
          }
        />

        <View style={localStyles.fieldBlock}>
          <Text style={localStyles.fieldLabel}>Valor da entrega</Text>
          <TextInput
            value={deliveryFeeValue}
            onChangeText={setDeliveryFeeValue}
            onBlur={() =>
              saveConfig(
                SHOP_DELIVERY_FEE_VALUE_CONFIG_KEY,
                normalizeShopMoneyConfig(deliveryFeeValue),
              )
            }
            keyboardType="decimal-pad"
            placeholder="Ex.: 8,90"
            placeholderTextColor={themePalette.inputPlaceholderText}
            style={localStyles.input}
          />
          <Text style={localStyles.helperText}>
            Informe 0 ou deixe vazio para nao cobrar taxa fixa.
          </Text>
        </View>

      </GeneralSettingsSection>

      <GeneralSettingsSection
        description="Prepara a configuracao dos cupons de fidelidade do shop, definindo se a regra fica ativa, quais produtos participam e qual brinde sera entregue."
        icon="redeem"
        iconBackgroundColor={themePalette.cardIconBackground}
        iconColor={themePalette.cardIconColor}
        title="Cupons de fidelidade">
        <ConfigToggleRow
          label="Cupons de fidelidade"
          description="Ativa a regra de acumulo de vendas para liberar um brinde no shop."
          palette={themePalette}
          styles={localStyles}
          value={loyaltyCouponsEnabled}
          onToggle={() =>
            toggleAndSaveBooleanConfig({
              configKey: SHOP_LOYALTY_COUPONS_ENABLED_CONFIG_KEY,
              currentValue: loyaltyCouponsEnabled,
              saveConfig,
              setValue: setLoyaltyCouponsEnabled,
            })
          }
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
            onBlur={() =>
              saveConfig(
                SHOP_LOYALTY_REQUIRED_SALES_CONFIG_KEY,
                normalizeShopLoyaltyRequiredSales(loyaltyRequiredSales),
              )
            }
            keyboardType="number-pad"
            placeholder="Ex.: 10"
            placeholderTextColor={themePalette.inputPlaceholderText}
            style={localStyles.input}
          />
        </View>

        <View style={localStyles.fieldBlock}>
          <Text style={localStyles.fieldLabel}>Produtos participantes</Text>
          <Text style={localStyles.helperText}>
            Abra a lista de produtos da empresa e marque os itens que contam
            para a fidelidade.
          </Text>
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

          {loyaltySearch.isLoading ? (
            <ActivityIndicator
              size="small"
              color={themePalette.loadingSpinner}
              style={localStyles.sectionLoader}
            />
          ) : String(loyaltySearch.query || '').trim() &&
            visibleLoyaltyResults.length === 0 ? (
            <View style={localStyles.emptyBox}>
              <Text style={localStyles.emptyTitle}>
                Nenhum produto encontrado
              </Text>
              <Text style={localStyles.emptyText}>
                Tente outro termo ou abra a lista completa ao lado.
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
                      <Icon
                        name="add-circle"
                        size={20}
                        color={themePalette.cardIconColor}
                      />
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
            <ActivityIndicator
              size="small"
              color={themePalette.loadingSpinner}
              style={localStyles.sectionLoader}
            />
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
                      color={themePalette.iconDanger}
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
            Abra a lista de produtos da empresa e escolha o item que sera
            entregue quando a meta for atingida.
          </Text>
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

          {giftSearch.isLoading ? (
            <ActivityIndicator
              size="small"
              color={themePalette.loadingSpinner}
              style={localStyles.sectionLoader}
            />
          ) : String(giftSearch.query || '').trim() &&
            visibleGiftResults.length === 0 ? (
            <View style={localStyles.emptyBox}>
              <Text style={localStyles.emptyTitle}>
                Nenhum produto encontrado
              </Text>
              <Text style={localStyles.emptyText}>
                Tente outro termo ou abra a lista completa ao lado.
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
                      onPress={() => {
                        selectGiftProduct(product);
                        giftSearch.setQuery('');
                      }}>
                      <Icon
                        name="redeem"
                        size={20}
                        color={themePalette.cardIconColor}
                      />
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

          <View style={localStyles.giftProductResult}>
            {isHydratingGiftProduct ? (
              <ActivityIndicator
                size="small"
                color={themePalette.loadingSpinner}
                style={localStyles.sectionLoader}
              />
            ) : selectedGiftProduct ? (
              <TouchableOpacity
                style={[
                  localStyles.printerItem,
                  localStyles.printerItemActive,
                ]}
                activeOpacity={0.85}
                onPress={clearGiftProduct}>
                <Icon
                  name="card-giftcard"
                  size={20}
                  color={themePalette.cardIconColor}
                />
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
        </View>

      </GeneralSettingsSection>

      <SelectionModal
        visible={franchiseCompanySelectorVisible}
        title="Selecionar franquias visiveis"
        helperText="Toque nas empresas vinculadas para controlar quais franquias podem aparecer no localizador do shop."
        browser={franchiseCompanyBrowser}
        globalStyles={globalStyles}
        onClose={() => setFranchiseCompanySelectorVisible(false)}
        onSelect={toggleFranchiseCompany}
        selectedIds={new Set(visibleFranchiseCompanyIds)}
        multiSelect
        emptyIconName="storefront"
        emptyTitle="Nenhuma franquia encontrada"
        emptyText="Tente outro termo para localizar uma empresa vinculada."
        resolveItemId={normalizeShopEntityId}
        resolveItemLabel={resolveCompanyLabel}
        resolveItemMeta={company =>
          resolveCompanyMeta(company) || 'Toque para selecionar'
        }
        palette={themePalette}
        searchPlaceholder="Pesquisar franquia..."
        selectionMeta={(company, {selected}) =>
          selected
            ? 'Franquia liberada para o localizador'
            : resolveCompanyMeta(company)
        }
        styles={localStyles}
      />

      <SelectionModal
        visible={loyaltySelectorVisible}
        title="Selecionar produtos participantes"
        helperText="Toque nos produtos para adicionar ou remover da regra de fidelidade."
        browser={loyaltyBrowser}
        globalStyles={globalStyles}
        onClose={() => setLoyaltySelectorVisible(false)}
        onSelect={toggleLoyaltyProduct}
        selectedIds={loyaltySelectedIds}
        multiSelect
        emptyIconName="inventory-2"
        emptyTitle="Nenhum produto encontrado"
        emptyText="Tente outro termo para localizar um produto existente."
        resolveItemId={normalizeShopProductId}
        resolveItemLabel={resolveProductLabel}
        resolveItemMeta={product =>
          resolveProductMeta(product) || 'Toque para selecionar'
        }
        palette={themePalette}
        searchPlaceholder="Pesquisar produto..."
        selectionMeta={(product, {selected, multiSelect}) =>
          selected
            ? multiSelect
              ? 'Selecionado para participar da fidelidade'
              : 'Selecionado'
            : resolveProductMeta(product)
        }
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
        resolveItemMeta={product =>
          resolveProductMeta(product) || 'Toque para selecionar'
        }
        palette={themePalette}
        searchPlaceholder="Pesquisar produto..."
        selectionMeta={() => 'Selecionado como brinde'}
        styles={localStyles}
      />
    </>
  );
};

export default ShopSection;
