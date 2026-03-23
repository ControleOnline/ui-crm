import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Text } from 'react-native-animatable';
import { colors } from '@controleonline/../../src/styles/colors';
import {
  buildAssetUrl,
  resolveThemePalette,
  withOpacity,
} from '@controleonline/../../src/styles/branding';
import md5 from 'md5';

import Icon from 'react-native-vector-icons/Feather';
import { useStore } from '@store';
import { api } from '@controleonline/ui-common/src/api';
import Formatter from '@controleonline/ui-common/src/utils/formatter';

export default function HomePage({ navigation }) {
  const peopleStore = useStore('people');
  const peopleActions = peopleStore.actions;
  const authStore = useStore('auth');
  const themeStore = useStore('theme');
  const peopleGetters = peopleStore.getters;
  const authGetters = authStore.getters;
  const themeGetters = themeStore.getters;
  const { currentCompany, companies } = peopleGetters;
  const { user: authUser } = authGetters;
  const currentUser = {
    ...authUser,
    name: String(
      authUser?.realname || authUser?.name || authUser?.username || '',
    ).trim(),
  };
  const { colors: themeColors } = themeGetters;

  const [stats, setStats] = useState([
    { label: global.t?.t('people', 'title', 'opportunities'), value: '...', icon: 'trello', color: '#F59E0B', route: 'CrmIndex' },
    { label: global.t?.t('people', 'title', 'proposals'), value: '...', icon: 'file-text', color: '#3B82F6', route: 'ProposalsIndex' },
    { label: global.t?.t('people', 'title', 'contracts'), value: '...', icon: 'briefcase', color: '#10B981', route: 'ContractsIndex' },
  ]);

  const [recentActivity, setRecentActivity] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [activitySortDirection, setActivitySortDirection] = useState('desc');
  const normalizeDigits = value => String(value || '').replace(/\D/g, '');
  const normalizeText = value => String(value || '').trim();

  const firstName = currentUser?.name?.split(' ')[0] || global.t?.t('people', 'title', 'user');
  const canSwitchCompany = Array.isArray(companies) && companies.length > 1;

  const brandColors = useMemo(
    () =>
      resolveThemePalette(
        {
          ...themeColors,
          ...(currentCompany?.theme?.colors || {}),
        },
        colors,
      ),
    [themeColors, currentCompany?.id],
  );
  const companyLogoUrl = buildAssetUrl(currentCompany?.logo);
  const actionBannerDynamicStyle = useMemo(
    () => ({
      backgroundColor: brandColors.primary,
      ...Platform.select({
        ios: {
          shadowColor: brandColors.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
        },
        web: { boxShadow: `0 8px 24px ${withOpacity(brandColors.primary, 0.25)}` },
      }),
    }),
    [brandColors.primary],
  );

  const getAvatarUrl = () => {
    if (typeof currentUser?.avatarUrl === 'string' && currentUser.avatarUrl) {
      return currentUser.avatarUrl;
    }

    if (currentUser?.avatar?.url) {
      const domain = currentUser?.avatar?.domain || '';
      return `${domain}${currentUser.avatar.url}`;
    }

    if (!currentUser?.email) return 'https://www.gravatar.com/avatar/?d=identicon';
    const emailHash = md5(currentUser.email.trim().toLowerCase());
    return `https://www.gravatar.com/avatar/${emailHash}?s=200&d=identicon`;
  };

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

  const getResolvedPeopleName = (person, peopleMetaById = {}) => {
    const directName = resolvePeopleName(person);
    if (directName) {
      return directName;
    }

    const personId = extractPeopleId(person);
    return personId ? peopleMetaById[personId]?.name || '' : '';
  };

  const getResolvedPeopleType = (person, peopleMetaById = {}) => {
    if (person && typeof person === 'object' && person?.peopleType) {
      return String(person.peopleType || '').trim().toUpperCase();
    }

    const personId = extractPeopleId(person);
    return personId
      ? String(peopleMetaById[personId]?.peopleType || '').trim().toUpperCase()
      : '';
  };

  const isLegalEntity = (person, peopleMetaById = {}) =>
    getResolvedPeopleType(person, peopleMetaById) === 'J';

  const getContractPartyCandidates = contract => {
    const participants = Array.isArray(contract?.peoples) ? contract.peoples : [];
    const participantsOrdered = [...participants].sort((left, right) => {
      const leftType = String(left?.peopleType || '').trim().toLowerCase();
      const rightType = String(right?.peopleType || '').trim().toLowerCase();

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

  const getOpportunityPartyCandidates = item => {
    const participants = Array.isArray(item?.peoples) ? item.peoples : [];
    return [
      ...participants.map(entry => entry?.people || entry),
      item?.client,
      item?.provider,
      item?.people,
      item?.person,
      item?.provider,
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

  const getContractClientName = (contract, peopleMetaById = {}) => {
    const candidates = getContractPartyCandidates(contract);
    for (const candidate of candidates) {
      const personId = extractPeopleId(candidate);
      if (personId && isIgnoredContractPartyId(contract, personId)) {
        continue;
      }

      if (personId && isCurrentCompanyPerson(candidate)) {
        continue;
      }

      if (!isLegalEntity(candidate, peopleMetaById)) {
        continue;
      }

      const name = getResolvedPeopleName(candidate, peopleMetaById);
      if (name) {
        return name;
      }
    }

    return '';
  };

  const getOpportunityClientName = (item, peopleMetaById = {}) => {
    const candidates = getOpportunityPartyCandidates(item);
    for (const candidate of candidates) {
      const personId = extractPeopleId(candidate);
      if (personId && isCurrentCompanyPerson(candidate)) {
        continue;
      }

      if (!isLegalEntity(candidate, peopleMetaById)) {
        continue;
      }

      const name = getResolvedPeopleName(candidate, peopleMetaById);
      if (name) {
        return name;
      }
    }

    return '';
  };

  useEffect(() => {
    if (!currentCompany?.id) return;

    const fetchData = async () => {
      setLoadingActivity(true);
      try {
        // Params for counts and lists
        const opportunitiesParams = {
          type: 'relationship',
          provider: currentCompany.id, // Fixed: Added provider for correct count
          provider_id: currentCompany.id,
          itemsPerPage: 5,
          'order[id]': 'DESC' // Fetch latest
        };
        const proposalsParams = {
          'contractModel.context': 'proposal',
          provider: currentCompany.id,
          itemsPerPage: 5,
          'order[id]': 'DESC'
        };
        const contractsParams = {
          'contractModel.context': 'contract',
          provider: currentCompany.id,
          itemsPerPage: 5,
          'order[id]': 'DESC'
        };

        const [opportunities, proposals, contracts] = await Promise.all([
          api.fetch('/tasks', { params: opportunitiesParams }),
          api.fetch('/contracts', { params: proposalsParams }),
          api.fetch('/contracts', { params: contractsParams })
        ]);

        const opportunitiesList = Array.isArray(opportunities.member)
          ? opportunities.member
          : [];
        const proposalsList = Array.isArray(proposals.member)
          ? proposals.member
          : [];
        const contractsList = Array.isArray(contracts.member)
          ? contracts.member
          : [];

        const peopleMetaById = {};
        const missingPeopleIds = new Set();

        const collectMissingPerson = (person, shouldIgnore = () => false) => {
          const personId = extractPeopleId(person);
          if (!personId || shouldIgnore(person, personId)) {
            return;
          }

          const name = getResolvedPeopleName(person, peopleMetaById);
          const peopleType = getResolvedPeopleType(person, peopleMetaById);
          if (!name || !peopleType) {
            missingPeopleIds.add(personId);
          }
        };

        proposalsList.forEach(contract => {
          getContractPartyCandidates(contract).forEach(candidate => {
            collectMissingPerson(candidate, (_, personId) =>
              isIgnoredContractPartyId(contract, personId),
            );
          });
        });

        contractsList.forEach(contract => {
          getContractPartyCandidates(contract).forEach(candidate => {
            collectMissingPerson(candidate, (_, personId) =>
              isIgnoredContractPartyId(contract, personId),
            );
          });
        });

        opportunitiesList.forEach(item => {
          getOpportunityPartyCandidates(item).forEach(candidate => {
            collectMissingPerson(candidate, person =>
              isCurrentCompanyPerson(person),
            );
          });
        });

        if (peopleActions?.get && missingPeopleIds.size > 0) {
          const fetchedPeople = await Promise.all(
            [...missingPeopleIds].map(async personId => {
              try {
                const person = await peopleActions.get(personId);
                return {
                  personId,
                  name: resolvePeopleName(person),
                  peopleType: String(person?.peopleType || '').trim().toUpperCase(),
                };
              } catch (fetchError) {
                return { personId, name: '', peopleType: '' };
              }
            }),
          );

          fetchedPeople.forEach(({ personId, name, peopleType }) => {
            if (name || peopleType) {
              peopleMetaById[personId] = { name, peopleType };
            }
          });
        }

        // Update Stats
        setStats([
          { label: global.t?.t('people', 'title', 'opportunities'), value: String(opportunities.totalItems || 0), icon: 'trello', color: '#F59E0B', route: 'CrmIndex' },
          { label: global.t?.t('people', 'title', 'proposals'), value: String(proposals.totalItems || 0), icon: 'file-text', color: '#3B82F6', route: 'ProposalsIndex' },
          { label: global.t?.t('people', 'title', 'contracts'), value: String(contracts.totalItems || 0), icon: 'briefcase', color: '#10B981', route: 'ContractsIndex' },
        ]);

        // Process Recent Activity
        const activities = [];

        // Add Opportunities
        opportunitiesList.forEach(item => {
          const sortDate = item.dueDate ? new Date(item.dueDate).getTime() : 0;
          const clientName =
            getOpportunityClientName(item, peopleMetaById) ||
            global.t?.t('people', 'title', 'unknownClient');
          activities.push({
            id: item.id,
            originalId: item.id,
            title: `${global.t?.t('people', 'title', 'newOpportunityPrefix')} ${clientName}`,
            time: item.dueDate ? Formatter.formatDateYmdTodmY(item.dueDate) : global.t?.t('people', 'title', 'withoutDate'),
            clientName,
            type: 'lead',
            sortDate,
            rawDate: item.id,
            details: item
          });
        });

        // Add Proposals
        proposalsList.forEach(item => {
          const sortDate = item.startDate ? new Date(item.startDate).getTime() : 0;
          const clientName =
            getContractClientName(item, peopleMetaById) ||
            global.t?.t('people', 'title', 'unknownClient');
          activities.push({
            id: item.id,
            originalId: item.id,
            title: `${global.t?.t('people', 'title', 'proposalPrefix')} ${item.contractModel?.model || global.t?.t('people', 'title', 'newProposal')}`,
            time: item.startDate ? Formatter.formatDateYmdTodmY(item.startDate) : global.t?.t('people', 'title', 'withoutDate'),
            clientName,
            type: 'proposal',
            sortDate,
            rawDate: item.id,
            details: item
          });
        });

        // Add Contracts
        contractsList.forEach(item => {
          const sortDate = item.startDate ? new Date(item.startDate).getTime() : 0;
          const clientName =
            getContractClientName(item, peopleMetaById) ||
            global.t?.t('people', 'title', 'unknownClient');
          activities.push({
            id: item.id,
            originalId: item.id,
            title: `${global.t?.t('people', 'title', 'contractPrefix')} ${item.contractModel?.model || global.t?.t('people', 'title', 'newContract')}`,
            time: item.startDate ? Formatter.formatDateYmdTodmY(item.startDate) : global.t?.t('people', 'title', 'withoutDate'),
            clientName,
            type: 'calendar', // Using calendar icon for contracts
            sortDate,
            rawDate: item.id,
            details: item
          });
        });

        setRecentActivity(activities);

      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoadingActivity(false);
      }
    };

    fetchData();
  }, [currentCompany?.id]);

  const sortedRecentActivity = useMemo(() => {
    const items = [...recentActivity];
    items.sort((left, right) => {
      const leftDate = left.sortDate || 0;
      const rightDate = right.sortDate || 0;
      if (leftDate !== rightDate) {
        return activitySortDirection === 'asc'
          ? leftDate - rightDate
          : rightDate - leftDate;
      }

      const leftFallback = Number(left.rawDate || 0);
      const rightFallback = Number(right.rawDate || 0);
      return activitySortDirection === 'asc'
        ? leftFallback - rightFallback
        : rightFallback - leftFallback;
    });
    return items.slice(0, 5);
  }, [recentActivity, activitySortDirection]);

  return (
    <View style={[styles.container, { backgroundColor: brandColors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>


        {/* Stats Grid - atalhos navegáveis */}
        <Text style={styles.sectionTitle}>{global.t?.t('people', 'title', 'overView')}</Text>
        <View style={styles.statsContainer}>
          {stats.map((stat, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.statCard}
              onPress={() => stat.route && navigation.navigate(stat.route)}
              activeOpacity={0.8}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + '15' }]}>
                <Icon name={stat.icon} size={20} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Acessar Pipeline */}
        <TouchableOpacity
          style={[styles.actionBanner, actionBannerDynamicStyle]}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('CrmIndex')}>
          <View style={styles.actionContent}>
            <View>
              <Text style={styles.actionTitle}>{global.t?.t('people', 'title', 'accessPipeline')}</Text>
              <Text style={styles.actionSub}>{global.t?.t('people', 'title', 'manageDeals')}</Text>
            </View>
            <View style={styles.actionButton}>
              <Icon name="arrow-right" size={20} color={brandColors.primary} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Atalhos Clientes e Comissões */}
        <View style={styles.shortcutsRow}>

          <TouchableOpacity
            style={styles.shortcutCard}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('ProspectsIndex')}>
            <View style={[styles.shortcutIcon, { backgroundColor: '#D1FAE5' }]}>
              <Icon name="users" size={24} color={brandColors.primary} />
            </View>
            <Text style={styles.shortcutLabel}>{global.t?.t('people', 'title', 'prospects')}</Text>
            <Text style={styles.shortcutSub}>{global.t?.t('people', 'title', 'viewProspects')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shortcutCard}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('ClientsIndex')}>
            <View style={[styles.shortcutIcon, { backgroundColor: withOpacity(brandColors.primary, 0.12) }]}>
              <Icon name="users" size={24} color={brandColors.primary} />
            </View>
            <Text style={styles.shortcutLabel}>{global.t?.t('people', 'title', 'clients')}</Text>
            <Text style={styles.shortcutSub}>{global.t?.t('people', 'title', 'viewClients')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shortcutCard}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('ComissionsPage')}>
            <View style={[styles.shortcutIcon, { backgroundColor: '#D1FAE5' }]}>
              <Icon name="trending-up" size={24} color="#10B981" />
            </View>
            <Text style={styles.shortcutLabel}>{global.t?.t('people', 'title', 'commissions')}</Text>
            <Text style={styles.shortcutSub}>{global.t?.t('people', 'title', 'financialReport')}</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.sectionTitleRow}>
          <Text style={[styles.sectionTitle, styles.sectionTitleRowText]}>
            {global.t?.t('people', 'title', 'recentActivity')}
          </Text>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() =>
              setActivitySortDirection(prev => (prev === 'desc' ? 'asc' : 'desc'))
            }
            activeOpacity={0.8}>
            <Icon
              name={activitySortDirection === 'desc' ? 'arrow-down' : 'arrow-up'}
              size={14}
              color={brandColors.primary}
            />
            <Text style={[styles.sortButtonText, { color: brandColors.primary }]}>
              {activitySortDirection === 'desc'
                ? global.t?.t('people', 'title', 'mostRecent')
                : global.t?.t('people', 'title', 'oldest')}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.activityList}>
          {loadingActivity ? (
            <ActivityIndicator size="small" color={brandColors.primary} style={{ padding: 20 }} />
          ) : sortedRecentActivity.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: '#94A3B8' }}>{global.t?.t('people', 'title', 'noRecentActivity')}</Text>
            </View>
          ) : (
            sortedRecentActivity.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.activityItem,
                  idx === sortedRecentActivity.length - 1 && { borderBottomWidth: 0 },
                ]}
                onPress={() => {
                  if (item.type === 'lead') navigation.navigate('CrmIndex'); // Could navigate to details if we had the route
                  else if (item.type === 'proposal') navigation.navigate('ContractDetails', { contractId: item.originalId });
                  else if (item.type === 'calendar') navigation.navigate('ContractDetails', { contractId: item.originalId });
                }}
              >
                <View style={styles.activityIcon}>
                  <Icon
                    name={item.type === 'lead' ? 'trello' : item.type === 'proposal' ? 'file-text' : 'briefcase'}
                    size={18}
                    color="#64748B"
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.activityClient} numberOfLines={1}>
                    {global.t?.t('people', 'title', 'client')}: {item.clientName || global.t?.t('people', 'title', 'unknownClient')}
                  </Text>
                  <Text style={styles.activityTime}>{item.time}</Text>
                </View>
                <Icon name="chevron-right" size={16} color="#CBD5E1" />
              </TouchableOpacity>
            ))
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  companyName: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyLogo: {
    width: 18,
    height: 18,
    borderRadius: 4,
    marginRight: 6,
    marginTop: 2,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
    gap: 10,
  },
  sectionTitleRowText: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sortButtonText: {
    marginLeft: 6,
    fontSize: 11,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      },
      android: { elevation: 2 },
      web: { boxShadow: '0 4px 12px rgba(15,23,42,0.05)' },
    }),
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  actionBanner: {
    marginBottom: 28,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.primary, // Enhanced blue
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: { elevation: 5 },
      web: { boxShadow: '0 8px 24px rgba(79, 70, 229, 0.2)' },
    }),
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  actionSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  shortcutCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      },
      android: { elevation: 2 },
      web: { boxShadow: '0 4px 12px rgba(15,23,42,0.05)' },
    }),
  },
  shortcutIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  shortcutLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  shortcutSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  activityList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      },
      android: { elevation: 2 },
      web: { boxShadow: '0 4px 12px rgba(15,23,42,0.05)' },
    }),
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  activityClient: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
});
