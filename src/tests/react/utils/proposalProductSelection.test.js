const test = require('node:test');
const assert = require('node:assert/strict');

const {
  collectProductCategoryIds,
  filterProductsByModelCategory,
  getProposalModelCategoryId,
  getProposalModelCategoryName,
  keepCompatibleSelectedProducts,
  normalizeCategoryId,
  productMatchesModelCategory,
} = require('../../../react/utils/proposalProductSelection');

test('normalizeCategoryId resolves nested category references', () => {
  assert.equal(normalizeCategoryId({ category: { '@id': '/categories/7' } }), '7');
  assert.equal(normalizeCategoryId({ parent: '/categories/9' }), '9');
  assert.equal(normalizeCategoryId('/categories/3'), '3');
});

test('getProposalModelCategoryId reads the selected model category', () => {
  assert.equal(
    getProposalModelCategoryId({ category: { '@id': '/categories/12' } }),
    '12',
  );
  assert.equal(getProposalModelCategoryId({}), null);
  assert.equal(getProposalModelCategoryId(null), null);
});

test('getProposalModelCategoryName returns human label when present', () => {
  assert.equal(
    getProposalModelCategoryName({ category: { name: 'SERVICOS' } }),
    'SERVICOS',
  );
  assert.equal(getProposalModelCategoryName({ category: {} }), '');
});

test('collectProductCategoryIds reads productCategory join collection', () => {
  const product = {
    '@id': '/products/1',
    productCategory: [
      { category: { '@id': '/categories/4' } },
      { category: '/categories/9' },
    ],
  };

  assert.deepEqual([...collectProductCategoryIds(product)].sort(), ['4', '9']);
});

test('filterProductsByModelCategory keeps matching products via product.category', () => {
  const products = [
    { '@id': '/products/1', category: { '@id': '/categories/4' } },
    { '@id': '/products/2', category: { '@id': '/categories/7' } },
    { '@id': '/products/3', category: { parent: '/categories/4' } },
  ];

  assert.deepEqual(
    filterProductsByModelCategory({
      products,
      selectedModelCategoryId: '4',
    }),
    [products[0], products[2]],
  );
});

test('filterProductsByModelCategory keeps matching products via productCategory join', () => {
  const products = [
    {
      '@id': '/products/10',
      productCategory: [{ category: { '@id': '/categories/4', name: 'Serviços' } }],
    },
    {
      '@id': '/products/11',
      productCategory: [{ category: { '@id': '/categories/8' } }],
    },
  ];

  assert.deepEqual(
    filterProductsByModelCategory({
      products,
      selectedModelCategoryId: '4',
    }),
    [products[0]],
  );
});

test('filterProductsByModelCategory keeps sparse products when categories are not embedded', () => {
  // product:read often omits productCategory; API filter is the source of truth.
  const products = [{ '@id': '/products/1' }, { '@id': '/products/2' }];

  assert.deepEqual(
    filterProductsByModelCategory({
      products,
      selectedModelCategoryId: '4',
    }),
    products,
  );
});

test('filterProductsByModelCategory preserves the original list when the model has no category', () => {
  const products = [{ '@id': '/products/1' }, { '@id': '/products/2' }];

  assert.deepEqual(
    filterProductsByModelCategory({
      products,
      selectedModelCategoryId: '',
    }),
    products,
  );
});

test('keepCompatibleSelectedProducts drops selections outside the model category', () => {
  const selectedProducts = [
    { '@id': '/products/1', category: { '@id': '/categories/4' } },
    { '@id': '/products/2', category: { '@id': '/categories/9' } },
  ];

  assert.deepEqual(
    keepCompatibleSelectedProducts({
      selectedProducts,
      selectedModelCategoryId: '4',
    }),
    [selectedProducts[0]],
  );
});

test('productMatchesModelCategory accepts join-based membership', () => {
  const product = {
    productCategory: [{ category: '/categories/15' }],
  };
  assert.equal(productMatchesModelCategory(product, '15'), true);
  assert.equal(productMatchesModelCategory(product, '99'), false);
});
