import React, { useCallback, useState, useEffect, useLayoutEffect } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  RefreshControl,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useStore } from '@store';
import { colors } from '@controleonline/../../src/styles/colors';
import Icon from 'react-native-vector-icons/FontAwesome';
import IconAdd from 'react-native-vector-icons/MaterialIcons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import CreateProposalsModal from './CreateProposalsModal';
import Formatter from '@controleonline/ui-common/src/utils/formatter';
import translateWithFallback from '../../utils/translateWithFallback';

const ProposalsPage = () => {
  const tr = useCallback(
    (type, key, fallback) =>
      translateWithFallback('proposals', type, key, fallback),
    [],
  );
  const peopleStore = useStore('people');
  const { currentCompany } = peopleStore.getters;
  const peopleActions = peopleStore.actions;
  const contractStore = useStore('contract');
  const contractGetters = contractStore.getters;
  const contractActions = contractStore.actions;
  const { items: contracts, totalItems, isLoading, error } = contractGetters;
  const statusStore = useStore('status');
  const statusGetters = statusStore.getters;
  const statusActions = statusStore.actions;
  const { items: statusItems = [] } = statusGetters;
  const navigation = useNavigation();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [refreshing, setRefreshing] = useState(false);
  const [allContracts, setAllContracts] = useState([]);
  const [selectedStatusFilterKey, setSelectedStatusFilterKey] = useState('');
  const [peopleNameById, setPeopleNameById] = useState({});
  const normalizeDigits = value => String(value || '').replace(/\D/g, '');
  const normalizeText = value => String(value || '').trim();

  const extractPeopleId = person => {
    if (!person) {
      return '';
    }

    if (typeof person === 'string' || typeof person === 'number') {
      return normalizeDigits(person);
    }

    return normalizeDigits(person?.['@id'] || person?.id || person?.people);
  };

  const resolvePeopleName = person => {
    if (!person || typeof person !== 'object') {
      return '';
    }

    return normalizeText(
      person?.name || person?.alias || person?.nickname || person?.realname,
    );
  };

  const getResolvedPeopleName = person => {
    const directName = resolvePeopleName(person);
    if (directName) {
      return directName;
    }

    const personId = extractPeopleId(person);
    return personId ? peopleNameById[personId] || '' : '';
  };

  const getContractPartyCandidates = contract => {
    const participants = Array.isArray(contract?.peoples) ? contract.peoples : [];
    const participantsOrdered = [...participants].sort((left, right) => {
      const leftType = String(left?.peopleType || '').trim().toLowerCase();
      const rightType = String(right?.peopleType || '').trim().toLowerCase();

      const weight = type => {
        if (type === 'beneficiary') return 0;
        if (type === 'contractor') return 1;
        if (type === 'witness') return 2;
        return 3;
      };

      return weight(leftType) - weight(rightType);
    });

    return [
      ...participantsOrdered.map(entry => entry?.people),
      contract?.client,
      contract?.customer,
      contract?.contractor,
      contract?.people,
      contract?.beneficiary,
    ].filter(Boolean);
  };

  const isCurrentCompanyPerson = person => {
    const reference = String(
      typeof person === 'object' ? person?.['@id'] || person?.id : person || '',
    ).trim();
    const companyId = normalizeDigits(currentCompany?.id);
    if (!reference || !companyId) {
      return false;
    }

    const referenceDigits = extractPeopleId(reference);
    return (
      reference === `/people/${companyId}` ||
      reference === `/peoples/${companyId}` ||
      referenceDigits === companyId
    );
  };

  const isIgnoredContractPartyId = (contract, personId) => {
    if (!personId) {
      return true;
    }

    const companyId = normalizeDigits(currentCompany?.id);
    const modelPeopleId = normalizeDigits(contract?.contractModel?.people);
    const signerId = normalizeDigits(contract?.contractModel?.signer);

    return [companyId, modelPeopleId, signerId].some(
      referenceId => referenceId && referenceId === personId,
    );
  };

  const getContractClientName = contract => {
    const candidates = getContractPartyCandidates(contract);
    for (const candidate of candidates) {
      const personId = extractPeopleId(candidate);
      if (personId && isIgnoredContractPartyId(contract, personId)) {
        continue;
      }

      if (personId && isCurrentCompanyPerson(candidate)) {
        continue;
      }

      const name = getResolvedPeopleName(candidate);
      if (name) {
        return name;
      }
    }

    return '';
  };

  const isContractClientPendingResolution = contract => {
    const candidates = getContractPartyCandidates(contract);
    return candidates.some(candidate => {
      const personId = extractPeopleId(candidate);
      if (!personId || isIgnoredContractPartyId(contract, personId)) {
        return false;
      }

      const name = getResolvedPeopleName(candidate);
      return !name;
    });
  };

  useEffect(() => {
    if (!peopleActions?.get || !Array.isArray(allContracts) || allContracts.length === 0) {
      return;
    }

    const missingIds = new Set();

    allContracts.forEach(contract => {
      getContractPartyCandidates(contract).forEach(candidate => {
        const personId = extractPeopleId(candidate);
        if (!personId || isIgnoredContractPartyId(contract, personId)) {
          return;
        }

        const name = getResolvedPeopleName(candidate);
        if (!name && !peopleNameById[personId]) {
          missingIds.add(personId);
        }
      });
    });

    if (missingIds.size === 0) {
      return;
    }

    let cancelled = false;

    (async () => {
      const fetchedPeople = await Promise.all(
        [...missingIds].map(async personId => {
          try {
            const person = await peopleActions.get(personId);
            return {
              personId,
              name: resolvePeopleName(person),
            };
          } catch (error) {
            return { personId, name: '' };
          }
        }),
      );

      if (cancelled) {
        return;
      }

      setPeopleNameById(prev => {
        const next = { ...prev };
        fetchedPeople.forEach(({ personId, name }) => {
          if (name && !next[personId]) {
            next[personId] = name;
          }
        });
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [allContracts, peopleActions, currentCompany?.id]);

  const fetchContracts = useCallback(
    (query, page, statusFilterParam) => {
      if (!currentCompany?.id) {
        return;
      }

      const params = {
        beneficiary: currentCompany.id,
        'contractModel.context': 'proposal',
        page: page ?? currentPage,
        itemsPerPage,
      };

      if (String(query ?? searchQuery).trim()) {
        params['peoples.people.name'] = String(query ?? searchQuery).trim();
      }

      const selectedFilter = statusFilterParam ?? selectedStatusFilterKey;
      if (selectedFilter) {
        if (selectedFilter.startsWith('/statuses/')) {
          params.status = selectedFilter;
        } else if (selectedFilter.startsWith('realStatus:')) {
          params['status.realStatus'] = selectedFilter.replace('realStatus:', '');
        }
      }

      contractActions.getItems(params);
    },
    [
      currentCompany?.id,
      currentPage,
      itemsPerPage,
      searchQuery,
      selectedStatusFilterKey,
    ],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: tr('title', 'page', 'Propostas'),
    });
  }, [navigation, tr]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(search.trim());
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useFocusEffect(
    useCallback(() => {
      fetchContracts(searchQuery, currentPage);
      statusActions.getItems({context: 'proposal'});
    }, [fetchContracts, searchQuery, currentPage, statusActions]),
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, selectedStatusFilterKey]);

  useEffect(() => {
    if (isLoading) return;

    if (contracts && Array.isArray(contracts)) {
      if (currentPage === 1) {
        setAllContracts(contracts);
      } else {
        setAllContracts(prev => {
          const newIds = new Set(contracts.map(c => c.id));
          const filteredPrev = prev.filter(p => !newIds.has(p.id));
          return [...filteredPrev, ...contracts];
        });
      }
    }
  }, [contracts, currentPage, isLoading]);

  const handleCreateSuccess = () => {
    fetchContracts(searchQuery, 1);
    setCurrentPage(1);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchContracts(searchQuery, 1);
    setCurrentPage(1);
    setRefreshing(false);
  }, [fetchContracts, searchQuery]);

  const normalizeStatusKey = status =>
    String(status || '')
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ');

  const getStatusColor = status => {
    const normalized = normalizeStatusKey(status);

    switch (normalized) {
      case 'ativo':
      case 'active':
      case 'assinado':
      case 'signed':
        return '#10B981'; // Green
      case 'inativo':
      case 'inactive':
      case 'cancelado':
      case 'cancelled':
      case 'canceled':
        return '#EF4444'; // Red
      case 'pendente':
      case 'pending':
        return '#F59E0B'; // Orange
      case 'open':
      case 'aberto':
        return '#3B82F6'; // Blue
      default:
        return '#64748B'; // Gray
    }
  };

  const getStatusLabel = status => {
    const normalized = normalizeStatusKey(status);
    const map = {
      ativo: tr('status', 'active', 'Ativo'),
      active: tr('status', 'active', 'Ativo'),
      inativo: tr('status', 'inactive', 'Inativo'),
      inactive: tr('status', 'inactive', 'Inativo'),
      pendente: tr('status', 'pending', 'Pendente'),
      pending: tr('status', 'pending', 'Pendente'),
      open: tr('status', 'open', 'Aberto'),
      aberto: tr('status', 'open', 'Aberto'),
      closed: tr('status', 'closed', 'Fechado'),
      fechado: tr('status', 'closed', 'Fechado'),
      cancelado: tr('status', 'canceled', 'Cancelado'),
      cancelled: tr('status', 'canceled', 'Cancelado'),
      canceled: tr('status', 'canceled', 'Cancelado'),
      'waiting signature': tr('status', 'waitingSignature', 'Aguardando Assinatura'),
      'awaiting signature': tr('status', 'waitingSignature', 'Aguardando Assinatura'),
      'signature pending': tr('status', 'waitingSignature', 'Aguardando Assinatura'),
      assinado: tr('status', 'signed', 'Assinado'),
      signed: tr('status', 'signed', 'Assinado'),
      draft: tr('status', 'draft', 'Rascunho'),
      rascunho: tr('status', 'draft', 'Rascunho'),
    };

    return map[normalized] || status || tr('label', 'na', '-');
  };

  const getStatusFilterKey = useCallback(
    item => {
      if (!item) {
        return '';
      }

      if (item['@id']) {
        return item['@id'];
      }

      if (item.id != null) {
        return `/statuses/${item.id}`;
      }

      const normalized = normalizeStatusKey(item.realStatus || item.status);
      return normalized ? `realStatus:${normalized}` : '';
    },
    [normalizeStatusKey],
  );

  const statusFilterOptions = React.useMemo(() => {
    const seen = new Set();

    return (Array.isArray(statusItems) ? statusItems : [])
      .map(item => {
        const key = getStatusFilterKey(item);
        if (!key || seen.has(key)) {
          return null;
        }
        seen.add(key);

        const rawStatus = item?.realStatus || item?.status;
        return {
          key,
          label: getStatusLabel(rawStatus),
          color: item?.color || getStatusColor(rawStatus),
          normalizedStatus: normalizeStatusKey(rawStatus),
        };
      })
      .filter(Boolean);
  }, [
    getStatusColor,
    getStatusFilterKey,
    getStatusLabel,
    normalizeStatusKey,
    statusItems,
  ]);

  const contractMatchesStatusFilter = useCallback(
    (contract, filterKey) => {
      if (!filterKey) {
        return true;
      }

      const statusObj = contract?.status || {};
      const statusIri = statusObj?.['@id']
        ? statusObj['@id']
        : statusObj?.id != null
        ? `/statuses/${statusObj.id}`
        : '';

      const normalizedStatus = normalizeStatusKey(
        statusObj?.realStatus || statusObj?.status,
      );
      const normalizedFilter = normalizeStatusKey(
        String(filterKey || '').replace('realStatus:', ''),
      );

      if (filterKey.startsWith('/statuses/')) {
        if (statusIri === filterKey) {
          return true;
        }

        const selectedOption = statusFilterOptions.find(
          item => item.key === filterKey,
        );
        if (selectedOption?.normalizedStatus) {
          return normalizedStatus === selectedOption.normalizedStatus;
        }

        return false;
      }

      return normalizedStatus === normalizedFilter;
    },
    [normalizeStatusKey, statusFilterOptions],
  );

  useEffect(() => {
    if (!selectedStatusFilterKey) {
      return;
    }

    const stillExists = statusFilterOptions.some(
      item => item.key === selectedStatusFilterKey,
    );

    if (!stillExists) {
      setSelectedStatusFilterKey('');
    }
  }, [selectedStatusFilterKey, statusFilterOptions]);

  const filteredContracts = selectedStatusFilterKey
    ? allContracts.filter(contract =>
        contractMatchesStatusFilter(contract, selectedStatusFilterKey),
      )
    : allContracts;

  const renderProposal = ({ item: contract }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ProposalDetails', { contractId: contract.id })}
      activeOpacity={0.9}
    >
      <View style={styles.cardHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.cardTitle}>
            {contract.contractModel?.model || tr('label', 'untitled', 'Sem titulo')}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(contract.status?.status) }]}>
            <Text style={styles.statusText}>{getStatusLabel(contract.status?.status)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardBody}>
        {(() => {
          const clientName = getContractClientName(contract);
          const isPendingClient = isContractClientPendingResolution(contract);
          const clientLabel = clientName
            ? clientName
            : isPendingClient
            ? tr('label', 'loadingClient', 'Carregando cliente...')
            : tr('label', 'clientNotInformed', 'Cliente nao informado');

          return (
            <View style={styles.clientRow}>
              <MaterialIcon name="person" size={14} color="#64748B" />
              <Text style={styles.clientText}>
                {tr('label', 'client', 'Cliente')}: {clientLabel}
              </Text>
            </View>
          );
        })()}

        <View style={styles.datesContainer}>
          <View style={styles.dateBadge}>
            <MaterialIcon name="event" size={14} color="#64748B" />
            <Text style={styles.dateText}>
              {tr('label', 'startDate', 'Inicio')}: {contract.startDate ? Formatter.formatDateYmdTodmY(contract.startDate) : tr('label', 'na', '-')}
            </Text>
          </View>
          {contract.endDate && (
            <View style={styles.dateBadge}>
              <MaterialIcon name="event-available" size={14} color="#64748B" />
              <Text style={styles.dateText}>
                {tr('label', 'endDate', 'Fim')}: {Formatter.formatDateYmdTodmY(contract.endDate)}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.viewDetailsText}>{tr('action', 'viewDetails', 'Ver detalhes')}</Text>
        <Icon name="chevron-right" size={12} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.subHeader}>
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <Icon name="search" size={16} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder={tr('placeholder', 'search', 'Buscar proposta...')}
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
              underlineColorAndroid="transparent"
            />
            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearch('')}
                style={styles.clearSearchButton}>
                <Icon name="times-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setCreateModalVisible(true)}
            activeOpacity={0.8}>
            <IconAdd name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.statusFilterSection}>
          <Text style={styles.statusFilterLabel}>{tr('label', 'status', 'Status')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statusFilterRow}>
            <TouchableOpacity
              onPress={() => setSelectedStatusFilterKey('')}
              style={[
                styles.statusFilterChip,
                !selectedStatusFilterKey && styles.statusFilterChipActive,
              ]}>
              <Text
                style={[
                  styles.statusFilterChipText,
                  !selectedStatusFilterKey && styles.statusFilterChipTextActive,
                ]}>
                {tr('filter', 'all', 'Todos')}
              </Text>
            </TouchableOpacity>

            {statusFilterOptions.map(item => {
              const isActive = selectedStatusFilterKey === item.key;

              return (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => setSelectedStatusFilterKey(item.key)}
                  style={[
                    styles.statusFilterChip,
                    isActive && styles.statusFilterChipActive,
                    {
                      borderColor: isActive ? item.color : '#DCE3EC',
                      backgroundColor: isActive ? `${item.color}24` : '#F8FAFC',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.statusFilterChipText,
                      { color: isActive ? item.color : '#64748B' },
                    ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      <FlatList
        data={filteredContracts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderProposal}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => {
          if (isLoading && allContracts.length === 0) {
            return (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>
                  {tr('state', 'loading', 'Carregando propostas...')}
                </Text>
              </View>
            );
          }
          if (error && allContracts.length === 0) {
            return (
              <View style={styles.emptyContainer}>
                <MaterialIcon name="error-outline" size={48} color="#EF4444" />
                <Text style={styles.emptyTitle}>
                  {tr('state', 'errorTitle', 'Erro ao carregar')}
                </Text>
                <Text style={styles.emptySubtitle}>{error}</Text>
              </View>
            );
          }
          if (!isLoading && filteredContracts.length === 0) {
            return (
              <View style={styles.emptyContainer}>
                <Icon name="file-text-o" size={48} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>
                  {selectedStatusFilterKey
                    ? tr('state', 'emptyByStatus', 'Nenhuma proposta com este status')
                    : tr('state', 'empty', 'Nenhuma proposta encontrada')}
                </Text>
                {searchQuery ? (
                  <Text style={styles.emptySubtitle}>
                    {tr('state', 'searchTip', 'Tente buscar por outro termo')}
                  </Text>
                ) : selectedStatusFilterKey ? (
                  <Text style={styles.emptySubtitle}>
                    {tr('state', 'statusTip', 'Selecione outro status')}
                  </Text>
                ) : (
                  <Text style={styles.emptySubtitle}>
                    {tr('state', 'createTip', 'Use o botao + para criar uma nova proposta')}
                  </Text>
                )}
              </View>
            );
          }
          return null;
        }}
        ListFooterComponent={() => isLoading && allContracts.length > 0 ? <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} /> : null}
        onEndReached={() => {
          if (!isLoading && allContracts.length < totalItems) {
            setCurrentPage(p => p + 1);
          }
        }}
        onEndReachedThreshold={0.5}
      />

      <CreateProposalsModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  subHeader: {
    paddingHorizontal: 16,
    paddingTop: 9,
    paddingBottom: 9,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusFilterSection: {
    marginTop: 10,
  },
  statusFilterLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 8,
  },
  statusFilterRow: {
    paddingRight: 4,
  },
  statusFilterChip: {
    borderWidth: 1,
    borderColor: '#DCE3EC',
    backgroundColor: '#F8FAFC',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
  },
  statusFilterChipActive: {
    borderColor: colors.primary,
    backgroundColor: '#E7F3FF',
  },
  statusFilterChipText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  statusFilterChipTextActive: {
    color: colors.primary,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 8,
    fontSize: 14,
    color: colors.text,
  },
  clearSearchButton: {
    padding: 4,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      android: { elevation: 4 },
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      web: { boxShadow: '0 8px 16px rgba(15, 23, 42, 0.1), 0 2px 6px rgba(15, 23, 42, 0.06)' },
    }),
  },
  cardHeader: {
    marginBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 12,
    lineHeight: 22,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardBody: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 12,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  clientText: {
    fontSize: 13,
    color: colors.text,
    marginLeft: 6,
    fontWeight: '500',
    flex: 1,
  },
  datesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 4,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});

export default ProposalsPage;

