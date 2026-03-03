const formatTranslationKey = key => {
  if (!key) return '';

  return String(key)
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/^\w/, c => c.toUpperCase());
};

export const translateWithFallback = (store, type, key, fallback) => {
  const translated = global.t?.t(store, type, key);
  const formattedKey = formatTranslationKey(key);
  let configLanguage = '';
  try {
    if (typeof localStorage !== 'undefined') {
      configLanguage = JSON.parse(localStorage.getItem('config') || '{}').language || '';
    }
  } catch (e) {}

  const language = String(global.t?.language || configLanguage || 'pt-BR')
    .trim()
    .replace('_', '-')
    .toLowerCase();
  const isPtBr = language === 'pt-br';

  if (!fallback) {
    return translated || formattedKey;
  }

  if (isPtBr) {
    return fallback;
  }

  if (!translated || translated === formattedKey) {
    return fallback;
  }

  return translated;
};

export default translateWithFallback;
