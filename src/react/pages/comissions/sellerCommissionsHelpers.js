/*
 * Seller commissions helpers — pure functions for grouping, filtering and
 * normalizing invoices of type `comission` (vendedor recebe da empresa).
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

export const buildMonthOptions = translate => {
  const t = typeof translate === 'function' ? translate : () => '';
  return [
    {id: '0', label: t('people', 'month', 'all') || 'Todos'},
    {id: '1', label: t('people', 'month', 'jan') || 'Jan'},
    {id: '2', label: t('people', 'month', 'feb') || 'Fev'},
    {id: '3', label: t('people', 'month', 'mar') || 'Mar'},
    {id: '4', label: t('people', 'month', 'apr') || 'Abr'},
    {id: '5', label: t('people', 'month', 'may') || 'Mai'},
    {id: '6', label: t('people', 'month', 'jun') || 'Jun'},
    {id: '7', label: t('people', 'month', 'jul') || 'Jul'},
    {id: '8', label: t('people', 'month', 'aug') || 'Ago'},
    {id: '9', label: t('people', 'month', 'sep') || 'Set'},
    {id: '10', label: t('people', 'month', 'oct') || 'Out'},
    {id: '11', label: t('people', 'month', 'nov') || 'Nov'},
    {id: '12', label: t('people', 'month', 'dec') || 'Dez'},
  ];
};

export const formatCurrency = value =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));

/**
 * Resolve invoice date (dueDate preferred, then invoice_date / invoiceDate).
 * @returns {Date|null}
 */
export const resolveInvoiceDate = invoice => {
  const raw =
    invoice?.dueDate ||
    invoice?.due_date ||
    invoice?.invoice_date ||
    invoice?.invoiceDate ||
    null;
  if (!raw) return null;
  const date = raw instanceof Date ? raw : new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Extract client People from a comission invoice via linked orders.
 * Supports shapes: order[] → {order:{client}} | {client} | nested hydra.
 */
export const extractClientFromInvoice = invoice => {
  const orderLinks = Array.isArray(invoice?.order)
    ? invoice.order
    : invoice?.order
      ? [invoice.order]
      : [];

  for (const link of orderLinks) {
    const order = link?.order || link;
    const client = order?.client || order?.client_id || null;
    if (!client) continue;
    if (typeof client === 'object') {
      const id = client.id || client.value || null;
      if (id == null) continue;
      return {
        id: Number(id) || id,
        name: client.name || client.alias || client.label || `#${id}`,
        alias: client.alias || '',
      };
    }
    const id = Number(client) || client;
    return {id, name: `#${id}`, alias: ''};
  }
  return null;
};

export const normalizeComissionList = response => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.member)) return response.member;
  if (Array.isArray(response?.['hydra:member'])) return response['hydra:member'];
  if (response && typeof response === 'object') {
    const values = Object.values(response);
    if (values.every(v => v && typeof v === 'object' && (v.id != null || v.price != null))) {
      return values;
    }
  }
  return [];
};

/**
 * Build request params for GET /finance/comission (or invoices?invoiceType=comission).
 * Seller is always the receiver; optional client and period.
 */
export const buildComissionRequestParams = ({
  year,
  month,
  receiverId,
  clientId,
} = {}) => {
  const params = {
    invoiceType: 'comission',
  };

  if (receiverId != null && String(receiverId).trim() !== '') {
    params.receiver = receiverId;
  }

  const yearNumber = parseInt(year, 10);
  if (yearNumber >= 2000 && yearNumber <= 2100) {
    params.year = yearNumber;
  }

  const monthNumber = parseInt(month, 10);
  if (monthNumber >= 1 && monthNumber <= 12) {
    params.month = monthNumber;
  }

  if (clientId != null && String(clientId).trim() !== '') {
    params.client = clientId;
  }

  return params;
};

/**
 * Client-side filter by client id (fallback when API ignores client param).
 */
export const filterInvoicesByClient = (invoices, clientId) => {
  if (clientId == null || String(clientId).trim() === '') {
    return Array.isArray(invoices) ? invoices : [];
  }
  const target = String(clientId);
  return (Array.isArray(invoices) ? invoices : []).filter(invoice => {
    const client = extractClientFromInvoice(invoice);
    return client != null && String(client.id) === target;
  });
};

/**
 * Group invoices by calendar month of the resolved date; optionally restrict to one month.
 * Returns rows sorted by month ascending with total (seller receives).
 */
export const groupCommissionsByMonth = (
  invoices,
  {selectedMonth = '0', year = null, monthLabelById = {}} = {},
) => {
  const list = Array.isArray(invoices) ? invoices : [];
  const yearNumber = year != null ? parseInt(year, 10) : null;
  const selectedMonthNumber = parseInt(selectedMonth, 10);

  const buckets = {};

  list.forEach(invoice => {
    const date = resolveInvoiceDate(invoice);
    if (!date) return;
    if (yearNumber && date.getFullYear() !== yearNumber) return;

    const monthNumber = date.getMonth() + 1;
    if (
      selectedMonthNumber >= 1 &&
      selectedMonthNumber <= 12 &&
      monthNumber !== selectedMonthNumber
    ) {
      return;
    }

    if (!buckets[monthNumber]) {
      buckets[monthNumber] = {
        month: monthNumber,
        label:
          monthLabelById[String(monthNumber)] ||
          String(monthNumber).padStart(2, '0'),
        total: 0,
        count: 0,
        invoices: [],
      };
    }

    const price = Number(invoice?.price ?? invoice?.amount ?? 0);
    buckets[monthNumber].total += price;
    buckets[monthNumber].count += 1;
    buckets[monthNumber].invoices.push(invoice);
  });

  return Object.keys(buckets)
    .map(key => Number(key))
    .sort((a, b) => a - b)
    .map(monthNumber => buckets[monthNumber]);
};

/**
 * Unique clients present in the invoice list (for filter dropdown).
 */
export const collectClientsFromInvoices = invoices => {
  const map = new Map();
  (Array.isArray(invoices) ? invoices : []).forEach(invoice => {
    const client = extractClientFromInvoice(invoice);
    if (!client || client.id == null) return;
    if (!map.has(String(client.id))) {
      map.set(String(client.id), client);
    }
  });
  return Array.from(map.values()).sort((a, b) =>
    String(a.name).localeCompare(String(b.name), 'pt-BR'),
  );
};
