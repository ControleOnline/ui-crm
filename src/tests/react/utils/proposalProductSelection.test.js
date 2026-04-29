const test = require('node:test');
const assert = require('node:assert/strict');

const {
  filterProductsByModelCategory,
  getProposalModelCategoryId,
  normalizeCategoryId,
} = require('../../../react/utils/proposalProductSelection');

test('normalizeCategoryId resolves nested category references', () => {
  assert.equal(normalizeCategoryId({ category: { '@id': '/categories/7' } }), '7');
  assert.equal(normalizeCategoryId({ parent: '/categories/9' }), '9');
});

test('getProposalModelCategoryId reads the selected model category', () => {
  assert.equal(
    getProposalModelCategoryId({ category: { '@id': '/categories/12' } }),
    '12',
  );
  assert.equal(getProposalModelCategoryId({}), null);
});

test('filterProductsByModelCategory keeps only matching products when a category is selected', () => {
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
