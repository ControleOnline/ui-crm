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

const filterProductsByModelCategory = ({ products, selectedModelCategoryId }) => {
  const normalizedProducts = Array.isArray(products) ? products : [];

  if (!selectedModelCategoryId) {
    return normalizedProducts;
  }

  return normalizedProducts.filter(
    product => normalizeCategoryId(product?.category) === selectedModelCategoryId,
  );
};

module.exports = {
  filterProductsByModelCategory,
  getProposalModelCategoryId,
  normalizeCategoryId,
};
