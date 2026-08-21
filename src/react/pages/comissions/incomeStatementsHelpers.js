/**
 * Pure helpers for the company-wide Income Statements view
 * (demonstrativo geral por categorias — inclui comission, royalties e demais).
 *
 * This is NOT the seller commission list, franchise royalties list, or motoboy
 * receivables. Those role-specific views live in separate screens (parent ui-crm#21).
 */

export const MONTH_OPTION_IDS = [
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
];

/** Nature filter: all movements, only receive (receitas), only pay (despesas). */
export const NATURE_OPTIONS = [
  {id: 'all', labelKey: 'all'},
  {id: 'receive', labelKey: 'receive'},
  {id: 'pay', labelKey: 'pay'},
];

/**
 * Normalize parent_categories payload from /income_statements into a stable list.
 * @param {Array|Object|null|undefined} raw
 * @param {(key: string, group: string, fallback: string) => string} [t]
 * @returns {Array<{parentId: string, parentName: string, total: number, categories: Array<{id: string, name: string, total: number}>}>}
 */
export function normalizeParentCategories(raw, t) {
  const translate =
    typeof t === 'function'
      ? t
      : (_g, _k, fallback) => fallback;

  const parentList = Array.isArray(raw) ? raw : Object.values(raw || {});

  return parentList.map(parent => ({
    parentId: parent?.parent_id != null ? String(parent.parent_id) : '',
    parentName:
      parent?.parent_category_name ||
      translate('people', 'label', 'noCategory'),
    total: Number(parent?.total_parent_category_price || 0),
    categories: (
      Array.isArray(parent?.categories_childs)
        ? parent.categories_childs
        : Object.values(parent?.categories_childs || {})
    ).map(category => ({
      id: category?.category_id != null ? String(category.category_id) : '',
      name:
        category?.category_name ||
        translate('people', 'label', 'noCategory'),
      total: Number(category?.category_price || 0),
    })),
  }));
}

/**
 * Build month rows from incomeStatements map for the selected month filter.
 * @param {Object} incomeStatements
 * @param {string|number} selectedMonth - '0' = all months
 * @param {Object.<string,string>} monthLabelById
 * @param {(raw: any) => Array} normalizeParents
 */
export function buildMonthRows(
  incomeStatements,
  selectedMonth,
  monthLabelById,
  normalizeParents = normalizeParentCategories,
) {
  const selectedMonthNumber = parseInt(String(selectedMonth), 10);
  const monthKeys =
    selectedMonthNumber >= 1 && selectedMonthNumber <= 12
      ? [selectedMonthNumber]
      : Object.keys(incomeStatements || {})
          .map(key => parseInt(key, 10))
          .filter(month => month >= 1 && month <= 12)
          .sort((a, b) => a - b);

  return monthKeys
    .map(monthNumber => {
      const monthData =
        incomeStatements?.[monthNumber] ||
        incomeStatements?.[String(monthNumber)] ||
        {};
      const receiveTotal = Number(monthData?.receive?.total_month_price || 0);
      const payTotal = Number(monthData?.pay?.total_month_price || 0);
      const balance = receiveTotal - payTotal;

      return {
        month: monthNumber,
        label:
          monthLabelById?.[String(monthNumber)] ||
          String(monthNumber).padStart(2, '0'),
        receiveTotal,
        payTotal,
        balance,
        receiveParents: normalizeParents(
          monthData?.receive?.parent_categories,
        ),
        payParents: normalizeParents(monthData?.pay?.parent_categories),
      };
    })
    .filter(row => {
      if (selectedMonthNumber >= 1 && selectedMonthNumber <= 12) {
        return true;
      }
      return row.receiveTotal !== 0 || row.payTotal !== 0;
    });
}

/**
 * Filter month rows by nature (receive/pay) and optional category name substring.
 * Keeps grouping by categories (comission, royalties, etc. appear via category names).
 */
export function filterMonthRows(rows, {nature = 'all', categoryQuery = ''} = {}) {
  const query = String(categoryQuery || '')
    .trim()
    .toLowerCase();

  return (rows || [])
    .map(row => {
      let receiveParents = row.receiveParents || [];
      let payParents = row.payParents || [];

      if (query) {
        const matchParent = parent => {
          const parentHit = String(parent.parentName || '')
            .toLowerCase()
            .includes(query);
          const matchedChildren = (parent.categories || []).filter(cat =>
            String(cat.name || '')
              .toLowerCase()
              .includes(query),
          );
          if (parentHit) {
            return parent;
          }
          if (matchedChildren.length === 0) {
            return null;
          }
          return {
            ...parent,
            categories: matchedChildren,
            total: matchedChildren.reduce((sum, c) => sum + Number(c.total || 0), 0),
          };
        };
        receiveParents = receiveParents.map(matchParent).filter(Boolean);
        payParents = payParents.map(matchParent).filter(Boolean);
      }

      if (nature === 'receive') {
        payParents = [];
      } else if (nature === 'pay') {
        receiveParents = [];
      }

      const receiveTotal =
        nature === 'pay'
          ? 0
          : query
            ? receiveParents.reduce((sum, p) => sum + Number(p.total || 0), 0)
            : row.receiveTotal;
      const payTotal =
        nature === 'receive'
          ? 0
          : query
            ? payParents.reduce((sum, p) => sum + Number(p.total || 0), 0)
            : row.payTotal;

      return {
        ...row,
        receiveParents,
        payParents,
        receiveTotal,
        payTotal,
        balance: receiveTotal - payTotal,
      };
    })
    .filter(row => {
      if (nature === 'receive') {
        return row.receiveTotal !== 0 || (row.receiveParents || []).length > 0;
      }
      if (nature === 'pay') {
        return row.payTotal !== 0 || (row.payParents || []).length > 0;
      }
      if (query) {
        return (
          (row.receiveParents || []).length > 0 ||
          (row.payParents || []).length > 0
        );
      }
      return true;
    });
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));
}

/**
 * Build GET params for /income_statements.
 */
export function buildIncomeStatementsParams({
  peopleId,
  year,
  month,
} = {}) {
  const y = parseInt(String(year), 10);
  if (!peopleId || !y) {
    return null;
  }
  const params = {
    people: peopleId,
    year: y,
  };
  const m = parseInt(String(month), 10);
  if (m >= 1 && m <= 12) {
    params.month = m;
  }
  return params;
}
