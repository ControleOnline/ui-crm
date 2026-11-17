/**
 * Permission rules for client ↔ seller linkage UI (issue #2 / residual #36).
 * Boundary is APP_TYPE (MANAGER vs others), not only company role.
 *
 * MANAGER: full management + commission visibility
 * Non-MANAGER (e.g. CRM): can see linked seller name only
 */

const normalizeAppType = appType =>
  String(appType || '')
    .trim()
    .toUpperCase();

const isManagerApp = appType => normalizeAppType(appType) === 'MANAGER';

/**
 * @param {string} [appType] - APP_TYPE from runtime (MANAGER, CRM, POS, SHOP, …)
 * @returns {{
 *   canViewSeller: boolean,
 *   canManageSellers: boolean,
 *   canChangeSeller: boolean,
 *   canRemoveSeller: boolean,
 *   canAddMultipleSellers: boolean,
 *   canEditSeller: boolean,
 *   canViewCommissionPercent: boolean,
 *   canViewMinimumCommission: boolean,
 * }}
 */
const resolveClientSellerVisibility = (appType) => {
  const manager = isManagerApp(appType);

  return {
    canViewSeller: true,
    canManageSellers: manager,
    canChangeSeller: manager,
    canRemoveSeller: manager,
    canAddMultipleSellers: manager,
    canEditSeller: manager,
    canViewCommissionPercent: manager,
    canViewMinimumCommission: manager,
  };
};

/**
 * Whether commission-related fields should be shown in the UI.
 */
const canShowCommissionFields = appType => isManagerApp(appType);

/**
 * Whether seller linkage management actions (add/change/remove) are allowed.
 */
const canManageSellerLinks = appType => isManagerApp(appType);

module.exports = {
  resolveClientSellerVisibility,
  canShowCommissionFields,
  canManageSellerLinks,
  isManagerApp,
  normalizeAppType,
};
