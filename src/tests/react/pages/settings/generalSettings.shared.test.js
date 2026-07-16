const {afterEach, beforeEach, describe, it} = global;
const assert = require('node:assert/strict');

const {
  GENERAL_SETTINGS_ACTIVE_TAB_STORAGE_KEY,
  readGeneralSettingsActiveTab,
  resolveGeneralSettingsActiveTab,
  writeGeneralSettingsActiveTab,
} = require('../../../../react/pages/settings/generalSettingsActiveTab');

describe('generalSettings shared helpers', () => {
  const originalLocalStorage = global.localStorage;

  beforeEach(() => {
    const store = {};
    Object.defineProperty(global, 'localStorage', {
      configurable: true,
      value: {
        getItem: key =>
          Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null,
        setItem: (key, value) => {
          store[key] = String(value);
        },
        removeItem: key => {
          delete store[key];
        },
      },
      writable: true,
    });
  });

  afterEach(() => {
    if (originalLocalStorage === undefined) {
      delete global.localStorage;
      return;
    }

    Object.defineProperty(global, 'localStorage', {
      configurable: true,
      value: originalLocalStorage,
      writable: true,
    });
  });

  it('prefers the stored tab when it is still available', () => {
    assert.equal(
      resolveGeneralSettingsActiveTab({
        activeTab: 'devices',
        availableTabs: [{key: 'devices'}, {key: 'shop'}],
        storedTab: 'shop',
        fallbackTab: 'devices',
      }),
      'shop',
    );
  });

  it('falls back to the active tab when the stored tab is not available', () => {
    assert.equal(
      resolveGeneralSettingsActiveTab({
        activeTab: 'shop',
        availableTabs: [{key: 'devices'}, {key: 'shop'}],
        storedTab: 'logs',
        fallbackTab: 'devices',
      }),
      'shop',
    );
  });

  it('falls back to the first available tab when neither stored nor active tab is valid', () => {
    assert.equal(
      resolveGeneralSettingsActiveTab({
        activeTab: 'logs',
        availableTabs: [{key: 'devices'}, {key: 'shop'}],
        storedTab: 'integrations',
        fallbackTab: '',
      }),
      'devices',
    );
  });

  it('stores and reads the active tab from localStorage', () => {
    assert.equal(writeGeneralSettingsActiveTab('shop'), true);
    assert.equal(
      global.localStorage.getItem(GENERAL_SETTINGS_ACTIVE_TAB_STORAGE_KEY),
      'shop',
    );
    assert.equal(readGeneralSettingsActiveTab(), 'shop');
  });
});
