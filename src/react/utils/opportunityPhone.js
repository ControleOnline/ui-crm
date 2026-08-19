const sanitizePhoneValue = value =>
  String(value || '')
    .replace(/\D/g, '')
    .slice(0, 11);

const hasDuplicatePhones = phones => {
  const uniquePhones = new Set();

  for (const phone of phones) {
    if (uniquePhones.has(phone)) {
      return true;
    }
    uniquePhones.add(phone);
  }

  return false;
};

const formatPhoneValue = value => {
  const digits = sanitizePhoneValue(value);
  if (!digits) {
    return '';
  }

  const ddd = digits.slice(0, 2);
  const number = digits.slice(2);

  if (digits.length <= 2) {
    return `(${ddd}`;
  }

  if (number.length <= 4) {
    return `(${ddd}) ${number}`;
  }

  if (number.length <= 8) {
    return `(${ddd}) ${number.slice(0, 4)}-${number.slice(4)}`;
  }

  return `(${ddd}) ${number.slice(0, 5)}-${number.slice(5, 9)}`;
};

const parsePhoneNumbers = announce => {
  if (!announce) {
    return [];
  }

  const asFormattedList = value => {
    const formatted = formatPhoneValue(value);
    return formatted ? [formatted] : [];
  };

  try {
    const parsed = JSON.parse(announce);

    if (Array.isArray(parsed)) {
      return parsed.map(item => formatPhoneValue(item)).filter(Boolean);
    }

    if (typeof parsed === 'string' || typeof parsed === 'number') {
      return asFormattedList(parsed);
    }

    if (parsed && typeof parsed === 'object') {
      const mergedPhone = parsed.ddd && parsed.phone
        ? `${parsed.ddd}${parsed.phone}`
        : parsed.phone || parsed.number || parsed.value;
      return asFormattedList(mergedPhone);
    }

    return [];
  } catch {
    return asFormattedList(announce);
  }
};

module.exports = {
  formatPhoneValue,
  hasDuplicatePhones,
  parsePhoneNumbers,
  sanitizePhoneValue,
};
