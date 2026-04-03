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

const Invoices = () => {
  const invoiceStore = useStore('invoice');
  const peopleStore = useStore('people');

  const invoiceGetters = invoiceStore?.getters || {};
  const invoiceActions = invoiceStore?.actions || {};
  const peopleGetters = peopleStore?.getters || {};

  const { isLoading = false, error = null } = invoiceGetters;

  const { currentCompany } = peopleGetters;

  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('0');
  const [selectedYear, setSelectedYear] = useState(
    String(new Date().getFullYear()),
  );
  const hasLoadedInitially = useRef(false);
  const [incomeStatements, setIncomeStatements] = useState({});
  const [selectedStatement, setSelectedStatement] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  const monthOptions = useMemo(
    () => [
      { id: '0', label: global.t?.t('people','month', 'all') },
      { id: '1', label: global.t?.t('people','month', 'jan') },
      { id: '2', label: global.t?.t('people','month', 'feb') },
      { id: '3', label: global.t?.t('people','month', 'mar') },
      { id: '4', label: global.t?.t('people','month', 'apr') },
      { id: '5', label: global.t?.t('people','month', 'may') },
      { id: '6', label: global.t?.t('people','month', 'jun') },
      { id: '7', label: global.t?.t('people','month', 'jul') },
      { id: '8', label: global.t?.t('people','month', 'aug') },
      { id: '9', label: global.t?.t('people','month', 'sep') },
      { id: '10', label: global.t?.t('people','month', 'oct') },
      { id: '11', label: global.t?.t('people','month', 'nov') },
      { id: '12', label: global.t?.t('people','month', 'dec') },
    ]
  );

  const canLoad = useMemo(() => {
    return Boolean(
      currentCompany?.id &&
      typeof invoiceActions?.getIncomeStatements === 'function',
    );
  }, [currentCompany?.id, invoiceActions]);

  const normalizeParentCategories = useCallback(raw => {
    const parentList = Array.isArray(raw)
      ? raw
      : Object.values(raw || {});

    return parentList.map(parent => ({
      parentId: parent?.parent_id || '',
      parentName: parent?.parent_category_name || global.t?.t('people', 'label', 'noCategory'),
      total: Number(parent?.total_parent_category_price || 0),
      categories: (Array.isArray(parent?.categories_childs)
        ? parent.categories_childs
        : Object.values(parent?.categories_childs || {})
      ).map(category => ({
        id: category?.category_id || '',
        name: category?.category_name || global.t?.t('people', 'label', 'noCategory'),
        total: Number(category?.category_price || 0),
      })),
    }));
  }, []);

  const loadIncomeStatements = useCallback(async () => {
    if (!canLoad) return;

    const year = parseInt(selectedYear, 10);
    if (!year) return;

    const params = {
      people: currentCompany.id,
      year,
    };

    const month = parseInt(selectedMonth, 10);
    if (month >= 1 && month <= 12) {
      params.month = month;
    }

    const response = await invoiceActions.getIncomeStatements(params);
    setIncomeStatements(
      response && typeof response === 'object' ? response : {},
    );
  }, [
    canLoad,
    invoiceActions,
    currentCompany?.id,
    selectedMonth,
    selectedYear,
  ]);

  useFocusEffect(
    useCallback(() => {
      hasLoadedInitially.current = true;
      loadIncomeStatements();
    }, [loadIncomeStatements]),
  );

  useEffect(() => {
    if (!canLoad || !hasLoadedInitially.current) {
      return;
    }

    loadIncomeStatements();
  }, [canLoad, loadIncomeStatements, selectedMonth, selectedYear]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadIncomeStatements();
    } finally {
      setRefreshing(false);
    }
  }, [loadIncomeStatements]);

  const formatCurrency = value =>
    new Intl.NumberFormat('pt-br', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(value || 0));

  const monthLabelById = useMemo(() => {
    return monthOptions.reduce((acc, option) => {
      acc[option.id] = option.label;
      return acc;
    }, {});
  }, [monthOptions]);

  const monthRows = useMemo(() => {
    const selectedMonthNumber = parseInt(selectedMonth, 10);
    const monthKeys = selectedMonthNumber >= 1 && selectedMonthNumber <= 12
      ? [selectedMonthNumber]
      : Object.keys(incomeStatements || {})
          .map(key => parseInt(key, 10))
          .filter(month => month >= 1 && month <= 12)
          .sort((a, b) => a - b);

    return monthKeys
      .map(monthNumber => {
        const monthData =
          incomeStatements?.[monthNumber] ||
          incomeStatements?.[String(monthNumber)] ||
          {};
        const receiveTotal = Number(monthData?.receive?.total_month_price || 0);
        const payTotal = Number(monthData?.pay?.total_month_price || 0);
        const balance = receiveTotal - payTotal;

        return {
          month: monthNumber,
          label:
            monthLabelById[String(monthNumber)] ||
            String(monthNumber).padStart(2, '0'),
          receiveTotal,
          payTotal,
          balance,
          receiveParents: normalizeParentCategories(
            monthData?.receive?.parent_categories,
          ),
          payParents: normalizeParentCategories(monthData?.pay?.parent_categories),
        };
      })
      .filter(row => {
        if (selectedMonthNumber >= 1 && selectedMonthNumber <= 12) {
          return true;
        }
        return row.receiveTotal !== 0 || row.payTotal !== 0;
      });
  }, [incomeStatements, monthLabelById, normalizeParentCategories, selectedMonth]);

  const openStatementDetails = statement => {
    setSelectedStatement(statement);
    setDetailsVisible(true);
  };

  const handleCloseDetails = () => {
    setDetailsVisible(false);
    setSelectedStatement(null);
  };

  const showEmptyState = !isLoading && !error && monthRows.length === 0;
  const showListState = !isLoading && !error && monthRows.length > 0;

  const pageChildren = [];

  pageChildren.push(
    <View key="filters" style={styles.filtersContainer}>
      <View style={styles.yearRow}>
        <Text style={styles.filterLabel}>{global.t?.t('people','label', 'year')}</Text>
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
            placeholder={global.t?.t('people','placeholder', 'year')}
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
        <Text style={styles.errorTitle}>{global.t?.t('people','state', 'errorTitle')}</Text>
        <Text style={styles.errorSubtitle}>
          {global.t?.t('people','state', 'errorSubtitle')}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadIncomeStatements}>
          <Text style={styles.retryButtonText}>
            {global.t?.t('people','action', 'retry')}
          </Text>
        </TouchableOpacity>
      </View>,
    );
  }

  if (showEmptyState) {
    pageChildren.push(
      <View key="empty" style={styles.centerState}>
        <Text style={styles.emptyText}>
          {global.t?.t('people','state', 'empty')}
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
          {monthRows.map(statement => {
            const balancePositive = statement.balance >= 0;

            return (
              <TouchableOpacity
                key={`month-${statement.month}`}
                style={styles.card}
                onPress={() => openStatementDetails(statement)}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>
                    {`${statement.label}/${selectedYear}`}
                  </Text>
                  <Text
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: balancePositive ? '#16A34A' : '#DC2626',
                      },
                    ]}>
                    {balancePositive ? 'POSITIVO' : 'NEGATIVO'}
                  </Text>
                </View>
                <Text style={styles.amount}>{formatCurrency(statement.balance)}</Text>
                <Text style={styles.metaLine}>
                  Receitas: {formatCurrency(statement.receiveTotal)}
                </Text>
                <Text style={styles.metaLine}>
                  Despesas: {formatCurrency(statement.payTotal)}
                </Text>
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
        visible={detailsVisible}
        onRequestClose={handleCloseDetails}
        style={{ justifyContent: 'flex-end' }}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Detalhes do Mes
            </Text>
            <TouchableOpacity
              onPress={handleCloseDetails}
              style={styles.modalCloseButton}>
              <Icon name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 20 }}>
            <View style={styles.modalSummaryCard}>
              <Text style={styles.modalAmount}>
                {formatCurrency(selectedStatement?.balance)}
              </Text>
              <View
                style={[
                  styles.modalStatusPill,
                  {
                    backgroundColor:
                      (selectedStatement?.balance || 0) >= 0
                        ? '#16A34A'
                        : '#DC2626',
                  },
                ]}>
                <Text style={styles.modalStatusText}>
                  {(selectedStatement?.balance || 0) >= 0
                    ? 'SALDO POSITIVO'
                    : 'SALDO NEGATIVO'}
                </Text>
              </View>
            </View>

            <View style={styles.modalDetailsCard}>
              <View style={styles.modalDetailRow}>
                <Text style={styles.modalDetailLabel}>Mes</Text>
                <Text style={styles.modalDetailValue}>
                  {selectedStatement?.label || '-'}
                </Text>
              </View>
              <View style={styles.modalDetailRow}>
                <Text style={styles.modalDetailLabel}>Ano</Text>
                <Text style={styles.modalDetailValue}>
                  {selectedYear}
                </Text>
              </View>
              <View style={styles.modalDetailRow}>
                <Text style={styles.modalDetailLabel}>Receitas</Text>
                <Text style={styles.modalDetailValue}>
                  {formatCurrency(selectedStatement?.receiveTotal)}
                </Text>
              </View>
              <View style={styles.modalDetailRow}>
                <Text style={styles.modalDetailLabel}>Despesas</Text>
                <Text style={styles.modalDetailValue}>
                  {formatCurrency(selectedStatement?.payTotal)}
                </Text>
              </View>
            </View>

            <View style={styles.modalDetailsCard}>
              <Text style={styles.modalSectionTitle}>Receitas por Categoria</Text>
              {Array.isArray(selectedStatement?.receiveParents) &&
              selectedStatement.receiveParents.length > 0 ? (
                selectedStatement.receiveParents.map(parent => (
                  <View key={`rcv-parent-${parent.parentId}`} style={styles.modalGroupBlock}>
                    <View style={styles.modalGroupHeader}>
                      <Text style={styles.modalGroupTitle}>{parent.parentName}</Text>
                      <Text style={styles.modalGroupAmount}>
                        {formatCurrency(parent.total)}
                      </Text>
                    </View>
                    {parent.categories.map(category => (
                      <View key={`rcv-cat-${category.id}`} style={styles.modalCategoryRow}>
                        <Text style={styles.modalCategoryText}>{category.name}</Text>
                        <Text style={styles.modalCategoryAmount}>
                          {formatCurrency(category.total)}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))
              ) : (
                <Text style={styles.modalEmptyText}>Sem receitas no periodo.</Text>
              )}
            </View>

            <View style={styles.modalDetailsCard}>
              <Text style={styles.modalSectionTitle}>Despesas por Categoria</Text>
              {Array.isArray(selectedStatement?.payParents) &&
              selectedStatement.payParents.length > 0 ? (
                selectedStatement.payParents.map(parent => (
                  <View key={`pay-parent-${parent.parentId}`} style={styles.modalGroupBlock}>
                    <View style={styles.modalGroupHeader}>
                      <Text style={styles.modalGroupTitle}>{parent.parentName}</Text>
                      <Text style={styles.modalGroupAmount}>
                        {formatCurrency(parent.total)}
                      </Text>
                    </View>
                    {parent.categories.map(category => (
                      <View key={`pay-cat-${category.id}`} style={styles.modalCategoryRow}>
                        <Text style={styles.modalCategoryText}>{category.name}</Text>
                        <Text style={styles.modalCategoryAmount}>
                          {formatCurrency(category.total)}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))
              ) : (
                <Text style={styles.modalEmptyText}>Sem despesas no periodo.</Text>
              )}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalPrimaryButton}
              onPress={handleCloseDetails}>
              <Text style={styles.modalPrimaryButtonText}>
                {global.t?.t('people','action', 'close')}
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
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  modalGroupBlock: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  modalGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalGroupTitle: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 8,
  },
  modalGroupAmount: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  modalCategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  modalCategoryText: {
    flex: 1,
    color: '#475569',
    fontSize: 12,
    marginRight: 8,
  },
  modalCategoryAmount: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  modalEmptyText: {
    color: '#64748B',
    fontSize: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
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
