// Compact header helpers for proposal/contract details: the header must stay a
// single line so the document itself gets the screen (notebooks have ~640px).

const STATUS_LABELS = {
  open: 'Aberta',
  pending: 'Pendente',
  closed: 'Fechada',
  canceled: 'Cancelada',
  cancelled: 'Cancelada',
  'waiting signature': 'Aguardando assinatura',
};

const formatDocumentStatusLabel = status => {
  const raw = String(status?.status || status?.realStatus || status || '').trim();
  if (!raw) {
    return '—';
  }

  return STATUS_LABELS[raw.toLowerCase()] || raw.charAt(0).toUpperCase() + raw.slice(1);
};

const toIsoDay = value => {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
};

const formatDate = value => {
  if (!value) {
    return null;
  }

  const isoDay = toIsoDay(value);
  if (isoDay) {
    const [year, month, day] = isoDay.split('-');
    return `${day}/${month}/${year}`;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString('pt-BR');
};

const formatDocumentPeriod = (startDate, endDate) => {
  const start = formatDate(startDate);
  // An end date before the start is not a real term (legacy data stores the
  // creation date there); show only the start instead of an inverted period.
  const startDay = toIsoDay(startDate);
  const endDay = toIsoDay(endDate);
  const end = startDay && endDay && endDay < startDay ? null : formatDate(endDate);

  if (start && end) {
    return `${start} → ${end}`;
  }
  if (start) {
    return `Início ${start}`;
  }
  if (end) {
    return `Até ${end}`;
  }
  return '';
};

module.exports = {
  formatDocumentPeriod,
  formatDocumentStatusLabel,
};
