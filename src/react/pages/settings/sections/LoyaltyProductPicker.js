/*
 * @agents Shared product picker helpers for Loyalty (Fidelidade) settings.
 * ProductSelectionModal reuses the canonical SelectionModal chrome from shop settings.
 */
import React from 'react';
import {normalizeShopProductId} from '@controleonline/ui-common/src/react/utils/shopConfig';
import {
  SelectionModal,
  resolveProductLabel as resolveSharedProductLabel,
  resolveProductMeta as resolveSharedProductMeta,
  useShopProductBrowser,
} from './shop/shopSettingsShared';

export const resolveProductLabel = resolveSharedProductLabel;
export const resolveProductMeta = resolveSharedProductMeta;
export const useProductBrowser = useShopProductBrowser;

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
