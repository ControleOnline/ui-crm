const getOpportunityEditorReferenceValue = value => {
  if (!value) {
    return '';
  }

  const rawValue =
    typeof value === 'object'
      ? value['@id'] ?? value.id ?? value.value
      : value;

  return String(rawValue || '').trim();
};

const getComparableOpportunityEditorReferenceValue = value => {
  const identity = getOpportunityEditorReferenceValue(value);

  if (!identity) {
    return '';
  }

  const match = identity.match(/\/(\d+)$/);
  return match ? match[1] : identity;
};

const resolveOpportunityEditorOption = (value, options = []) => {
  const identity = getComparableOpportunityEditorReferenceValue(value);

  if (!identity) {
    return value || null;
  }

  return (
    options.find(
      option =>
        getComparableOpportunityEditorReferenceValue(option) === identity,
    ) || value
  );
};

module.exports = {
  getOpportunityEditorReferenceValue,
  resolveOpportunityEditorOption,
};
