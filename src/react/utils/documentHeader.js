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

const formatDate = value => {
  if (!value) {
    return null;
  }

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString('pt-BR');
};

const formatDocumentPeriod = (startDate, endDate) => {
  const start = formatDate(startDate);
  const end = formatDate(endDate);

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
