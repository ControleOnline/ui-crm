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

const normalizeCategoryId = value =>
  normalizeEntityId(
    value?.category ||
      value?.parent ||
      value?.['@id'] ||
      value?.id ||
      value,
  );

const getProposalModelCategoryId = model => normalizeCategoryId(model?.category);

const getProposalModelCategoryName = model =>
  String(model?.category?.name || model?.category?.category || '').trim();

// Products returned by a search already filtered on the server by
// `productCategory.category` carry this tag, because the product payload does
// not always embed its productCategory relation.
const MODEL_CATEGORY_TAG = 'proposalModelCategoryId';

const tagProductsWithModelCategory = ({ products, selectedModelCategoryId }) => {
  const normalizedProducts = Array.isArray(products) ? products : [];
  if (!selectedModelCategoryId) {
    return normalizedProducts;
  }

  return normalizedProducts.map(product => ({
    ...product,
    [MODEL_CATEGORY_TAG]: String(selectedModelCategoryId),
  }));
};

// Mirrors the backend rule (ProposalProductCategoryGuard): the product belongs
// to the model category when one of its product_categories points to it.
const productBelongsToCategory = (product, categoryId) => {
  const expectedId = normalizeEntityId(categoryId);
  if (!expectedId) {
    return true;
  }

  if (normalizeEntityId(product?.[MODEL_CATEGORY_TAG]) === expectedId) {
    return true;
  }

  const productCategories = Array.isArray(product?.productCategory)
    ? product.productCategory
    : [];
  if (
    productCategories.some(
      productCategory => normalizeCategoryId(productCategory) === expectedId,
    )
  ) {
    return true;
  }

  return !!product?.category && normalizeCategoryId(product.category) === expectedId;
};

const filterProductsByModelCategory = ({ products, selectedModelCategoryId }) => {
  const normalizedProducts = Array.isArray(products) ? products : [];

  if (!selectedModelCategoryId) {
    return normalizedProducts;
  }

  return normalizedProducts.filter(product =>
    productBelongsToCategory(product, selectedModelCategoryId),
  );
};

const keepCompatibleSelectedProducts = ({ selectedProducts, selectedModelCategoryId }) => {
  if (!selectedModelCategoryId) {
    return Array.isArray(selectedProducts) ? selectedProducts : [];
  }

  return filterProductsByModelCategory({
    products: selectedProducts,
    selectedModelCategoryId,
  });
};

module.exports = {
  MODEL_CATEGORY_TAG,
  filterProductsByModelCategory,
  getProposalModelCategoryId,
  getProposalModelCategoryName,
  keepCompatibleSelectedProducts,
  normalizeCategoryId,
  normalizeEntityId,
  productBelongsToCategory,
  tagProductsWithModelCategory,
};
