/*
 * @agents Shared shop settings UI helpers (selection, product search, labels).
 */
import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AnimatedModal from '@controleonline/ui-common/src/react/components/AnimatedModal';
import {searchCompanyProducts} from '@controleonline/ui-common/src/react/utils/commercialDocumentOrders';
import {buildAddressOptionSummary} from '@controleonline/ui-common/src/react/utils/entityDisplay';
import {resolveFranchiseCompanyLabel} from '@controleonline/ui-common/src/react/utils/shopFranchises';
import {normalizeShopEntityId, normalizeShopProductId} from '@controleonline/ui-common/src/react/utils/shopConfig';

export const resolveProductLabel = product => {
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

export const resolveProductMeta = product => {
  const sku = String(product?.sku || '').trim();
  const price = Number(product?.price || 0);
  const priceLabel = Number.isFinite(price)
    ? `R$ ${price.toFixed(2).replace('.', ',')}`
    : '';

  return [sku ? `SKU ${sku}` : null, price > 0 ? priceLabel : null]
    .filter(Boolean)
    .join(' • ');
};

export const resolveCompanyLabel = company =>
  resolveFranchiseCompanyLabel(company) || 'Franquia';

export const resolveCompanyMeta = company => {
  const documentLabel = Array.isArray(company?.document)
    ? String(company?.document?.[0]?.document || '').trim()
    : String(company?.document?.document || company?.document || '').trim();

  return documentLabel || 'Empresa vinculada como franquia';
};

export const resolveAddressLabel = address => {
  const summary = buildAddressOptionSummary(address);
  return summary.primary || address?.nickname || 'Endereco';
};

export const resolveAddressDetail = address => {
  const summary = buildAddressOptionSummary(address);

  return [
    summary.secondary,
    address?.searchFor,
    address?.openingHours,
  ]
    .filter(Boolean)
    .join(' • ');
};

export const buildNormalizedSearchText = (...values) =>
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

export const filterSelectableItems = ({
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

export const ConfigToggleRow = ({description, label, onToggle, palette, styles, value}) => (
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

export const useShopProductBrowser = ({companyId, visible}) => {
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

export const useShopProductSearch = companyId => {
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

export const useLocalSelectionBrowser = ({items, visible, resolveSearchText}) => {
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

export const SelectionModal = ({
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

