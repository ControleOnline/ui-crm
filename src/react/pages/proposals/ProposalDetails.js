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
import AnimatedModal from '@controleonline/ui-crm/src/react/components/AnimatedModal';
import { colors } from '@controleonline/../../src/styles/colors';
import { useMessage } from '@controleonline/ui-common/src/react/components/MessageService';

const { width } = Dimensions.get('window');

const PropostaTab = ({ contract, fileContent, fileLoading, fileError, canEdit, handleSendPropostal }) => {
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.tabScroll}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: canEdit ? 120 : 40, // espaço para botão fixo
        }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Proposta do Proposta</Text>

          {fileLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Carregando proposta...</Text>
            </View>
          ) : fileError ? (
            <Text style={styles.errorText}>{fileError}</Text>
          ) : contract.contractFile ? (
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
              <Icon name="description" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyText}>Nenhuma proposta anexada</Text>
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



const ContractDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { contractId } = route.params;

  const { showSuccess, showError, showWarning } = useMessage();

  const contractStore = useStores((s) => s.contract);
  const contractPeopleStore = useStores((s) => s.contract_peoples);
  const peopleStore = useStores((s) => s.people);

  const { item: contract, isLoading } = contractStore.getters;
  const contractActions = contractStore.actions;
  const contractPeopleActions = contractPeopleStore.actions;
  const peopleActions = peopleStore.actions;
  const { items: people, currentCompany } = peopleStore.getters;

  const [fileContent, setFileContent] = useState('');
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [newSubscriberRole, setNewSubscriberRole] = useState('Contractor');
  const [peoplePickerVisible, setPeoplePickerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const scrollRef = useRef(null);

  const canEdit = contract?.status?.realStatus === 'open';

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    const loadData = async () => {
      const data = await contractActions.get(contractId);
      if (data?.contractFile) {
        setFileLoading(true);
        try {
          const res = await contractActions.getFileAsHtml(data.contractFile['@id']);
          setFileContent(res.content || '');
        } catch (err) {
          setFileError('Falha ao carregar a proposta');
        } finally {
          setFileLoading(false);
        }
      }

      if (data?.peoples?.length) {
        const resolved = await Promise.all(
          data.peoples.map(async (sub) => {
            if (sub.people?.name) return sub;
            const id = (typeof sub.people === 'string' ? sub.people : sub.people?.['@id'] || '').replace(/\D/g, '');
            if (!id) return sub;
            try {
              const person = await peopleActions.get(id);
              return { ...sub, people: person };
            } catch {
              return sub;
            }
          }),
        );
        setSubscribers(resolved);
      }
    };

    loadData();

    peopleActions.getItems({
      company: currentCompany ? `/people/${currentCompany.id}` : undefined,
      link_type: 'client',
    });
  }, [contractId, currentCompany?.id]);

  const handleSendPropostal = async () => {
    try {
      console.log('Implementar a lógica')
      showSuccess('Proposta Enviada com Sucesso');
      const updated = await contractActions.get(contractId);
      if (updated?.contractFile) {
        const res = await contractActions.getFileAsHtml(updated.contractFile['@id']);
        setFileContent(res.content || '');
      }
    } catch (err) {
      showError('Erro ao enviar proposta');
    }
  };

  const handleAddSubscriber = async () => {
    if (!selectedPerson) {
      showWarning('Selecione uma pessoa');
      return;
    }
    try {
      const created = await contractPeopleActions.save({
        people: selectedPerson,
        peopleType: newSubscriberRole,
        contract: contract['@id'],
      });
      const person = people.find((p) => p['@id'] === selectedPerson);
      setSubscribers([...subscribers, { ...created, people: person || { name: '—' } }]);
      setSelectedPerson(null);
      setNewSubscriberRole('Contractor');
      showSuccess('Assinante adicionado');
    } catch {
      showError('Falha ao adicionar assinante');
    }
  };

  const handleRemoveSubscriber = async (id) => {
    try {
      await contractPeopleActions.remove(id);
      setSubscribers(subscribers.filter((s) => s.id !== id));
      showSuccess('Assinante removido');
    } catch {
      showError('Erro ao remover assinante');
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
      {/* TOPO FIXO - Título do proposta restaurado */}
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

      {/* Informações gerais fixas */}
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

      {/* Abas */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 0 && styles.tabActive]}
          onPress={() => handleTabPress(0)}>
          <Text style={[styles.tabLabel, activeTab === 0 && styles.tabLabelActive]}>Proposta</Text>
        </TouchableOpacity>
      </View>

      {/* Conteúdo das abas */}
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
      </ScrollView>

      {/* Modal de seleção de pessoa */}
      <AnimatedModal visible={peoplePickerVisible} onRequestClose={() => setPeoplePickerVisible(false)}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecionar Pessoa</Text>
            <TouchableOpacity onPress={() => setPeoplePickerVisible(false)}>
              <Icon name="close" size={28} color="#64748b" />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {people?.map((p) => (
              <TouchableOpacity
                key={p['@id']}
                style={[styles.personRow, selectedPerson === p['@id'] && styles.personRowSelected]}
                onPress={() => {
                  setSelectedPerson(p['@id']);
                  setPeoplePickerVisible(false);
                }}>
                <Text style={styles.personName}>{p.name}</Text>
                {selectedPerson === p['@id'] && (
                  <Icon name="check-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </AnimatedModal>
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
    letterSpacing: 0.6,
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
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 16 },

  centerContainer: { alignItems: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 16, color: '#64748b', fontSize: 15 },
  emptyText: { marginTop: 16, color: '#94a3b8', fontSize: 15 },
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
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
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

  // Estilos da aba Assinantes (resumidos)
  subscriberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  subscriberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  subscriberName: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  subscriberRole: { fontSize: 13, color: '#64748b' },

  addForm: {
    marginTop: 24,
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  addTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  label: { fontSize: 14, color: '#64748b', marginBottom: 8, fontWeight: '500' },
  roleRow: { flexDirection: 'row', gap: 12 },
  roleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  roleBtnActive: { backgroundColor: '#e0f2fe', borderColor: colors.primary },
  roleText: { fontWeight: '600', color: '#64748b' },
  addButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonDisabled: { backgroundColor: '#cbd5e1' },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  modalContent: { padding: 20, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 19, fontWeight: '700' },
  personRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  personRowSelected: { backgroundColor: '#f0f9ff' },
  personName: { fontSize: 16, color: '#0f172a', flex: 1 },

  topSkeleton: { height: 100, backgroundColor: '#e2e8f0', margin: 16, borderRadius: 12 },
  infoSkeleton: { height: 140, backgroundColor: '#e2e8f0', marginHorizontal: 16, marginBottom: 8, borderRadius: 12 },
  tabsSkeleton: { height: 56, backgroundColor: '#e2e8f0', marginHorizontal: 16, borderRadius: 12 },
});

export default ContractDetails;