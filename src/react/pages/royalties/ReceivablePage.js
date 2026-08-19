/*
 * ui-crm — Franqueadora: Royalties a receber
 * Task: ControleOnline/ui-crm#23 (filha de #21)
 * Flow: franchisee pays → franchisor receives (invoice type/context royalties).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '@store';
import DefaultTable from '@controleonline/ui-default/src/react/components/table/DefaultTable';
import { resolveThemePalette } from '@controleonline/../../src/styles/branding';
import { colors } from '@controleonline/../../src/styles/colors';
import {
  resolveRoyaltiesReceivablePreferenceKey,
  resolveRoyaltiesReceivableRequestParams,
  resolveRoyaltiesReceivableTitle,
  ROYALTIES_FLOW_NOTE,
} from './royaltiesReceivableHelpers';

const DEFAULT_DATE_FILTER = {
  shortcut: 'thisMonth',
  customRange: { from: '', to: '' },
};

const translate = (store, type, key) => global.t?.t(store, type, key);

function RoyaltiesReceivablePage() {
  const navigation = useNavigation();
  const defaultFiltersAppliedRef = useRef(false);
  const invoiceStore = useStore('invoice');
  const peopleStore = useStore('people');
  const themeStore = useStore('theme');
  const authStore = useStore('auth');

  const invoiceGetters = invoiceStore?.getters || {};
  const peopleGetters = peopleStore?.getters || {};
  const themeGetters = themeStore?.getters || {};
  const authGetters = authStore?.getters || {};

  const { currentCompany } = peopleGetters;
  const { colors: themeColors } = themeGetters;
  const { sessionChecked } = authGetters;
  const storeFilters = invoiceGetters?.filters || {};

  const [franchiseeFilter, setFranchiseeFilter] = useState(null);

  const themeTokens = useMemo(
    () => ({ ...themeColors, ...(currentCompany?.theme?.colors || {}) }),
    [currentCompany?.theme?.colors, themeColors],
  );
  const brandColors = useMemo(
    () => resolveThemePalette(themeTokens, colors),
    [themeTokens],
  );

  const visibleColumnsPreferenceKey = useMemo(
    () => resolveRoyaltiesReceivablePreferenceKey(),
    [],
  );

  const requestParams = useMemo(
    () =>
      resolveRoyaltiesReceivableRequestParams({
        companyId: currentCompany?.id,
        franchiseeId: franchiseeFilter,
      }),
    [currentCompany?.id, franchiseeFilter],
  );

  const initialFilters = useMemo(
    () =>
      storeFilters?.dueDate
        ? storeFilters
        : { ...(storeFilters || {}), dueDate: DEFAULT_DATE_FILTER },
    [storeFilters],
  );

  const isBootstrapReady =
    Boolean(sessionChecked) &&
    Boolean(currentCompany?.id) &&
    Boolean(themeColors);

  const shouldApplyDefaultFilters =
    isBootstrapReady &&
    !defaultFiltersAppliedRef.current &&
    !storeFilters?.dueDate;

  useEffect(() => {
    if (!isBootstrapReady || defaultFiltersAppliedRef.current) {
      return;
    }
    defaultFiltersAppliedRef.current = true;
    if (!storeFilters?.dueDate && typeof invoiceStore?.actions?.setFilters === 'function') {
      invoiceStore.actions.setFilters(initialFilters);
    }
  }, [initialFilters, invoiceStore?.actions, isBootstrapReady, storeFilters]);

  // Keep payer (franqueado) filter in sync when store filters change
  useEffect(() => {
    const payerFromStore = storeFilters?.payer;
    if (payerFromStore === undefined || payerFromStore === null || payerFromStore === '') {
      if (franchiseeFilter != null) {
        setFranchiseeFilter(null);
      }
      return;
    }
    setFranchiseeFilter(payerFromStore);
  }, [storeFilters?.payer]);

  const openInvoiceDetails = useCallback(
    invoice => {
      const invoiceId = String(invoice?.id || invoice?.['@id'] || '').replace(/\D/g, '');
      if (!invoiceId) return;
      navigation.navigate('InvoiceDetailsPage', { id: invoiceId });
    },
    [navigation],
  );

  const invoiceSummary = invoiceGetters?.summary;
  const filteredSummary = useMemo(() => {
    if (!invoiceSummary || typeof invoiceSummary !== 'object' || Array.isArray(invoiceSummary)) {
      return invoiceSummary;
    }
    const nextSummary = { ...invoiceSummary };
    const hasStandardFilteredTotal =
      nextSummary?.sum &&
      typeof nextSummary.sum === 'object' &&
      !Array.isArray(nextSummary.sum) &&
      Object.prototype.hasOwnProperty.call(nextSummary.sum, 'price');
    const standardFilteredTotal = Number(nextSummary?.sum?.price || 0);
    if (hasStandardFilteredTotal) {
      nextSummary.financial = {
        ...(nextSummary.financial || {}),
        totalAmount: standardFilteredTotal,
      };
    }
    if (nextSummary?.sum && typeof nextSummary.sum === 'object' && !Array.isArray(nextSummary.sum)) {
      const sumWithoutPrice = { ...nextSummary.sum };
      delete sumWithoutPrice.price;
      if (Object.keys(sumWithoutPrice).length > 0) {
        nextSummary.sum = sumWithoutPrice;
      } else {
        delete nextSummary.sum;
      }
    }
    if (Object.prototype.hasOwnProperty.call(nextSummary, 'price')) {
      delete nextSummary.price;
    }
    return nextSummary;
  }, [invoiceSummary]);

  const summaryLabels = useMemo(
    () => ({
      'financial.totalAmount': translate('invoice', 'label', 'totalAmount'),
      'financial.open': translate('invoice', 'label', 'receivableAmount'),
      'financial.openAmount': translate('invoice', 'label', 'receivableAmount'),
      'financial.pendingAmount': translate('invoice', 'label', 'receivableAmount'),
      'financial.receivableAmount': translate('invoice', 'label', 'receivableAmount'),
      'financial.paid': translate('invoice', 'label', 'paidAmount'),
      'financial.paidAmount': translate('invoice', 'label', 'paidAmount'),
    }),
    [],
  );

  const pageTitle = useMemo(
    () => resolveRoyaltiesReceivableTitle(translate),
    [],
  );

  if (!isBootstrapReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={brandColors.primary || '#2563EB'} />
      </View>
    );
  }

  if (!currentCompany?.id) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <Text>Empresa nao identificada.</Text>
      </View>
    );
  }

  if (shouldApplyDefaultFilters) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={brandColors.primary || '#2563EB'} />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: brandColors.background || '#F8FAFC' }}
      edges={['bottom']}
      accessibilityLabel={pageTitle}
      testID="royalties-receivable-page"
    >
      <View style={{ flex: 1 }}>
        <DefaultTable
          accentColor={brandColors.primary}
          filters={initialFilters}
          onRowPress={openInvoiceDetails}
          requestParams={requestParams}
          searchProps={{
            placeholder:
              translate('invoice', 'input', 'search') ||
              'Buscar royalties / franqueado',
          }}
          showTotalItemsInFooter
          showTotalItemsInCompactToolbar
          summary={filteredSummary}
          summaryLabels={summaryLabels}
          visibleColumnsPreferenceKey={visibleColumnsPreferenceKey}
          sort={{
            direction: 'desc',
            field: 'dueDate',
          }}
          storeName="invoice"
        />
      </View>
      {/* Accessibility hint for franchise flow (not visible chrome) */}
      <Text style={{ height: 0, opacity: 0 }} accessibilityLabel={ROYALTIES_FLOW_NOTE}>
        {ROYALTIES_FLOW_NOTE}
      </Text>
    </SafeAreaView>
  );
}

export default RoyaltiesReceivablePage;
