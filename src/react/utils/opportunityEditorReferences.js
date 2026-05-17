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

const resolveOpportunityEditorOption = (value, options = []) => {
  const identity = getOpportunityEditorReferenceValue(value);

  if (!identity) {
    return value || null;
  }

  return (
    options.find(option => getOpportunityEditorReferenceValue(option) === identity) ||
    value
  );
};

module.exports = {
  getOpportunityEditorReferenceValue,
  resolveOpportunityEditorOption,
};
