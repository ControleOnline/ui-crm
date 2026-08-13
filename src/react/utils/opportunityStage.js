const getStageColor = status => {
  const colors = {
    open: '#e67e22',
    closed: '#10b981',
    pending: '#3498db',
    canceled: '#c10015',
  };
  return colors[status];
};

const getStageLabel = status => {
  const labels = {
    open: global.t?.t('people', 'status', 'open'),
    closed: global.t?.t('people', 'status', 'closed'),
    pending: global.t?.t('people', 'status', 'pending'),
    canceled: global.t?.t('people', 'status', 'canceled'),
  };
  return labels[status] || status || global.t?.t('people', 'status', 'noStatus');
};

const getColorWithAlpha = (colorValue, alpha = '20') => {
  const color = String(colorValue || '').trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? `${color}${alpha}` : '#EEF2FF';
};

module.exports = {
  getColorWithAlpha,
  getStageColor,
  getStageLabel,
};
