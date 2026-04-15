import React, { useEffect, useState, useLayoutEffect, useRef } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useStores } from '@store';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RenderHTML from 'react-native-render-html';
import { colors } from '@controleonline/../../src/styles/colors';
import { useMessage } from '@controleonline/ui-common/src/react/components/MessageService';
import LinkedOrderProductsTab from '@controleonline/ui-common/src/react/components/LinkedOrderProductsTab';

const { width } = Dimensions.get('window');

const PropostaTab = ({ contract, fileContent, fileLoading, fileError, canEdit, handleSendPropostal }) => {
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.tabScroll}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: canEdit ? 120 : 40,
        }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Proposta</Text>

          {fileLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Carregando proposta...</Text>
            </View>
          ) : fileError ? (
            <Text style={styles.errorText}>{fileError}</Text>
          ) : fileContent ? (
            <View style={styles.htmlWrapper}>
              <RenderHTML
                contentWidth={width - 32}
                source={{ html: fileContent }}
                ignoredDomTags={['meta', 'title']}
                baseStyle={{ color: '#334155', lineHeight: 24 }}
              />
            </View>
          ) : (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Gerando proposta...</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {canEdit && (
        <View style={styles.fixedSignButtonContainer}>
          <TouchableOpacity style={styles.signButton} onPress={handleSendPropostal}>
            <Icon name="edit" size={20} color="#fff" />
            <Text style={styles.signButtonText}>Enviar Proposta</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const ProposalDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { contractId } = route.params;

  const { showSuccess, showError } = useMessage();

  const contractStore = useStores((s) => s.contract);

  const { item: contract, isLoading } = contractStore.getters;
  const contractActions = contractStore.actions;

  const [fileContent, setFileContent] = useState('');
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const scrollRef = useRef(null);

  const canEdit = contract?.status?.realStatus === 'open';

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerBackVisible: true,
      title: global.t?.t('contract', 'title', 'proposal') || 'Proposta',
    });
  }, [navigation]);

  useEffect(() => {
    const loadData = async () => {
      let data = await contractActions.get(contractId);

      if (!data?.contractFile) {
        try {
          await contractActions.generate({ id: contractId });
          data = await contractActions.get(contractId);
        } catch (e) {
          console.log('Erro ao gerar proposta', e);
        }
      }

      if (data?.contractFile) {
        setFileLoading(true);
        try {
          const res = await contractActions.getFileContent(data.contractFile['@id']);
          setFileContent(res.content || '');
        } catch {
          setFileError('Falha ao carregar a proposta');
        } finally {
          setFileLoading(false);
        }
      }
    };

    loadData();

  }, [contractId]);

  const handleSendPropostal = async () => {
    try {
      console.log('Implementar lógica de envio');
      showSuccess('Proposta enviada com sucesso');

      const updated = await contractActions.get(contractId);
      if (updated?.contractFile) {
        const res = await contractActions.getFileContent(updated.contractFile['@id']);
        setFileContent(res.content || '');
      }
    } catch {
      showError('Erro ao enviar proposta');
    }
  };

  const handleTabPress = (index) => {
    setActiveTab(index);
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
  };

  if (isLoading || !contract) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topSkeleton} />
        <View style={styles.infoSkeleton} />
        <View style={styles.tabsSkeleton} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topHeader}>
        <View style={styles.topAvatar}>
          <Icon name="description" size={32} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.topTitle} numberOfLines={1}>
            {contract.contractModel?.model || 'Proposta sem modelo'}
          </Text>
          <Text style={styles.topSubtitle}>ID: {contract.id}</Text>
        </View>
      </View>

      <View style={styles.fixedInfo}>
        <View
          style={[
            styles.statusBox,
            {
              backgroundColor: `${contract.status?.color || '#64748b'}20`,
              borderColor: contract.status?.color || '#94a3b8',
            },
          ]}>
          <Text style={[styles.statusText, { color: contract.status?.color || '#334155' }]}>
            {contract.status?.status?.toUpperCase() || '—'}
          </Text>
        </View>

        <View style={styles.datesRow}>
          <View style={styles.dateBlock}>
            <Text style={styles.dateLabel}>Início</Text>
            <Text style={styles.dateValue}>
              {contract.startDate ? new Date(contract.startDate).toLocaleDateString('pt-BR') : '—'}
            </Text>
          </View>
          <View style={styles.dateBlock}>
            <Text style={styles.dateLabel}>Término</Text>
            <Text style={styles.dateValue}>
              {contract.endDate ? new Date(contract.endDate).toLocaleDateString('pt-BR') : '—'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 0 && styles.tabActive]}
          onPress={() => handleTabPress(0)}>
          <Text style={[styles.tabLabel, activeTab === 0 && styles.tabLabelActive]}>Proposta</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 1 && styles.tabActive]}
          onPress={() => handleTabPress(1)}>
          <Text style={[styles.tabLabel, activeTab === 1 && styles.tabLabelActive]}>Produtos</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          if (idx !== activeTab) setActiveTab(idx);
        }}>
        <View style={{ width, flex: 1 }}>
          <PropostaTab
            contract={contract}
            fileContent={fileContent}
            fileLoading={fileLoading}
            fileError={fileError}
            canEdit={canEdit}
            handleSendPropostal={handleSendPropostal}
          />
        </View>
        <View style={{ width, flex: 1 }}>
          <LinkedOrderProductsTab
            contract={contract}
            canEdit={canEdit}
            emptyTitle="Nenhum produto vinculado a esta proposta."
            emptySubtitle="Adicione os produtos negociados para poder ajustar a proposta ao longo da conversa com o cliente."
            searchPlaceholder="Buscar produto para adicionar a proposta..."
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },

  topAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },

  topTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
  },

  topSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },

  fixedInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },

  statusBox: {
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1.5,
    marginBottom: 16,
  },

  statusText: {
    fontSize: 17,
    fontWeight: '800',
    textTransform: 'uppercase',
  },

  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  dateBlock: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    marginHorizontal: 6,
  },

  dateLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  dateValue: { fontSize: 16, fontWeight: '700', color: '#0f172a' },

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },

  tabItem: { flex: 1, paddingVertical: 16, alignItems: 'center' },

  tabActive: { borderBottomWidth: 3, borderBottomColor: colors.primary },

  tabLabel: { fontSize: 15, fontWeight: '600', color: '#64748b' },

  tabLabelActive: { color: colors.primary, fontWeight: '700' },

  tabScroll: { flex: 1 },

  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
  },

  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },

  centerContainer: { alignItems: 'center', paddingVertical: 60 },

  loadingText: { marginTop: 16, color: '#64748b', fontSize: 15 },

  errorText: { color: colors.error, textAlign: 'center', padding: 24 },

  htmlWrapper: { backgroundColor: '#fff' },

  fixedSignButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },

  signButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },

  signButtonText: { color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 12 },

  topSkeleton: { height: 100, backgroundColor: '#e2e8f0', margin: 16, borderRadius: 12 },

  infoSkeleton: {
    height: 140,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },

  tabsSkeleton: {
    height: 56,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16,
    borderRadius: 12,
  },
});

export default ProposalDetails;
