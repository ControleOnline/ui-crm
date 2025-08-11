import React, {useState, useEffect, useCallback} from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import {Text} from 'react-native-animatable';
import Icon from 'react-native-vector-icons/FontAwesome';
import {getStore} from '@store';
import {useFocusEffect, useNavigation} from '@react-navigation/native';

export default function CrmIndex() {
  const [refreshing, setRefreshing] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const {getters: opportunitiesGetters, actions: opportunitiesActions} =
    getStore('tasks');
  const {items: opportunities, isLoading, error} = opportunitiesGetters;
  const {getters} = getStore('people');

  const {currentCompany} = getters;
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      opportunitiesActions.getItems({
        type: 'relationship',
        provider_id: currentCompany.id,
      });
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    opportunitiesActions.getItems({
      type: 'relationship',
      provider_id: currentCompany.id,
    });
    setRefreshing(false);
  };

  const getStageColor = status => {
    const colors = {
      open: '#f39c12',
      closed: '#27ae60',
      pending: '#3498db',
      cancelled: '#e74c3c',
    };
    return colors[status] || '#95a5a6';
  };

  const getStageLabel = status => {
    const labels = {
      open: 'Em Aberto',
      closed: 'Fechado',
      pending: 'Pendente',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  };

  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleOpportunityPress = opportunity => {
    navigation.navigate('CrmDetail', {opportunity});
  };

  const handleEditOpportunity = opportunity => {
    setEditingOpportunity({...opportunity});
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    // Aqui você implementaria a lógica para salvar as alterações
    console.log('Salvando alterações:', editingOpportunity);
    // opportunitiesActions.updateItem(editingOpportunity);
    setEditModalVisible(false);
    setEditingOpportunity(null);
  };

  const handleAddOpportunity = () => {
    navigation.navigate('CrmForm');
  };

  const toggleStatus = opportunity => {
    const newStatus =
      opportunity.taskStatus.realStatus === 'open' ? 'closed' : 'open';
    // Aqui você implementaria a lógica para atualizar o status
    console.log(
      `Alterando status da oportunidade ${opportunity.id} para: ${newStatus}`,
    );
    // opportunitiesActions.updateStatus(opportunity.id, newStatus);
  };

  const renderOpportunityCard = (opportunity, index) => (
    <View key={opportunity.id} style={styles.cardWrapper}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.opportunityTitle}>
              Oportunidade #{opportunity.id}
            </Text>
            <Text style={styles.clientName}>
              {opportunity.client?.name || 'Cliente não informado'}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.stageTag,
              {
                backgroundColor:
                  getStageColor(opportunity.taskStatus?.realStatus) + '20',
              },
            ]}
            onPress={() => toggleStatus(opportunity)}>
            <Text
              style={[
                styles.stageText,
                {color: getStageColor(opportunity.taskStatus?.realStatus)},
              ]}>
              {getStageLabel(opportunity.taskStatus?.realStatus)}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <View style={styles.infoContainer}>
              <Icon name="tag" size={14} color="#9b59b6" />
              <Text style={styles.infoText}>
                {opportunity.category?.name || 'Sem categoria'}
              </Text>
            </View>
            <View style={styles.infoContainer}>
              <Icon name="exclamation-circle" size={14} color="#e67e22" />
              <Text style={styles.infoText}>
                {opportunity.criticality?.name || 'Normal'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoContainer}>
              <Icon name="calendar" size={14} color="#3498db" />
              <Text style={styles.infoText}>
                {formatDate(opportunity.createdAt)}
              </Text>
            </View>
            <View style={styles.infoContainer}>
              <Icon name="clock-o" size={14} color="#95a5a6" />
              <Text style={styles.infoText}>
                {formatDate(opportunity.alterDate)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.responsibleContainer}>
            <Icon name="user" size={14} color="#7f8c8d" />
            <Text style={styles.responsibleText}>
              Por:{' '}
              {opportunity.registeredBy?.name ||
                `ID: ${opportunity.registeredBy?.id}`}
            </Text>
          </View>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusDot,
                {backgroundColor: opportunity.taskStatus?.color || '#95a5a6'},
              ]}
            />
          </View>
        </View>

        {opportunity.announce && (
          <View style={styles.announceContainer}>
            <Icon name="bullhorn" size={12} color="#9b59b6" />
            <Text style={styles.announceText}>
              Anúncio: {JSON.parse(opportunity.announce)[0] || 'N/A'}
            </Text>
          </View>
        )}

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.viewButton]}
            onPress={() => handleOpportunityPress(opportunity)}>
            <Icon name="eye" size={16} color="#3498db" />
            <Text style={[styles.actionButtonText, {color: '#3498db'}]}>
              Ver Detalhes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditOpportunity(opportunity)}>
            <Icon name="edit" size={16} color="#f39c12" />
            <Text style={[styles.actionButtonText, {color: '#f39c12'}]}>
              Editar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEditModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={editModalVisible}
      onRequestClose={() => setEditModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Editar Oportunidade #{editingOpportunity?.id}
            </Text>
            <TouchableOpacity
              onPress={() => setEditModalVisible(false)}
              style={styles.closeButton}>
              <Icon name="times" size={20} color="#7f8c8d" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.editSection}>
              <Text style={styles.editLabel}>Cliente</Text>
              <TextInput
                style={styles.editInput}
                value={editingOpportunity?.client?.name || ''}
                onChangeText={text =>
                  setEditingOpportunity(prev => ({
                    ...prev,
                    client: {...prev.client, name: text},
                  }))
                }
                placeholder="Nome do cliente"
              />
            </View>

            <View style={styles.editSection}>
              <Text style={styles.editLabel}>Status</Text>
              <View style={styles.statusOptions}>
                {['open', 'closed', 'pending', 'cancelled'].map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      editingOpportunity?.taskStatus?.realStatus === status &&
                        styles.statusOptionActive,
                    ]}
                    onPress={() =>
                      setEditingOpportunity(prev => ({
                        ...prev,
                        taskStatus: {
                          ...prev.taskStatus,
                          realStatus: status,
                          status: status,
                        },
                      }))
                    }>
                    <Text
                      style={[
                        styles.statusOptionText,
                        editingOpportunity?.taskStatus?.realStatus === status &&
                          styles.statusOptionTextActive,
                      ]}>
                      {getStageLabel(status)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.editSection}>
              <Text style={styles.editLabel}>Categoria</Text>
              <TextInput
                style={styles.editInput}
                value={editingOpportunity?.category?.name || ''}
                onChangeText={text =>
                  setEditingOpportunity(prev => ({
                    ...prev,
                    category: {...prev.category, name: text},
                  }))
                }
                placeholder="Categoria"
              />
            </View>

            <View style={styles.editSection}>
              <Text style={styles.editLabel}>Criticidade</Text>
              <TextInput
                style={styles.editInput}
                value={editingOpportunity?.criticality?.name || ''}
                onChangeText={text =>
                  setEditingOpportunity(prev => ({
                    ...prev,
                    criticality: {...prev.criticality, name: text},
                  }))
                }
                placeholder="Criticidade"
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setEditModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleSaveEdit}>
              <Text style={styles.saveButtonText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando oportunidades...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Icon name="exclamation-triangle" size={48} color="#e74c3c" />
        <Text style={styles.loadingText}>Erro ao carregar dados</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Oportunidades</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddOpportunity}>
          <Icon name="plus" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}>
        {opportunities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="line-chart" size={64} color="#bdc3c7" />
            <Text style={styles.emptyTitle}>Nenhuma oportunidade</Text>
            <Text style={styles.emptySubtitle}>
              Adicione sua primeira oportunidade
            </Text>
          </View>
        ) : (
          <View style={styles.opportunitiesContainer}>
            {opportunities.map((opportunity, index) =>
              renderOpportunityCard(opportunity, index),
            )}
          </View>
        )}
      </ScrollView>

      {renderEditModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
  },
  addButton: {
    backgroundColor: '#3498db',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  opportunitiesContainer: {
    gap: 16,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  opportunityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  clientName: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '400',
  },
  stageTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  stageText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 4,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    marginBottom: 12,
  },
  responsibleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  responsibleText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 6,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  announceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f8f9fa',
  },
  announceText: {
    fontSize: 12,
    color: '#9b59b6',
    marginLeft: 4,
    fontStyle: 'italic',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  viewButton: {
    borderColor: '#3498db',
    backgroundColor: '#3498db10',
  },
  editButton: {
    borderColor: '#f39c12',
    backgroundColor: '#f39c1210',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  editSection: {
    marginBottom: 20,
  },
  editLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#2c3e50',
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statusOptionActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  statusOptionText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  statusOptionTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
  },
  saveButton: {
    backgroundColor: '#27ae60',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
