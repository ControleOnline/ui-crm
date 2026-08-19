/*
 * Seller commissions view — invoices tipo `comission`.
 * O vendedor recebe da empresa (resumo mensal). Não misturar com royalties.
 */
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {useStore} from '@store';
import {api} from '@controleonline/ui-common/src/api';
import styles from './SellerCommissionsPage.styles';
import {
  buildComissionRequestParams,
  buildMonthOptions,
  collectClientsFromInvoices,
  filterInvoicesByClient,
  formatCurrency,
  groupCommissionsByMonth,
  normalizeComissionList,
  extractClientFromInvoice,
} from './sellerCommissionsHelpers';

const COMISSION_ENDPOINT = '/finance/comission';
const FALLBACK_INVOICES_ENDPOINT = '/invoices';

const SellerCommissionsPage = () => {
  const peopleStore = useStore('people');
  const authStore = useStore('auth');
  const invoiceStore = useStore('invoice');

  const peopleGetters = peopleStore?.getters || {};
  const authGetters = authStore?.getters || {};
  const invoiceGetters = invoiceStore?.getters || {};

  const {currentCompany} = peopleGetters;
  const {user} = authGetters;
  const isLoadingStore = Boolean(invoiceGetters?.isLoading);
  const storeError = invoiceGetters?.error || null;

  const sellerPeopleId = user?.people ?? user?.people_id ?? null;

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rawInvoices, setRawInvoices] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('0');
  const [selectedYear, setSelectedYear] = useState(
    String(new Date().getFullYear()),
  );
  const [selectedClientId, setSelectedClientId] = useState('');
  const hasLoadedInitially = useRef(false);

  const translate = useCallback(
    (store, type, key) => global.t?.t(store, type, key),
    [],
  );

  const monthOptions = useMemo(
    () => buildMonthOptions(translate),
    [translate],
  );

  const monthLabelById = useMemo(
    () =>
      monthOptions.reduce((acc, option) => {
        acc[option.id] = option.label;
        return acc;
      }, {}),
    [monthOptions],
  );

  const canLoad = Boolean(sellerPeopleId);

  const fetchComissions = useCallback(async () => {
    if (!canLoad) return;

    setLoading(true);
    setError(null);

    const params = buildComissionRequestParams({
      year: selectedYear,
      month: selectedMonth,
      receiverId: sellerPeopleId,
      clientId: selectedClientId || undefined,
    });

    try {
      let response;
      try {
        response = await api.fetch(COMISSION_ENDPOINT, {
          method: 'GET',
          params,
        });
      } catch (primaryError) {
        // Fallback: standard invoices filtered by type + receiver
        response = await api.fetch(FALLBACK_INVOICES_ENDPOINT, {
          method: 'GET',
          params: {
            ...params,
            invoiceType: 'comission',
            receiver: sellerPeopleId,
          },
        });
      }

      const list = normalizeComissionList(response);
      setRawInvoices(list);
    } catch (e) {
      setError(e?.message || String(e));
      setRawInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [canLoad, selectedYear, selectedMonth, selectedClientId, sellerPeopleId]);

  useFocusEffect(
    useCallback(() => {
      hasLoadedInitially.current = true;
      fetchComissions();
    }, [fetchComissions]),
  );

  useEffect(() => {
    if (!canLoad || !hasLoadedInitially.current) return;
    fetchComissions();
  }, [canLoad, fetchComissions, selectedMonth, selectedYear, selectedClientId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchComissions();
    } finally {
      setRefreshing(false);
    }
  }, [fetchComissions]);

  const filteredInvoices = useMemo(
    () => filterInvoicesByClient(rawInvoices, selectedClientId || null),
    [rawInvoices, selectedClientId],
  );

  const clientOptions = useMemo(
    () => collectClientsFromInvoices(rawInvoices),
    [rawInvoices],
  );

  const monthRows = useMemo(
    () =>
      groupCommissionsByMonth(filteredInvoices, {
        selectedMonth,
        year: selectedYear,
        monthLabelById,
      }),
    [filteredInvoices, selectedMonth, selectedYear, monthLabelById],
  );

  const isBusy = loading || isLoadingStore;
  const displayError = error || storeError;
  const showEmpty = !isBusy && !displayError && monthRows.length === 0;
  const showList = !isBusy && !displayError && monthRows.length > 0;

  const renderMonthCard = ({item}) => (
    <View style={styles.monthCard} testID={`seller-commission-month-${item.month}`}>
      <View style={styles.monthCardHeader}>
        <Text style={styles.monthCardTitle}>{item.label}</Text>
        <Text style={styles.monthCardCount}>
          {item.count}{' '}
          {item.count === 1
            ? translate('invoice', 'label', 'invoice') || 'fatura'
            : translate('invoice', 'label', 'invoices') || 'faturas'}
        </Text>
      </View>
      <View style={styles.receiveRow}>
        <Text style={styles.receiveLabel}>
          {translate('invoice', 'label', 'toReceive') || 'A receber'}
        </Text>
        <Text style={styles.receiveAmount}>{formatCurrency(item.total)}</Text>
      </View>
      <Text style={styles.senseHint}>
        {translate('crm', 'hint', 'sellerReceivesFromCompany') ||
          'Vendedor recebe da empresa (tipo comission)'}
      </Text>
      {Array.isArray(item.invoices) && item.invoices.length > 0 ? (
        <View style={styles.detailsCard}>
          {item.invoices.slice(0, 8).map(invoice => {
            const client = extractClientFromInvoice(invoice);
            const key = invoice?.id || `${item.month}-${invoice?.price}`;
            return (
              <View key={String(key)} style={styles.detailRow}>
                <Text style={styles.detailClient} numberOfLines={1}>
                  {client?.name ||
                    `#${invoice?.id || ''}` ||
                    translate('people', 'label', 'noClient') ||
                    'Cliente'}
                </Text>
                <Text style={styles.detailAmount}>
                  {formatCurrency(invoice?.price)}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.page} edges={['bottom']} testID="seller-commissions-page">
      <View style={styles.filtersContainer}>
        <View style={styles.yearRow}>
          <Text style={styles.filterLabel}>
            {translate('people', 'label', 'year') || 'Ano'}
          </Text>
          <View style={styles.yearControl}>
            <TouchableOpacity
              style={styles.yearStepButton}
              onPress={() => {
                const current = parseInt(selectedYear || '0', 10);
                if (!current) return;
                setSelectedYear(String(current - 1));
              }}
              testID="seller-commissions-year-dec">
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
              testID="seller-commissions-year-input"
            />
            <TouchableOpacity
              style={styles.yearStepButton}
              onPress={() => {
                const current = parseInt(selectedYear || '0', 10);
                if (!current) return;
                setSelectedYear(String(current + 1));
              }}
              testID="seller-commissions-year-inc">
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
          renderItem={({item}) => (
            <TouchableOpacity
              style={[
                styles.monthChip,
                selectedMonth === item.id && styles.monthChipActive,
              ]}
              onPress={() => setSelectedMonth(item.id)}
              testID={`seller-commissions-month-chip-${item.id}`}>
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

        {clientOptions.length > 0 ? (
          <View style={styles.clientFilterRow}>
            <Text style={styles.filterLabel}>
              {translate('people', 'label', 'client') || 'Cliente'}
            </Text>
            <FlatList
              data={[{id: '', name: translate('people', 'month', 'all') || 'Todos'}, ...clientOptions]}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={item => String(item.id || 'all')}
              contentContainerStyle={styles.clientChips}
              renderItem={({item}) => {
                const active = String(selectedClientId || '') === String(item.id || '');
                return (
                  <TouchableOpacity
                    style={[styles.clientChip, active && styles.clientChipActive]}
                    onPress={() => setSelectedClientId(item.id ? String(item.id) : '')}
                    testID={`seller-commissions-client-chip-${item.id || 'all'}`}>
                    <Text
                      style={[
                        styles.clientChipText,
                        active && styles.clientChipTextActive,
                      ]}
                      numberOfLines={1}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        ) : null}
      </View>

      {isBusy && !refreshing ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#0EA5E9" />
        </View>
      ) : null}

      {displayError ? (
        <View style={styles.centerState}>
          <Text style={styles.errorTitle}>
            {translate('people', 'state', 'errorTitle') || 'Erro'}
          </Text>
          <Text style={styles.errorSubtitle}>{String(displayError)}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchComissions}>
            <Text style={styles.retryButtonText}>
              {translate('people', 'action', 'retry') || 'Tentar de novo'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {showEmpty ? (
        <View style={styles.centerState} testID="seller-commissions-empty">
          <Text style={styles.emptyTitle}>
            {translate('crm', 'state', 'noCommissions') || 'Nenhuma comissão'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {translate('crm', 'state', 'noCommissionsHint') ||
              'Não há invoices do tipo comission para o período e filtros selecionados.'}
          </Text>
        </View>
      ) : null}

      {showList ? (
        <FlatList
          data={monthRows}
          keyExtractor={item => String(item.month)}
          renderItem={renderMonthCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          testID="seller-commissions-list"
        />
      ) : null}
    </SafeAreaView>
  );
};

export default SellerCommissionsPage;
