import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useStore } from '@store';
import AnimatedModal from '../../components/AnimatedModal';
import translateWithFallback from '../../utils/translateWithFallback';

const Invoices = () => {
  const tr = useCallback(
    (type, key, fallback) =>
      translateWithFallback('comissions', type, key, fallback),
    [],
  );

  const invoiceStore = useStore('invoice');
  const peopleStore = useStore('people');

  const invoiceGetters = invoiceStore?.getters || {};
  const invoiceActions = invoiceStore?.actions || {};
  const peopleGetters = peopleStore?.getters || {};

  const {
    items = [],
    isLoading = false,
    error = null,
  } = invoiceGetters;

  const { currentCompany } = peopleGetters;

  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('0');
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const hasLoadedInitially = useRef(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceDetailsVisible, setInvoiceDetailsVisible] = useState(false);

  const monthOptions = useMemo(
    () => [
      { id: '0', label: tr('month', 'all', 'Todos') },
      { id: '1', label: tr('month', 'jan', 'Jan') },
      { id: '2', label: tr('month', 'feb', 'Fev') },
      { id: '3', label: tr('month', 'mar', 'Mar') },
      { id: '4', label: tr('month', 'apr', 'Abr') },
      { id: '5', label: tr('month', 'may', 'Mai') },
      { id: '6', label: tr('month', 'jun', 'Jun') },
      { id: '7', label: tr('month', 'jul', 'Jul') },
      { id: '8', label: tr('month', 'aug', 'Ago') },
      { id: '9', label: tr('month', 'sep', 'Set') },
      { id: '10', label: tr('month', 'oct', 'Out') },
      { id: '11', label: tr('month', 'nov', 'Nov') },
      { id: '12', label: tr('month', 'dec', 'Dez') },
    ],
    [tr],
  );

  const getDateRange = useCallback((yearString, monthString) => {
    const year = parseInt(yearString, 10);
    const month = parseInt(monthString, 10);

    if (!year) return null;

    let start;
    let end;

    if (!month || month < 1 || month > 12) {
      start = new Date(year, 0, 1, 0, 0, 0, 0);
      end = new Date(year, 11, 31, 23, 59, 59, 999);
    } else {
      start = new Date(year, month - 1, 1, 0, 0, 0, 0);
      end = new Date(year, month, 0, 23, 59, 59, 999);
    }

    const formatDateForApi = date => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    return {
      after: formatDateForApi(start),
      before: formatDateForApi(end),
    };
  }, []);

  const invoices = useMemo(() => {
    if (Array.isArray(items)) return items;
    if (Array.isArray(items?.member)) return items.member;
    return [];
  }, [items]);

  const canLoad = useMemo(() => {
    return Boolean(
      currentCompany?.id &&
      typeof invoiceActions?.getItems === 'function',
    );
  }, [currentCompany?.id, invoiceActions]);

  const loadInvoices = useCallback(async () => {
    if (!canLoad) return;

    const range = getDateRange(selectedYear, selectedMonth);
    const params = {
      payer: currentCompany.id,
      'order[dueDate]': 'desc',
    };

    if (range) {
      params['dueDate[after]'] = range.after;
      params['dueDate[before]'] = range.before;
    }

    await invoiceActions.getItems(params);
  }, [
    canLoad,
    invoiceActions,
    currentCompany?.id,
    getDateRange,
    selectedMonth,
    selectedYear,
  ]);

  useFocusEffect(
    useCallback(() => {
      hasLoadedInitially.current = true;
      loadInvoices();
    }, [loadInvoices]),
  );

  useEffect(() => {
    if (!canLoad || !hasLoadedInitially.current) {
      return;
    }

    loadInvoices();
  }, [canLoad, loadInvoices, selectedMonth, selectedYear]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadInvoices();
    } finally {
      setRefreshing(false);
    }
  }, [loadInvoices]);

  const formatCurrency = value =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(value || 0));

  const formatDate = dateString => {
    if (!dateString) return '-';
    const parsedDate = new Date(dateString);
    if (Number.isNaN(parsedDate.getTime())) return '-';
    return parsedDate.toLocaleDateString('pt-BR');
  };

  const getStatusColor = status => status?.color || '#64748B';

  const handleInvoicePress = invoice => {
    setSelectedInvoice(invoice);
    setInvoiceDetailsVisible(true);
  };

  const handleCloseInvoiceDetails = () => {
    setInvoiceDetailsVisible(false);
    setSelectedInvoice(null);
  };

  const showEmptyState = !isLoading && !error && invoices.length === 0;
  const showListState = !isLoading && !error && invoices.length > 0;

  const pageChildren = [];

  pageChildren.push(
    <View key="filters" style={styles.filtersContainer}>
      <View style={styles.yearRow}>
        <Text style={styles.filterLabel}>{tr('label', 'year', 'Ano')}</Text>
        <View style={styles.yearControl}>
          <TouchableOpacity
            style={styles.yearStepButton}
            onPress={() => {
              const current = parseInt(selectedYear || '0', 10);
              if (!current) return;
              setSelectedYear(String(current - 1));
            }}>
            <Text style={styles.yearStepButtonText}>-</Text>
          </TouchableOpacity>
          <TextInput
            value={selectedYear}
            onChangeText={text => {
              const cleaned = text.replace(/\D/g, '').slice(0, 4);
              setSelectedYear(cleaned);
            }}
            onBlur={() => {
              if (selectedYear.length !== 4) {
                setSelectedYear(String(new Date().getFullYear()));
              }
            }}
            keyboardType="numeric"
            style={styles.yearInput}
            placeholder={tr('placeholder', 'year', 'AAAA')}
            placeholderTextColor="#94A3B8"
          />
          <TouchableOpacity
            style={styles.yearStepButton}
            onPress={() => {
              const current = parseInt(selectedYear || '0', 10);
              if (!current) return;
              setSelectedYear(String(current + 1));
            }}>
            <Text style={styles.yearStepButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={monthOptions}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.monthList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.monthChip,
              selectedMonth === item.id && styles.monthChipActive,
            ]}
            onPress={() => setSelectedMonth(item.id)}>
            <Text
              style={[
                styles.monthChipText,
                selectedMonth === item.id && styles.monthChipTextActive,
              ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>,
  );

  if (isLoading && !refreshing) {
    pageChildren.push(
      <View key="loading" style={styles.centerState}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>,
    );
  }

  if (error) {
    pageChildren.push(
      <View key="error" style={styles.centerState}>
        <Text style={styles.errorTitle}>{tr('state', 'errorTitle', 'Erro')}</Text>
        <Text style={styles.errorSubtitle}>
          {tr('state', 'errorSubtitle', 'Erro ao carregar faturas')}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadInvoices}>
          <Text style={styles.retryButtonText}>
            {tr('action', 'retry', 'Tentar novamente')}
          </Text>
        </TouchableOpacity>
      </View>,
    );
  }

  if (showEmptyState) {
    pageChildren.push(
      <View key="empty" style={styles.centerState}>
        <Text style={styles.emptyText}>
          {tr('state', 'empty', 'Nenhuma fatura encontrada')}
        </Text>
      </View>,
    );
  }

  if (showListState) {
    pageChildren.push(
      <ScrollView
        key="list"
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <View style={styles.listContainer}>
          {invoices.map((invoice, index) => {
            const cardMetaChildren = [
              <Text key="category" style={styles.metaLine}>
                {tr('label', 'category', 'Categoria')}: {invoice?.category?.name || tr('label', 'noCategory', 'Sem categoria')}
              </Text>,
              <Text key="payment" style={styles.metaLine}>
                {tr('label', 'payment', 'Pagamento')}: {invoice?.paymentType?.paymentType || tr('label', 'na', 'N/A')}
              </Text>,
              <Text key="due" style={styles.metaLine}>
                {tr('label', 'dueDate', 'Vencimento')}: {formatDate(invoice?.dueDate)}
              </Text>,
            ];

            if (invoice?.sourceWallet) {
              cardMetaChildren.push(
                <Text key="source" style={styles.metaLine}>
                  {tr('label', 'from', 'De')}: {invoice.sourceWallet.wallet}
                </Text>,
              );
            }

            if (invoice?.destinationWallet) {
              cardMetaChildren.push(
                <Text key="destination" style={styles.metaLine}>
                  {tr('label', 'to', 'Para')}: {invoice.destinationWallet.wallet}
                </Text>,
              );
            }

            return (
              <TouchableOpacity
                key={String(invoice?.id ?? `idx-${index}`)}
                style={styles.card}
                onPress={() => handleInvoicePress(invoice)}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>
                    {tr('label', 'invoice', 'Fatura')} #{invoice?.id || '-'}
                  </Text>
                  <Text
                    style={[
                      styles.statusPill,
                      { backgroundColor: getStatusColor(invoice?.status) },
                    ]}>
                    {(invoice?.status?.status || tr('label', 'na', 'N/A')).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.amount}>{formatCurrency(invoice?.price)}</Text>
                {cardMetaChildren}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>,
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      {pageChildren}

      <AnimatedModal
        visible={invoiceDetailsVisible}
        onRequestClose={handleCloseInvoiceDetails}
        style={{ justifyContent: 'flex-end' }}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {tr('title', 'invoiceDetails', 'Detalhes da fatura')}
            </Text>
            <TouchableOpacity
              onPress={() => setInvoiceDetailsVisible(false)}
              style={styles.modalCloseButton}>
              <Icon name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.modalSummaryCard}>
              <Text style={styles.modalAmount}>
                {formatCurrency(selectedInvoice?.price)}
              </Text>
              <View
                style={[
                  styles.modalStatusPill,
                  {
                    backgroundColor: getStatusColor(selectedInvoice?.status),
                  },
                ]}>
                <Text style={styles.modalStatusText}>
                  {(
                    selectedInvoice?.status?.status ||
                    tr('label', 'na', 'N/A')
                  ).toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.modalDetailsCard}>
              <View style={styles.modalDetailRow}>
                <Text style={styles.modalDetailLabel}>
                  {tr('label', 'id', 'ID')}
                </Text>
                <Text style={styles.modalDetailValue}>
                  #{selectedInvoice?.id || '-'}
                </Text>
              </View>
              <View style={styles.modalDetailRow}>
                <Text style={styles.modalDetailLabel}>
                  {tr('label', 'category', 'Categoria')}
                </Text>
                <Text style={styles.modalDetailValue}>
                  {selectedInvoice?.category?.name ||
                    tr('label', 'noCategory', 'Sem categoria')}
                </Text>
              </View>
              <View style={styles.modalDetailRow}>
                <Text style={styles.modalDetailLabel}>
                  {tr('label', 'payment', 'Pagamento')}
                </Text>
                <Text style={styles.modalDetailValue}>
                  {selectedInvoice?.paymentType?.paymentType ||
                    tr('label', 'na', 'N/A')}
                </Text>
              </View>
              <View style={styles.modalDetailRow}>
                <Text style={styles.modalDetailLabel}>
                  {tr('label', 'dueDate', 'Vencimento')}
                </Text>
                <Text style={styles.modalDetailValue}>
                  {formatDate(selectedInvoice?.dueDate)}
                </Text>
              </View>
              <View style={styles.modalDetailRow}>
                <Text style={styles.modalDetailLabel}>
                  {tr('label', 'from', 'De')}
                </Text>
                <Text style={styles.modalDetailValue}>
                  {selectedInvoice?.sourceWallet?.wallet || '-'}
                </Text>
              </View>
              <View style={styles.modalDetailRow}>
                <Text style={styles.modalDetailLabel}>
                  {tr('label', 'to', 'Para')}
                </Text>
                <Text style={styles.modalDetailValue}>
                  {selectedInvoice?.destinationWallet?.wallet || '-'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalPrimaryButton}
              onPress={() => setInvoiceDetailsVisible(false)}>
              <Text style={styles.modalPrimaryButtonText}>
                {tr('action', 'close', 'Fechar')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </AnimatedModal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  yearRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterLabel: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 13,
  },
  yearControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yearStepButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  yearStepButtonText: {
    color: '#334155',
    fontSize: 18,
    lineHeight: 18,
    fontWeight: '700',
  },
  yearInput: {
    width: 70,
    height: 32,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    textAlign: 'center',
    color: '#0F172A',
    fontWeight: '700',
    backgroundColor: '#fff',
    paddingVertical: 0,
    marginHorizontal: 2,
  },
  monthList: {
    paddingVertical: 2,
  },
  monthChip: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  monthChipActive: {
    borderColor: '#0EA5E9',
    backgroundColor: '#E0F2FE',
  },
  monthChipText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  monthChipTextActive: {
    color: '#0369A1',
    fontWeight: '700',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F44336',
    marginBottom: 6,
  },
  errorSubtitle: {
    color: '#F44336',
    marginBottom: 14,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '500',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  listContainer: {
    padding: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusPill: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  amount: {
    marginTop: 8,
    marginBottom: 8,
    fontSize: 17,
    fontWeight: '700',
    color: '#007AFF',
  },
  metaLine: {
    color: '#475569',
    marginBottom: 4,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 24,
    gap: 16,
  },
  modalSummaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 12,
  },
  modalStatusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  modalStatusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  modalDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  modalDetailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  modalDetailValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  modalPrimaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  modalPrimaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default Invoices;
