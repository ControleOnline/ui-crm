/*
 * Contract (ui-crm#26 / parent ui-crm#21)
 * ## Scope
 * Company-wide **Income Statements** (demonstrativo geral): receive/pay grouped by
 * categories, including comission, royalties and other invoice natures that the
 * backend surfaces as accounting categories.
 *
 * ## Not in scope (sibling views)
 * - Seller commissions list (invoice type comission + client filter) — ui-crm#22
 * - Franchisor royalties to receive — ui-crm#23
 * - Franchisee royalties to pay — ui-crm#24
 * - Motoboy receivables / company motoboy payables — ui-crm#25
 *
 * This screen complements those role-specific views; it does not replace them.
 * Route name `ComissionsPage` is kept for menu/config compatibility; display title
 * is "Demonstrativo".
 */
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useStore} from '@store';
import styles from './index.styles';
import IncomeStatementDetailsModal from './IncomeStatementDetailsModal';
import IncomeStatementsFilters from './IncomeStatementsFilters';
import {
  buildIncomeStatementsParams,
  buildMonthRows,
  filterMonthRows,
  formatCurrency,
  normalizeParentCategories,
} from './incomeStatementsHelpers';

const t = (group, key, fallback) =>
  (typeof global !== 'undefined' && global.t && global.t.t
    ? global.t.t(group, key, fallback)
    : fallback) || fallback;

const IncomeStatements = () => {
  const invoiceStore = useStore('invoice');
  const peopleStore = useStore('people');

  const invoiceGetters = invoiceStore?.getters || {};
  const invoiceActions = invoiceStore?.actions || {};
  const peopleGetters = peopleStore?.getters || {};

  const {isLoading = false, error = null} = invoiceGetters;
  const {currentCompany} = peopleGetters;

  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('0');
  const [selectedYear, setSelectedYear] = useState(
    String(new Date().getFullYear()),
  );
  const [natureFilter, setNatureFilter] = useState('all');
  const [categoryQuery, setCategoryQuery] = useState('');
  const hasLoadedInitially = useRef(false);
  const [incomeStatements, setIncomeStatements] = useState({});
  const [selectedStatement, setSelectedStatement] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  const monthOptions = useMemo(
    () => [
      {id: '0', label: t('people', 'month', 'all')},
      {id: '1', label: t('people', 'month', 'jan')},
      {id: '2', label: t('people', 'month', 'feb')},
      {id: '3', label: t('people', 'month', 'mar')},
      {id: '4', label: t('people', 'month', 'apr')},
      {id: '5', label: t('people', 'month', 'may')},
      {id: '6', label: t('people', 'month', 'jun')},
      {id: '7', label: t('people', 'month', 'jul')},
      {id: '8', label: t('people', 'month', 'aug')},
      {id: '9', label: t('people', 'month', 'sep')},
      {id: '10', label: t('people', 'month', 'oct')},
      {id: '11', label: t('people', 'month', 'nov')},
      {id: '12', label: t('people', 'month', 'dec')},
    ],
    [],
  );

  const natureOptions = useMemo(
    () => [
      {id: 'all', label: t('people', 'label', 'all') || 'Todos'},
      {id: 'receive', label: t('people', 'label', 'receive') || 'Receitas'},
      {id: 'pay', label: t('people', 'label', 'pay') || 'Despesas'},
    ],
    [],
  );

  const canLoad = useMemo(
    () =>
      Boolean(
        currentCompany?.id &&
          typeof invoiceActions?.getIncomeStatements === 'function',
      ),
    [currentCompany?.id, invoiceActions],
  );

  const normalizeParents = useCallback(
    raw => normalizeParentCategories(raw, t),
    [],
  );

  const loadIncomeStatements = useCallback(async () => {
    if (!canLoad) return;

    const params = buildIncomeStatementsParams({
      peopleId: currentCompany.id,
      year: selectedYear,
      month: selectedMonth,
    });
    if (!params) return;

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

  const monthLabelById = useMemo(() => {
    return monthOptions.reduce((acc, option) => {
      acc[option.id] = option.label;
      return acc;
    }, {});
  }, [monthOptions]);

  const baseMonthRows = useMemo(
    () =>
      buildMonthRows(
        incomeStatements,
        selectedMonth,
        monthLabelById,
        normalizeParents,
      ),
    [incomeStatements, selectedMonth, monthLabelById, normalizeParents],
  );

  const monthRows = useMemo(
    () =>
      filterMonthRows(baseMonthRows, {
        nature: natureFilter,
        categoryQuery,
      }),
    [baseMonthRows, natureFilter, categoryQuery],
  );

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

  return (
    <SafeAreaView style={styles.page}>
      <IncomeStatementsFilters
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        monthOptions={monthOptions}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        natureOptions={natureOptions}
        natureFilter={natureFilter}
        onNatureChange={setNatureFilter}
        categoryQuery={categoryQuery}
        onCategoryQueryChange={setCategoryQuery}
        yearLabel={t('people', 'label', 'year')}
        categoryPlaceholder={
          t('people', 'label', 'category') ||
          'Categoria (comissão, royalties…)'
        }
      />

      {isLoading && !refreshing ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#0EA5E9" />
        </View>
      ) : null}

      {error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorTitle}>Erro</Text>
          <Text style={styles.errorSubtitle}>{String(error)}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadIncomeStatements}>
            <Text style={styles.retryButtonText}>
              {t('people', 'action', 'retry') || 'Tentar de novo'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {showEmptyState ? (
        <View style={styles.centerState}>
          <Icon name="insights" size={40} color="#94A3B8" />
          <Text style={styles.emptyTitle}>
            {t('people', 'label', 'noIncomeStatements') ||
              'Nenhum lançamento no período'}
          </Text>
          <Text style={styles.emptySubtitle}>
            Demonstrativo geral da empresa por categorias (comissões, royalties
            e demais). Visões por papel ficam em telas separadas.
          </Text>
        </View>
      ) : null}

      {showListState ? (
        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          <View style={styles.cardsWrap}>
            {monthRows.map(statement => {
              const balancePositive = (statement.balance || 0) >= 0;
              return (
                <TouchableOpacity
                  key={`stmt-${statement.month}`}
                  style={styles.card}
                  onPress={() => openStatementDetails(statement)}
                  activeOpacity={0.85}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>
                      {`${statement.label}/${selectedYear}`}
                    </Text>
                    <Text
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: balancePositive
                            ? '#16A34A'
                            : '#DC2626',
                        },
                      ]}>
                      {balancePositive ? 'POSITIVO' : 'NEGATIVO'}
                    </Text>
                  </View>
                  <Text style={styles.amount}>
                    {formatCurrency(statement.balance)}
                  </Text>
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
        </ScrollView>
      ) : null}

      <IncomeStatementDetailsModal
        visible={detailsVisible}
        statement={selectedStatement}
        onClose={handleCloseDetails}
        closeLabel={t('people', 'action', 'close') || 'Fechar'}
      />
    </SafeAreaView>
  );
};

export default IncomeStatements;
