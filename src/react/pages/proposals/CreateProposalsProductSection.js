import React from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Formatter from '@controleonline/ui-common/src/utils/formatter';
import styles, {
  inlineStyle_588_28,
  inlineStyle_615_26,
} from './CreateProposalsModal.styles';

const CreateProposalsProductSection = ({
  productQuery,
  onChangeQuery,
  productSearchLoading,
  productResults,
  selectedProducts,
  selectedProductIds,
  onToggleProduct,
  categoryName,
  normalizeEntityId,
}) => {
  const helperText = categoryName
    ? `Somente produtos da categoria "${categoryName}" (modelo selecionado).`
    : 'Escolha os produtos que serao encaminhados agora. Voce podera ajustar depois na proposta.';

  const emptyResultsLabel = categoryName
    ? `Nenhum produto da categoria "${categoryName}" encontrado.`
    : 'Nenhum produto disponivel para esta busca.';

  return (
    <View style={styles.inputGroup}>
      <View style={styles.productsHeader}>
        <View>
          <Text style={styles.inputLabel}>Produtos da proposta</Text>
          <Text style={styles.helperText}>{helperText}</Text>
        </View>
        <View style={styles.selectedCountBadge}>
          <Text style={styles.selectedCountText}>{selectedProducts.length}</Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Icon name="search" size={18} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          value={productQuery}
          onChangeText={onChangeQuery}
          placeholder={
            categoryName ? `Buscar em ${categoryName}...` : 'Buscar produto da empresa...'
          }
          placeholderTextColor="#94A3B8"
        />
        {productSearchLoading && <ActivityIndicator size="small" color="#2529a1" />}
      </View>

      {selectedProducts.length > 0 && (
        <View style={styles.selectedProductsWrap}>
          {selectedProducts.map(product => {
            const productId = normalizeEntityId(product);
            return (
              <View key={product?.['@id'] || productId} style={styles.selectedProductChip}>
                <View style={inlineStyle_588_28}>
                  <Text style={styles.selectedProductTitle} numberOfLines={1}>
                    {product?.product || 'Produto'}
                  </Text>
                  <Text style={styles.selectedProductMeta} numberOfLines={1}>
                    {product?.sku
                      ? `SKU ${product.sku}`
                      : Formatter.formatMoney(Number(product?.price || 0))}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => onToggleProduct(product)}>
                  <Icon name="close" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.productResultsWrap}>
        {productResults.map(product => {
          const productId = normalizeEntityId(product);
          const isSelected = selectedProductIds.has(productId);

          return (
            <TouchableOpacity
              key={product?.['@id'] || productId}
              style={[styles.productRow, isSelected && styles.productRowSelected]}
              onPress={() => onToggleProduct(product)}>
              <View style={inlineStyle_615_26}>
                <Text style={styles.productRowTitle} numberOfLines={1}>
                  {product?.product || 'Produto'}
                </Text>
                <Text style={styles.productRowMeta} numberOfLines={1}>
                  {product?.sku
                    ? `SKU ${product.sku}`
                    : Formatter.formatMoney(Number(product?.price || 0))}
                </Text>
              </View>
              <Icon
                name={isSelected ? 'check-circle' : 'add-circle-outline'}
                size={22}
                color={isSelected ? '#2529a1' : '#94A3B8'}
              />
            </TouchableOpacity>
          );
        })}

        {!productSearchLoading && productResults.length === 0 && (
          <Text style={styles.noProductsText || styles.helperText}>{emptyResultsLabel}</Text>
        )}
      </View>
    </View>
  );
};

export default CreateProposalsProductSection;
