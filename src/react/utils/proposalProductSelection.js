const normalizeEntityId = value => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return null;
    }

    const entityIdMatch = trimmedValue.match(/\/([^/]+)\/?$/);
    return entityIdMatch?.[1] || trimmedValue;
  }

  if (typeof value === 'object') {
    return normalizeEntityId(value['@id'] || value.id || value.value);
  }

  return String(value);
};

/**
 * Resolve a category id from common payload shapes:
 * - plain id / IRI / Category object
 * - product.category (legacy / sparse payloads)
 * - product.productCategory[] (ProductCategory join entities)
 * - nested { category: ... } wrappers
 */
const normalizeCategoryId = value => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const resolved = normalizeCategoryId(entry);
      if (resolved) {
        return resolved;
      }
    }
    return null;
  }

  if (typeof value === 'object') {
    // ProductCategory join: { category: Category|IRI, product: ... }
    if (value.category !== undefined && value.category !== null) {
      return normalizeCategoryId(value.category);
    }

    // Category entity or sparse object
    if (value.parent !== undefined && value.parent !== null && !value['@id'] && !value.id) {
      return normalizeCategoryId(value.parent);
    }

    return normalizeEntityId(value['@id'] || value.id || value.value || value.parent);
  }

  return normalizeEntityId(value);
};

const collectProductCategoryIds = product => {
  const ids = new Set();

  const pushId = candidate => {
    const id = normalizeCategoryId(candidate);
    if (id) {
      ids.add(id);
    }
  };

  if (!product || typeof product !== 'object') {
    return ids;
  }

  // Legacy / sparse single category field
  pushId(product.category);

  // Canonical join collection from Product::productCategory
  const joinCollection =
    product.productCategory ||
    product.productCategories ||
    product.categories ||
    product.product_category;

  if (Array.isArray(joinCollection)) {
    joinCollection.forEach(entry => {
      pushId(entry);
      pushId(entry?.category);
    });
  } else if (joinCollection) {
    pushId(joinCollection);
    pushId(joinCollection?.category);
  }

  return ids;
};

const getProposalModelCategoryId = model => normalizeCategoryId(model?.category);

const getProposalModelCategoryName = model =>
  String(model?.category?.name || model?.category?.category || '').trim();

const productMatchesModelCategory = (product, selectedModelCategoryId) => {
  if (!selectedModelCategoryId) {
    return true;
  }

  const productCategoryIds = collectProductCategoryIds(product);
  if (productCategoryIds.size === 0) {
    // When the payload does not embed categories, do not client-side-reject:
    // the API filter (productCategory.category) is the source of truth.
    return true;
  }

  return productCategoryIds.has(String(selectedModelCategoryId));
};

const filterProductsByModelCategory = ({ products, selectedModelCategoryId }) => {
  const normalizedProducts = Array.isArray(products) ? products : [];

  if (!selectedModelCategoryId) {
    return normalizedProducts;
  }

  return normalizedProducts.filter(product =>
    productMatchesModelCategory(product, selectedModelCategoryId),
  );
};

const keepCompatibleSelectedProducts = ({ selectedProducts, selectedModelCategoryId }) => {
  if (!selectedModelCategoryId) {
    return Array.isArray(selectedProducts) ? selectedProducts : [];
  }

  const list = Array.isArray(selectedProducts) ? selectedProducts : [];

  return list.filter(product => {
    const productCategoryIds = collectProductCategoryIds(product);
    // Keep selection when we cannot prove incompatibility from sparse payload
    if (productCategoryIds.size === 0) {
      return true;
    }
    return productCategoryIds.has(String(selectedModelCategoryId));
  });
};

module.exports = {
  collectProductCategoryIds,
  filterProductsByModelCategory,
  getProposalModelCategoryId,
  getProposalModelCategoryName,
  keepCompatibleSelectedProducts,
  normalizeCategoryId,
  normalizeEntityId,
  productMatchesModelCategory,
};
