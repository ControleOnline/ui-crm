const test = require('node:test');
const assert = require('node:assert/strict');

const {
  resolveClientSellerVisibility,
  canShowCommissionFields,
  canManageSellerLinks,
  isManagerApp,
  normalizeAppType,
} = require('../../../react/utils/clientSellerVisibility');

test('normalizeAppType uppercases and trims', () => {
  assert.equal(normalizeAppType('  manager '), 'MANAGER');
  assert.equal(normalizeAppType(null), '');
});

test('isManagerApp is true only for MANAGER', () => {
  assert.equal(isManagerApp('MANAGER'), true);
  assert.equal(isManagerApp('manager'), true);
  assert.equal(isManagerApp('CRM'), false);
  assert.equal(isManagerApp('POS'), false);
  assert.equal(isManagerApp(''), false);
  assert.equal(isManagerApp(undefined), false);
});

test('MANAGER can view and fully manage sellers and commissions', () => {
  const v = resolveClientSellerVisibility('MANAGER');
  assert.equal(v.canViewSeller, true);
  assert.equal(v.canManageSellers, true);
  assert.equal(v.canChangeSeller, true);
  assert.equal(v.canRemoveSeller, true);
  assert.equal(v.canAddMultipleSellers, true);
  assert.equal(v.canEditSeller, true);
  assert.equal(v.canViewCommissionPercent, true);
  assert.equal(v.canViewMinimumCommission, true);
});

test('CRM can view seller but cannot manage or see commissions', () => {
  const v = resolveClientSellerVisibility('CRM');
  assert.equal(v.canViewSeller, true);
  assert.equal(v.canManageSellers, false);
  assert.equal(v.canChangeSeller, false);
  assert.equal(v.canRemoveSeller, false);
  assert.equal(v.canAddMultipleSellers, false);
  assert.equal(v.canEditSeller, false);
  assert.equal(v.canViewCommissionPercent, false);
  assert.equal(v.canViewMinimumCommission, false);
});

test('POS and SHOP follow non-MANAGER rules', () => {
  for (const app of ['POS', 'SHOP', 'ADMIN', '']) {
    const v = resolveClientSellerVisibility(app);
    assert.equal(v.canViewSeller, true, app);
    assert.equal(v.canManageSellers, false, app);
    assert.equal(v.canViewCommissionPercent, false, app);
  }
});

test('canShowCommissionFields mirrors MANAGER only', () => {
  assert.equal(canShowCommissionFields('MANAGER'), true);
  assert.equal(canShowCommissionFields('CRM'), false);
  assert.equal(canShowCommissionFields(null), false);
});

test('canManageSellerLinks mirrors MANAGER only', () => {
  assert.equal(canManageSellerLinks('MANAGER'), true);
  assert.equal(canManageSellerLinks('crm'), false);
});

test('case-insensitive MANAGER still grants full access', () => {
  const v = resolveClientSellerVisibility('MaNaGeR');
  assert.equal(v.canManageSellers, true);
  assert.equal(v.canViewCommissionPercent, true);
});
