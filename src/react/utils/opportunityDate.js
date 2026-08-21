const getCurrentDateComponents = () => {
  const today = new Date();
  return {
    day: String(today.getDate()).padStart(2, '0'),
    month: String(today.getMonth() + 1).padStart(2, '0'),
    year: String(today.getFullYear()),
  };
};

const formatDate = dateString => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-br', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatDateForInput = dateString => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateComponents = dateString => {
  if (!dateString) {
    return { day: '', month: '', year: '' };
  }
  const date = new Date(dateString);
  return {
    day: String(date.getDate()).padStart(2, '0'),
    month: String(date.getMonth() + 1).padStart(2, '0'),
    year: String(date.getFullYear()),
  };
};

const formatDateFromComponents = (day, month, year) => {
  if (!day || !month || !year) {
    return '';
  }
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

const getDaysArray = () => {
  return Array.from({ length: 31 }, (_, i) => ({
    id: String(i + 1).padStart(2, '0'),
    name: String(i + 1).padStart(2, '0'),
  }));
};

const getMonthsArray = () => {
  const months = [
    global.t?.t('people', 'month', 'january'),
    global.t?.t('people', 'month', 'february'),
    global.t?.t('people', 'month', 'march'),
    global.t?.t('people', 'month', 'april'),
    global.t?.t('people', 'month', 'may'),
    global.t?.t('people', 'month', 'june'),
    global.t?.t('people', 'month', 'july'),
    global.t?.t('people', 'month', 'august'),
    global.t?.t('people', 'month', 'september'),
    global.t?.t('people', 'month', 'october'),
    global.t?.t('people', 'month', 'november'),
    global.t?.t('people', 'month', 'december'),
  ];
  return months.map((month, index) => ({
    id: String(index + 1).padStart(2, '0'),
    name: month,
  }));
};

module.exports = {
  formatDate,
  formatDateForInput,
  formatDateFromComponents,
  getCurrentDateComponents,
  getDaysArray,
  getMonthsArray,
  parseDateComponents,
};
