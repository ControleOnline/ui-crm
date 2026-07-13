export const GENERAL_SETTINGS_ACTIVE_TAB_STORAGE_KEY =
  'controleonline.general-settings.active-tab';

/*
 * @agents This storage helper remembers the last visible settings tab.
 * The page still validates the stored value against the current available tabs.
 */
const getGeneralSettingsStorage = () => {
  const storage = globalThis?.localStorage;

  if (
    !storage ||
    typeof storage.getItem !== 'function' ||
    typeof storage.setItem !== 'function'
  ) {
    return null;
  }

  return storage;
};

export const readGeneralSettingsActiveTab = () => {
  const storage = getGeneralSettingsStorage();

  if (!storage) {
    return '';
  }

  try {
    return String(storage.getItem(GENERAL_SETTINGS_ACTIVE_TAB_STORAGE_KEY) || '')
      .trim();
  } catch {
    return '';
  }
};

export const writeGeneralSettingsActiveTab = value => {
  const storage = getGeneralSettingsStorage();

  if (!storage) {
    return false;
  }

  const normalizedValue = String(value || '').trim();
  if (!normalizedValue) {
    return false;
  }

  try {
    storage.setItem(GENERAL_SETTINGS_ACTIVE_TAB_STORAGE_KEY, normalizedValue);
    return true;
  } catch {
    return false;
  }
};

export const resolveGeneralSettingsActiveTab = ({
  activeTab,
  availableTabs = [],
  fallbackTab = '',
  storedTab = '',
}) => {
  /*
   * @agents The stored tab is only a preference.
   * If it is no longer available, the current tab or the first valid tab wins.
   */
  const availableTabKeys = availableTabs
    .map(tab => String(tab?.key || '').trim())
    .filter(Boolean);
  const availableTabSet = new Set(availableTabKeys);
  const normalizedStoredTab = String(storedTab || '').trim();
  const normalizedActiveTab = String(activeTab || '').trim();
  const normalizedFallbackTab =
    String(fallbackTab || '').trim() || availableTabKeys[0] || '';

  if (normalizedStoredTab && availableTabSet.has(normalizedStoredTab)) {
    return normalizedStoredTab;
  }

  if (normalizedActiveTab && availableTabSet.has(normalizedActiveTab)) {
    return normalizedActiveTab;
  }

  return normalizedFallbackTab;
};
