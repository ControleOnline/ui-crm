/*
 * @agents Shared product picker helpers for Loyalty (Fidelidade) settings.
 * ProductSelectionModal reuses the canonical SelectionModal chrome from shop settings.
 */
import React, {useEffect, useState} from 'react';
import {normalizeShopProductId} from '@controleonline/ui-common/src/react/utils/shopConfig';
import {searchCompanyProducts} from '@controleonline/ui-common/src/react/utils/commercialDocumentOrders';
import {
  filterProductsByCompany,
  normalizeLoyaltyCompanyId,
} from './loyaltyProductCompany';
import {SelectionModal} from './shop/shopSettingsShared';

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
}) => (
  <SelectionModal
    visible={visible}
    title={title}
    helperText={helperText}
    browser={browser}
    globalStyles={globalStyles}
    onClose={onClose}
    onSelect={onSelect}
    selectedIds={selectedIds}
    selectedItemId={selectedItemId}
    multiSelect={multiSelect}
    emptyIconName="inventory-2"
    emptyTitle="Nenhum produto encontrado"
    emptyText="Tente outro termo para localizar um produto existente."
    resolveItemId={normalizeShopProductId}
    resolveItemLabel={resolveProductLabel}
    resolveItemMeta={product =>
      resolveProductMeta(product) || 'Toque para selecionar'
    }
    searchPlaceholder="Pesquisar produto..."
    selectionMeta={() =>
      multiSelect
        ? 'Selecionado para participar da fidelidade'
        : 'Selecionado como brinde'
    }
    palette={palette}
    styles={styles}
  />
);
