/*
 * Franchisee view: royalties invoices the current company must pay to the franchisor.
 * Route: RoyaltiesPayablePage — menu label "Royalties a pagar".
 * Parent: ui-crm#21 / child ui-crm#24.
 */
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
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
  DEFAULT_ROYALTIES_DATE_FILTER,
  resolveRoyaltiesPayableRequestParams,
  resolveRoyaltiesPayableVisibleColumnsKey,
} from '../../utils/royaltiesPayableParams';

const translate = (store, type, key) => global.t?.t(store, type, key);

function RoyaltiesPayablePage() {
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

  const themeTokens = useMemo(
    () => ({ ...themeColors, ...(currentCompany?.theme?.colors || {}) }),
    [currentCompany?.theme?.colors, themeColors],
  );
  const brandColors = useMemo(
    () => resolveThemePalette(themeTokens, colors),
    [themeTokens],
  );

  const visibleColumnsPreferenceKey = useMemo(
    () => resolveRoyaltiesPayableVisibleColumnsKey(),
    [],
  );

  const initialFilters = useMemo(
    () =>
      storeFilters?.dueDate
        ? storeFilters
        : { ...(storeFilters || {}), dueDate: DEFAULT_ROYALTIES_DATE_FILTER },
    [storeFilters],
  );

  const requestParams = useMemo(
    () =>
      resolveRoyaltiesPayableRequestParams({ companyId: currentCompany?.id }),
    [currentCompany?.id],
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

  const openInvoiceDetails = useCallback(
    invoice => {
      const invoiceId = String(invoice?.id || invoice?.['@id'] || '').replace(
        /\D/g,
        '',
      );
      if (!invoiceId) return;

      navigation.navigate('InvoiceDetailsPage', { id: invoiceId });
    },
    [navigation],
  );

  const invoiceSummary = invoiceGetters?.summary;
  const filteredSummary = useMemo(() => {
    if (
      !invoiceSummary ||
      typeof invoiceSummary !== 'object' ||
      Array.isArray(invoiceSummary)
    ) {
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

    if (
      nextSummary?.sum &&
      typeof nextSummary.sum === 'object' &&
      !Array.isArray(nextSummary.sum)
    ) {
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
      'financial.totalAmount':
        translate('invoice', 'label', 'totalAmount') || 'Total',
      'financial.open':
        translate('invoice', 'label', 'payableAmount') || 'A pagar',
      'financial.openAmount':
        translate('invoice', 'label', 'payableAmount') || 'A pagar',
      'financial.pendingAmount':
        translate('invoice', 'label', 'payableAmount') || 'A pagar',
      'financial.paid':
        translate('invoice', 'label', 'paidAmount') || 'Pago',
      'financial.paidAmount':
        translate('invoice', 'label', 'paidAmount') || 'Pago',
    }),
    [],
  );

  if (!isBootstrapReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: brandColors.background || '#F8FAFC',
        }}
      >
        <ActivityIndicator
          size="large"
          color={brandColors.primary || '#2563EB'}
        />
      </View>
    );
  }

  if (!currentCompany?.id) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 16,
          backgroundColor: brandColors.background || '#F8FAFC',
        }}
      >
        <Text style={{ color: brandColors.text || '#0F172A' }}>
          Empresa nao identificada.
        </Text>
      </View>
    );
  }

  if (shouldApplyDefaultFilters) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: brandColors.background || '#F8FAFC',
        }}
      >
        <ActivityIndicator
          size="large"
          color={brandColors.primary || '#2563EB'}
        />
      </View>
    );
  }

  return (
    <SafeAreaView
      testID="royalties-payable-page"
      style={{
        flex: 1,
        backgroundColor: brandColors.background || '#F8FAFC',
      }}
      edges={['bottom']}
    >
      <View style={{ flex: 1 }}>
        <DefaultTable
          accentColor={brandColors.primary}
          filters={initialFilters}
          onRowPress={openInvoiceDetails}
          requestParams={requestParams}
          searchProps={{
            placeholder:
              translate('invoice', 'input', 'search') || 'Buscar royalties',
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
    </SafeAreaView>
  );
}

export default RoyaltiesPayablePage;
