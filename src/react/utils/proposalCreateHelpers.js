const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Marco',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const formatApiError = error => {
  if (!error) return 'Nao foi possivel criar a proposta.';
  if (typeof error === 'string') return error;
  if (Array.isArray(error?.message)) {
    return error.message
      .map(item => item?.message || item?.title || String(item))
      .filter(Boolean)
      .join('\n');
  }

  return error?.message || error?.description || error?.errmsg || 'Nao foi possivel criar a proposta.';
};

const formatProposalStartDate = (year, month, day) => {
  const normalizedYear = String(year || '').replace(/\D/g, '');
  const normalizedMonth = String(month || '').replace(/\D/g, '');
  const normalizedDay = String(day || '').replace(/\D/g, '');

  if (normalizedYear.length !== 4 || !normalizedMonth || !normalizedDay) {
    return null;
  }

  const parsedYear = parseInt(normalizedYear, 10);
  const parsedMonth = parseInt(normalizedMonth, 10);
  const parsedDay = parseInt(normalizedDay, 10);
  const candidate = new Date(parsedYear, parsedMonth - 1, parsedDay);
  const isValidDate =
    candidate.getFullYear() === parsedYear &&
    candidate.getMonth() === parsedMonth - 1 &&
    candidate.getDate() === parsedDay;

  if (!isValidDate) {
    return null;
  }

  return `${normalizedYear}-${normalizedMonth.padStart(2, '0')}-${normalizedDay.padStart(2, '0')}`;
};

module.exports = {
  MONTHS,
  MONTHS_SHORT,
  formatApiError,
  formatProposalStartDate,
};
