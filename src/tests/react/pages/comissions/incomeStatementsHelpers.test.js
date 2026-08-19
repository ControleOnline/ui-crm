const {describe, it} = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeParentCategories,
  buildMonthRows,
  filterMonthRows,
  buildIncomeStatementsParams,
  formatCurrency,
} = require('../../../../react/pages/comissions/incomeStatementsHelpers.js');

describe('normalizeParentCategories', () => {
  it('normalizes array payload with children', () => {
    const raw = [
      {
        parent_id: 1,
        parent_category_name: 'Comissões',
        total_parent_category_price: '150.5',
        categories_childs: [
          {category_id: 10, category_name: 'comission', category_price: '100'},
          {category_id: 11, category_name: 'royalties', category_price: '50.5'},
        ],
      },
    ];
    const result = normalizeParentCategories(raw);
    assert.equal(result.length, 1);
    assert.equal(result[0].parentName, 'Comissões');
    assert.equal(result[0].total, 150.5);
    assert.equal(result[0].categories.length, 2);
    assert.equal(result[0].categories[0].name, 'comission');
    assert.equal(result[0].categories[1].total, 50.5);
  });

  it('normalizes object map payload', () => {
    const raw = {
      a: {
        parent_id: 'p1',
        parent_category_name: 'Royalties',
        total_parent_category_price: 20,
        categories_childs: {
          x: {category_id: 'c1', category_name: 'royalties', category_price: 20},
        },
      },
    };
    const result = normalizeParentCategories(raw);
    assert.equal(result[0].parentId, 'p1');
    assert.equal(result[0].categories[0].id, 'c1');
  });

  it('handles empty input', () => {
    assert.deepEqual(normalizeParentCategories(null), []);
    assert.deepEqual(normalizeParentCategories(undefined), []);
    assert.deepEqual(normalizeParentCategories({}), []);
  });
});

describe('buildMonthRows', () => {
  const statements = {
    1: {
      receive: {
        total_month_price: 100,
        parent_categories: [
          {
            parent_id: 1,
            parent_category_name: 'Comissões',
            total_parent_category_price: 100,
            categories_childs: [],
          },
        ],
      },
      pay: {total_month_price: 40, parent_categories: []},
    },
    2: {
      receive: {total_month_price: 0, parent_categories: []},
      pay: {total_month_price: 0, parent_categories: []},
    },
  };
  const labels = {1: 'jan', 2: 'feb'};

  it('builds all non-zero months when selectedMonth is 0', () => {
    const rows = buildMonthRows(statements, '0', labels);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].month, 1);
    assert.equal(rows[0].balance, 60);
    assert.equal(rows[0].label, 'jan');
  });

  it('builds only the selected month even if zero', () => {
    const rows = buildMonthRows(statements, '2', labels);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].month, 2);
    assert.equal(rows[0].balance, 0);
  });
});

describe('filterMonthRows', () => {
  const rows = [
    {
      month: 1,
      label: 'jan',
      receiveTotal: 100,
      payTotal: 40,
      balance: 60,
      receiveParents: [
        {
          parentId: '1',
          parentName: 'Comissões',
          total: 80,
          categories: [
            {id: '10', name: 'comission', total: 80},
          ],
        },
        {
          parentId: '2',
          parentName: 'Outros',
          total: 20,
          categories: [{id: '20', name: 'service', total: 20}],
        },
      ],
      payParents: [
        {
          parentId: '3',
          parentName: 'Royalties',
          total: 40,
          categories: [{id: '30', name: 'royalties', total: 40}],
        },
      ],
    },
  ];

  it('filters by nature receive', () => {
    const filtered = filterMonthRows(rows, {nature: 'receive'});
    assert.equal(filtered[0].payTotal, 0);
    assert.equal(filtered[0].receiveTotal, 100);
    assert.equal(filtered[0].payParents.length, 0);
  });

  it('filters by category query matching royalties', () => {
    const filtered = filterMonthRows(rows, {categoryQuery: 'royalt'});
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].payParents.length, 1);
    assert.equal(filtered[0].payParents[0].parentName, 'Royalties');
    assert.equal(filtered[0].receiveParents.length, 0);
  });

  it('filters by category query matching comission child', () => {
    const filtered = filterMonthRows(rows, {categoryQuery: 'comission'});
    assert.equal(filtered[0].receiveParents.length, 1);
    assert.equal(filtered[0].receiveParents[0].categories[0].name, 'comission');
  });
});

describe('buildIncomeStatementsParams', () => {
  it('returns null without people or year', () => {
    assert.equal(buildIncomeStatementsParams({}), null);
    assert.equal(buildIncomeStatementsParams({peopleId: 1}), null);
  });

  it('includes month only when 1-12', () => {
    const withMonth = buildIncomeStatementsParams({
      peopleId: 9,
      year: '2026',
      month: '3',
    });
    assert.deepEqual(withMonth, {people: 9, year: 2026, month: 3});

    const allMonths = buildIncomeStatementsParams({
      peopleId: 9,
      year: 2026,
      month: '0',
    });
    assert.deepEqual(allMonths, {people: 9, year: 2026});
  });
});

describe('formatCurrency', () => {
  it('formats BRL', () => {
    const text = formatCurrency(1234.5);
    assert.match(text, /1\.234,50|R\$/);
  });
});
