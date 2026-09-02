/*
 * @agents Shared product picker helpers for Loyalty (Fidelidade) settings.
 */
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AnimatedModal from '@controleonline/ui-common/src/react/components/AnimatedModal';
import {searchCompanyProducts} from '@controleonline/ui-common/src/react/utils/commercialDocumentOrders';
import {normalizeShopProductId} from '@controleonline/ui-common/src/react/utils/shopConfig';
import {
  filterProductsByCompany,
  normalizeLoyaltyCompanyId,
} from './loyaltyProductCompany';

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

export const resolveProductMetaParts = product => {
  const sku = String(product?.sku || '').trim();
  const price = Number(product?.price || 0);
  const priceLabel =
    Number.isFinite(price) && price > 0
      ? `R$ ${price.toFixed(2).replace('.', ',')}`
      : '';

  return {
    sku: sku ? `SKU ${sku}` : '',
    priceLabel,
    metaLine: [sku ? `SKU ${sku}` : null].filter(Boolean).join(' • '),
  };
};

/** Prefer resolveProductMetaParts when layout needs price separated. */
export const resolveProductMeta = product => {
  const {sku, priceLabel} = resolveProductMetaParts(product);
  return [sku || null, priceLabel || null].filter(Boolean).join(' • ');
};

export const useProductBrowser = ({companyId, visible}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const scopedCompanyId = normalizeLoyaltyCompanyId(companyId);

  useEffect(() => {
    if (!visible || !scopedCompanyId) {
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
          companyId: scopedCompanyId,
          query: trimmedQuery,
        });
        if (!cancelled) {
          setResults(filterProductsByCompany(items, scopedCompanyId));
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
  }, [scopedCompanyId, query, visible]);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setResults([]);
      setIsLoading(false);
    }
  }, [visible]);

  return {isLoading, query, results, setQuery};
};

export const ProductSelectionModal = ({
  visible,
  title,
  helperText,
  browser,
  onClose,
  onSelect,
  selectedIds,
  selectedItemId,
  multiSelect = false,
  palette,
  styles,
  globalStyles,
}) => {
  const selectedSet = selectedIds || new Set();
  const selectedId = String(selectedItemId || '').trim();

  return (
    <AnimatedModal visible={visible} onRequestClose={onClose}>
      <View style={styles.selectionModal}>
        <View style={styles.selectionModalHeader}>
          <View style={styles.selectionModalHeaderCopy}>
            <Text style={styles.selectionModalTitle}>{title}</Text>
            {helperText ? (
              <Text style={styles.selectionModalSubtitle}>{helperText}</Text>
            ) : null}
          </View>
          <TouchableOpacity
            style={styles.selectionModalClose}
            onPress={onClose}
            activeOpacity={0.85}>
            <Icon name="close" size={20} color={palette.iconDefault} />
          </TouchableOpacity>
        </View>

        <View style={styles.selectorRow}>
          <Icon
            name="search"
            size={18}
            color={palette.iconMuted}
            style={{marginRight: 8}}
          />
          <TextInput
            value={browser.query}
            onChangeText={browser.setQuery}
            placeholder="Pesquisar produto..."
            placeholderTextColor={palette.inputPlaceholderText}
            style={[styles.input, styles.selectorInput, {flex: 1}]}
            returnKeyType="search"
          />
        </View>

        <ScrollView
          style={styles.selectionModalList}
          contentContainerStyle={styles.selectionModalListContent}
          keyboardShouldPersistTaps="handled">
          {browser.isLoading ? (
            <ActivityIndicator
              size="small"
              color={palette.loadingSpinner}
              style={styles.sectionLoader}
            />
          ) : browser.results.length === 0 ? (
            <View style={styles.searchEmptyState}>
              <Icon name="inventory-2" size={28} color={palette.iconMuted} />
              <Text style={styles.searchEmptyStateTitle}>
                Nenhum produto encontrado
              </Text>
              <Text style={styles.searchEmptyStateText}>
                {String(browser.query || '').trim()
                  ? 'Tente outro termo para localizar um produto existente.'
                  : 'Nenhum item disponível apareceu para seleção.'}
              </Text>
            </View>
          ) : (
            browser.results.map(item => {
              const itemId = normalizeShopProductId(item);
              const selected = multiSelect
                ? selectedSet.has(itemId)
                : itemId === selectedId;

              return (
                <TouchableOpacity
                  key={`loyalty-picker-${itemId}`}
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
                    <Text style={styles.selectionModalItemTitle} numberOfLines={2}>
                      {resolveProductLabel(item)}
                    </Text>
                    <Text style={styles.selectionModalItemMeta} numberOfLines={1}>
                      {selected
                        ? multiSelect
                          ? 'Selecionado para participar da fidelidade'
                          : 'Selecionado como brinde'
                        : resolveProductMetaParts(item).metaLine ||
                          resolveProductMetaParts(item).sku ||
                          'Toque para selecionar'}
                    </Text>
                  </View>
                  {!!resolveProductMetaParts(item).priceLabel && (
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '700',
                        color: palette.iconSuccess || palette.success,
                        marginLeft: 8,
                      }}>
                      {resolveProductMetaParts(item).priceLabel}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        {multiSelect ? (
          <TouchableOpacity
            style={[
              globalStyles.button,
              styles.primaryButton,
              styles.selectionModalActionButton,
            ]}
            onPress={onClose}>
            <Text style={styles.primaryButtonText}>Concluir seleção</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </AnimatedModal>
  );
};
