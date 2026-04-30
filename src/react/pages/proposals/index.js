import React, { useCallback, useState, useEffect, useLayoutEffect } from 'react';
import { Text, View, TouchableOpacity, FlatList, ActivityIndicator, TextInput, RefreshControl, Platform, ScrollView } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useStore } from '@store';
import { colors } from '@controleonline/../../src/styles/colors';
import Icon from 'react-native-vector-icons/FontAwesome';
import IconAdd from 'react-native-vector-icons/MaterialIcons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import CreateProposalsModal from './CreateProposalsModal';
import Formatter from '@controleonline/ui-common/src/utils/formatter';
import { getPeopleDisplayName } from '@controleonline/ui-common/src/react/utils/peopleDisplay';
import styles from './index.styles';
import { inlineStyle_669_129 } from './index.styles';
import {
  buildProposalStatusFilterOptions,
  getProposalStatusColor,
  getProposalStatusLabel,
  proposalMatchesStatusFilter,
} from '../../utils/proposalStatus';

const ProposalsPage = () => {
  const peopleStore = useStore('people');
  const { currentCompany } = peopleStore.getters;
  const peopleActions = peopleStore.actions;
  const contractStore = useStore('contract');
  const contractGetters = contractStore.getters;
  const contractActions = contractStore.actions;
  const { items: contracts, totalItems, isLoading, error } = contractGetters;
  const navigation = useNavigation();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
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

    return normalizeText(getPeopleDisplayName(person));
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

      // nunca traduzir
      const weight = type => {
        if (type === 'provider') return 0;
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
      contract?.provider,
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
        provider: currentCompany.id,
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
      headerTitle: global.t?.t('contract','title', 'page'),
    });
  }, [navigation]);

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
    }, [fetchContracts, searchQuery, currentPage]),
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

  const statusFilterOptions = React.useMemo(
    () =>
      buildProposalStatusFilterOptions({
        contracts: allContracts || [],
        translate: global.t?.t,
      }),
    [allContracts],
  );

  const contractMatchesStatusFilter = useCallback(
    (contract, filterKey) =>
      proposalMatchesStatusFilter(contract, filterKey, statusFilterOptions),
    [statusFilterOptions],
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
            {contract.contractModel?.model || global.t?.t('contract','label', 'untitled')}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getProposalStatusColor(contract.status?.status) }]}>
            <Text style={styles.statusText}>{getProposalStatusLabel(contract.status?.status, global.t?.t)}</Text>
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
            ? global.t?.t('contract','label', 'loadingClient')
            : global.t?.t('contract','label', 'clientNotInformed');

          return (
            <View style={styles.clientRow}>
              <MaterialIcon name="person" size={14} color="#64748B" />
              <Text style={styles.clientText}>
                {global.t?.t('contract','label', 'client')}: {clientLabel}
              </Text>
            </View>
          );
        })()}

        <View style={styles.datesContainer}>
          <View style={styles.dateBadge}>
            <MaterialIcon name="event" size={14} color="#64748B" />
            <Text style={styles.dateText}>
              {global.t?.t('contract','label', 'startDate')}: {contract.startDate ? Formatter.formatDateYmdTodmY(contract.startDate) : global.t?.t('contract','label', 'na')}
            </Text>
          </View>
          {contract.endDate && (
            <View style={styles.dateBadge}>
              <MaterialIcon name="event-available" size={14} color="#64748B" />
              <Text style={styles.dateText}>
                {global.t?.t('contract','label', 'endDate')}: {Formatter.formatDateYmdTodmY(contract.endDate)}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.viewDetailsText}>{global.t?.t('contract','action', 'viewDetails')}</Text>
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
              placeholder={global.t?.t('contract','placeholder', 'search')}
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
          <Text style={styles.statusFilterLabel}>{global.t?.t('contract','label', 'status')}</Text>
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
                {global.t?.t('contract','filter', 'all')}
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
                  {global.t?.t('contract','state', 'loading')}
                </Text>
              </View>
            );
          }
          if (error && allContracts.length === 0) {
            return (
              <View style={styles.emptyContainer}>
                <MaterialIcon name="error-outline" size={48} color="#EF4444" />
                <Text style={styles.emptyTitle}>
                  {global.t?.t('contract','state', 'errorTitle')}
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
                    ? global.t?.t('contract','state', 'emptyByStatus')
                    : global.t?.t('contract','state', 'empty')}
                </Text>
                {searchQuery ? (
                  <Text style={styles.emptySubtitle}>
                    {global.t?.t('contract','state', 'searchTip')}
                  </Text>
                ) : selectedStatusFilterKey ? (
                  <Text style={styles.emptySubtitle}>
                    {global.t?.t('contract','state', 'statusTip')}
                  </Text>
                ) : (
                  <Text style={styles.emptySubtitle}>
                    {global.t?.t('contract','state', 'createTip')}
                  </Text>
                )}
              </View>
            );
          }
          return null;
        }}
        ListFooterComponent={() => isLoading && allContracts.length > 0 ? <ActivityIndicator size="small" color={colors.primary} style={inlineStyle_669_129} /> : null}
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

export default ProposalsPage;
