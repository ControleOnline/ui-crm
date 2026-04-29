const extractId = value => String(value || '').replace(/\D/g, '');

const resolveClientDetailsNavigation = ({
  reference,
  matchedPerson,
  opportunityClient,
  fallbackName,
} = {}) => {
  const normalizedReference = String(reference || '').trim();
  if (!normalizedReference) {
    return null;
  }

  const selectedClient =
    matchedPerson ||
    (typeof opportunityClient === 'object' && opportunityClient
      ? opportunityClient
      : null) || {
      id: extractId(normalizedReference),
      '@id': normalizedReference,
      name: fallbackName,
    };

  const clientId = extractId(normalizedReference);
  if (!clientId) {
    return null;
  }

  const peopleType = String(
    selectedClient?.peopleType ||
      matchedPerson?.peopleType ||
      opportunityClient?.peopleType ||
      '',
  )
    .trim()
    .toUpperCase();

  return {
    selectedClient,
    params: {
      clientId,
      contextKey: 'client',
      initialTab: peopleType === 'J' ? 'sellers' : 'general',
    },
  };
};

module.exports = {
  resolveClientDetailsNavigation,
};
