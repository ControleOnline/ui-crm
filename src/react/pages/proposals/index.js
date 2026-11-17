import React, { useCallback, useState, useEffect, useLayoutEffect } from 'react';
import { Text, View, TouchableOpacity, FlatList, ActivityIndicator, TextInput, RefreshControl, Platform, ScrollView } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useStore } from '@store';
import { colors } from '@controleonline/../../src/styles/colors';
import Icon from 'react-native-vector-icons/FontAwesome';
import IconAdd from 'react-native-vector-icons/MaterialIcons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import CreateProposalsModal from './CreateProposalsModal';
import ProposalCard from './ProposalCard';
import {
  normalizeDigits,
  normalizeStatusKey,
  getStatusColor,
  getStatusLabel,
  extractPeopleId,
  resolvePeopleName,
  getContractPartyCandidates,
  isIgnoredContractPartyId,
  getResolvedPeopleName,
  getContractClientName as resolveContractClientName,
  isContractClientPendingResolution as resolveContractClientPending,
} from './proposalListHelpers';
import Formatter from '@controleonline/ui-common/src/utils/formatter';
import { getPeopleDisplayName } from '@controleonline/ui-common/src/react/utils/peopleDisplay';
import styles from './index.styles';
import { inlineStyle_669_129 } from './index.styles';

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
  const [refreshing, setRefreshing] = useState(false);
  const [allContracts, setAllContracts] = useState([]);
  const [selectedStatusFilterKey, setSelectedStatusFilterKey] = useState('');
  const [peopleNameById, setPeopleNameById] = useState({});
  const pageTitle =
    global.t?.t('contract', 'title', 'page') || 'Propostas';




  useEffect(() => {
    if (!peopleActions?.get || !Array.isArray(allContracts) || allContracts.length === 0) {
      return;
    }

    const missingIds = new Set();

    allContracts.forEach(contract => {
      getContractPartyCandidates(contract).forEach(candidate => {
        const personId = extractPeopleId(candidate);
        if (!personId || isIgnoredContractPartyId(contract, personId, currentCompany)) {
          return;
        }

        const name = getResolvedPeopleName(candidate, peopleNameById);
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
      searchQuery,
      selectedStatusFilterKey,
    ],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: pageTitle,
    });
  }, [navigation, pageTitle]);

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
  }, [selectedStatusFilterKey]);

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

  const statusFilterOptions = React.useMemo(
    () => {
      const options = [
        {
          key: 'realStatus:open',
          label: global.t?.t('contract','status', 'open') || 'Em aberto',
          color: getStatusColor('open'),
          normalizedStatus: 'open',
        },
        {
          key: 'realStatus:pending',
          label: global.t?.t('contract','status', 'pending') || 'Pendente',
          color: getStatusColor('pending'),
          normalizedStatus: 'pending',
        },
        {
          key: 'realStatus:closed',
          label: global.t?.t('contract','status', 'closed') || 'Fechado',
          color: getStatusColor('closed'),
          normalizedStatus: 'closed',
        },
      ];

      (allContracts || []).forEach(contract => {
        const statusObj = contract?.status || {};
        const key = getStatusFilterKey(statusObj);
        if (!key || options.some(item => item.key === key)) return;

        const normalizedStatus = normalizeStatusKey(statusObj?.realStatus || statusObj?.status);
        options.push({
          key,
          label: getStatusLabel(statusObj?.status || statusObj?.realStatus),
          color: statusObj?.color || getStatusColor(normalizedStatus),
          normalizedStatus,
        });
      });

      return options;
    },
    [allContracts, getStatusFilterKey, getStatusColor, getStatusLabel, normalizeStatusKey],
  );

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
    <ProposalCard
      contract={contract}
      navigation={navigation}
      getStatusColor={getStatusColor}
      getStatusLabel={getStatusLabel}
      getContractClientName={getContractClientName}
      isContractClientPendingResolution={isContractClientPendingResolution}
    />
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
                <MaterialIcon name="error-outline" size={48} color="#c10015" />
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
