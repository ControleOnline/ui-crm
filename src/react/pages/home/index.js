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
import CompanySelector from '../../components/CompanySelector';
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
  const authStore = useStore('auth');
  const themeStore = useStore('theme');
  const peopleGetters = peopleStore.getters;
  const authGetters = authStore.getters;
  const themeGetters = themeStore.getters;
  const { currentCompany } = peopleGetters;
  const {user: authUser} = authGetters;
  const currentUser = {
    ...authUser,
    name: String(
      authUser?.realname || authUser?.name || authUser?.username || '',
    ).trim(),
  };
  const {colors: themeColors} = themeGetters;

  const [stats, setStats] = useState([
    { label: 'Oportunidades', value: '...', icon: 'trello', color: '#F59E0B', route: 'CrmIndex' },
    { label: 'Propostas', value: '...', icon: 'file-text', color: '#3B82F6', route: 'ProposalsIndex' },
    { label: 'Contratos', value: '...', icon: 'briefcase', color: '#10B981', route: 'ContractsIndex' },
  ]);

  const [recentActivity, setRecentActivity] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  const firstName = currentUser?.name?.split(' ')[0] || 'Usuário';

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
          beneficiary: currentCompany.id,
          itemsPerPage: 5,
          'order[id]': 'DESC'
        };
        const contractsParams = {
          'contractModel.context': 'contract',
          beneficiary: currentCompany.id,
          itemsPerPage: 5,
          'order[id]': 'DESC'
        };

        const [opportunities, proposals, contracts] = await Promise.all([
          api.fetch('/tasks', { params: opportunitiesParams }),
          api.fetch('/contracts', { params: proposalsParams }),
          api.fetch('/contracts', { params: contractsParams })
        ]);

        // Update Stats
        setStats([
          { label: 'Oportunidades', value: String(opportunities.totalItems || 0), icon: 'trello', color: '#F59E0B', route: 'CrmIndex' },
          { label: 'Propostas', value: String(proposals.totalItems || 0), icon: 'file-text', color: '#3B82F6', route: 'ProposalsIndex' },
          { label: 'Contratos', value: String(contracts.totalItems || 0), icon: 'briefcase', color: '#10B981', route: 'ContractsIndex' },
        ]);

        // Process Recent Activity
        const activities = [];

        // Add Opportunities
        (opportunities.member || []).forEach(item => {
          activities.push({
            id: item.id,
            originalId: item.id,
            title: `Nova oportunidade: ${item.client?.name || 'Cliente desconhecido'}`,
            time: item.dueDate ? Formatter.formatDateYmdTodmY(item.dueDate) : 'Sem data',
            type: 'lead',
            rawDate: item.id, // Using ID as proxy for recency
            details: item
          });
        });

        // Add Proposals
        (proposals.member || []).forEach(item => {
          activities.push({
            id: item.id,
            originalId: item.id,
            title: `Proposta: ${item.contractModel?.model || 'Nova proposta'}`,
            time: item.startDate ? Formatter.formatDateYmdTodmY(item.startDate) : 'Sem data',
            type: 'proposal',
            rawDate: item.id,
            details: item
          });
        });

        // Add Contracts
        (contracts.member || []).forEach(item => {
          activities.push({
            id: item.id,
            originalId: item.id,
            title: `Contrato: ${item.contractModel?.model || 'Novo contrato'}`,
            time: item.startDate ? Formatter.formatDateYmdTodmY(item.startDate) : 'Sem data',
            type: 'calendar', // Using calendar icon for contracts
            rawDate: item.id,
            details: item
          });
        });

        // Sort by ID descending and take top 5
        activities.sort((a, b) => b.rawDate - a.rawDate);
        setRecentActivity(activities.slice(0, 5));

      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoadingActivity(false);
      }
    };

    fetchData();
  }, [currentCompany?.id]);

  return (
    <View style={[styles.container, {backgroundColor: brandColors.background}]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text animation="fadeIn" style={styles.greeting}>
              Olá, {firstName}
            </Text>
            <CompanySelector>
              <View style={styles.companyRow}>
                {companyLogoUrl ? (
                  <Image source={{ uri: companyLogoUrl }} style={styles.companyLogo} />
                ) : null}
                <Text animation="fadeIn" delay={100} style={[styles.companyName, {color: brandColors.textSecondary}]}>
                  {currentCompany?.alias || currentCompany?.name || 'Bem-vindo ao CRM'}
                </Text>
                <Icon name="chevron-down" size={14} color={brandColors.textSecondary} style={{ marginLeft: 4, marginTop: 4 }} />
              </View>
            </CompanySelector>
          </View>
          <TouchableOpacity
            style={[
              styles.avatarWrap,
              {
                backgroundColor: withOpacity(brandColors.primary, 0.12),
                borderColor: withOpacity(brandColors.primary, 0.25),
              },
            ]}
            onPress={() => navigation.navigate('ProfilePage')}
            activeOpacity={0.8}>
            <Image
              source={{ uri: getAvatarUrl() }}
              style={{ width: 40, height: 40, borderRadius: 20 }}
            />
          </TouchableOpacity>
        </View>

        {/* Stats Grid - atalhos navegáveis */}
        <Text style={styles.sectionTitle}>Visão Geral</Text>
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
              <Text style={styles.actionTitle}>Acessar Pipeline</Text>
              <Text style={styles.actionSub}>Gerencie suas negociações</Text>
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
            onPress={() => navigation.navigate('ClientsIndex')}>
            <View style={[styles.shortcutIcon, { backgroundColor: withOpacity(brandColors.primary, 0.12) }]}>
              <Icon name="users" size={24} color={brandColors.primary} />
            </View>
            <Text style={styles.shortcutLabel}>Clientes</Text>
            <Text style={styles.shortcutSub}>Ver lista de clientes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shortcutCard}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('ComissionsPage')}>
            <View style={[styles.shortcutIcon, { backgroundColor: '#D1FAE5' }]}>
              <Icon name="trending-up" size={24} color="#10B981" />
            </View>
            <Text style={styles.shortcutLabel}>Comissões</Text>
            <Text style={styles.shortcutSub}>Relatório financeiro</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Atividade Recente</Text>
        <View style={styles.activityList}>
          {loadingActivity ? (
            <ActivityIndicator size="small" color={brandColors.primary} style={{ padding: 20 }} />
          ) : recentActivity.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: '#94A3B8' }}>Nenhuma atividade recente</Text>
            </View>
          ) : (
            recentActivity.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.activityItem, idx === recentActivity.length - 1 && { borderBottomWidth: 0 }]}
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
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
    letterSpacing: -0.3,
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
    fontSize: 15,
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
  activityTime: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
});
