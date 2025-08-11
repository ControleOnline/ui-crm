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
import IconAdd from 'react-native-vector-icons/MaterialIcons';
import IconWhatsApp from 'react-native-vector-icons/FontAwesome';

import {getStore} from '@store';
import {useFocusEffect, useNavigation} from '@react-navigation/native';

export default function CrmIndex() {
  const [refreshing, setRefreshing] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newOpportunity, setNewOpportunity] = useState(null);
  const [statusPickerVisible, setStatusPickerVisible] = useState(false);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [criticalityPickerVisible, setCriticalityPickerVisible] =
    useState(false);
  const [beneficiaryPickerVisible, setBeneficiaryPickerVisible] =
    useState(false);
  const [reasonPickerVisible, setReasonPickerVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredOpportunities, setFilteredOpportunities] = useState([]);

  const {getters: opportunitiesGetters, actions: opportunitiesActions} =
    getStore('tasks');
  const {items: opportunities, isLoading, error} = opportunitiesGetters;
  const {getters, actions: peopleActions} = getStore('people');
  const {getters: statusGetters, actions: statusActions} = getStore('status');
  const {items: status} = statusGetters;
  const {getters: categoriesGetters, actions: categoriesActions} =
    getStore('categories');
  const {items: categories} = categoriesGetters;
  const {currentCompany, items: people} = getters;

  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      opportunitiesActions.getItems({
        type: 'relationship',
        provider_id: currentCompany.id,
      });
      statusActions.getItems({context: 'relationship'});
      categoriesActions.getItems({
        context: ['relationship-criticality', 'products'],
      });
      peopleActions.getItems({
        company: '/people/' + currentCompany.id,
        link_type: 'client',
      });
    }, [currentCompany.id]),
  );

  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredOpportunities(opportunities);
    } else {
      const filtered = opportunities.filter(opportunity => {
        const searchLower = searchText.toLowerCase();
        return (
          opportunity.id?.toString().includes(searchLower) ||
          opportunity.client?.name?.toLowerCase().includes(searchLower) ||
          opportunity.category?.name?.toLowerCase().includes(searchLower) ||
          opportunity.criticality?.name?.toLowerCase().includes(searchLower) ||
          opportunity.taskStatus?.status?.toLowerCase().includes(searchLower)
        );
      });
      setFilteredOpportunities(filtered);
    }
  }, [opportunities, searchText]);

  const productCategories = categories.filter(
    cat => cat.context === 'products',
  );
  const criticalityCategories = categories.filter(
    cat => cat.context === 'relationship-criticality',
  );
  const reasonCategories = categories.filter(cat => cat.context === 'reason');

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

  const formatDateForInput = dateString => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleOpportunityPress = opportunity => {
    navigation.navigate('CrmConversation', {opportunity});
  };

  const handleEditOpportunity = opportunity => {
    setEditingOpportunity({
      ...opportunity,
      dueDate: opportunity.dueDate
        ? formatDateForInput(opportunity.dueDate)
        : '',
      alterDate: opportunity.alterDate
        ? formatDateForInput(opportunity.alterDate)
        : '',
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    try {
      const dataToSave = {
        id: editingOpportunity.id,
        client:
          editingOpportunity.client?.['@id'] || editingOpportunity.client?.id,
        taskStatus:
          editingOpportunity.taskStatus?.['@id'] ||
          editingOpportunity.taskStatus?.id,
        category:
          editingOpportunity.category?.['@id'] ||
          editingOpportunity.category?.id,
        criticality:
          editingOpportunity.criticality?.['@id'] ||
          editingOpportunity.criticality?.id,
        reason:
          editingOpportunity.reason?.['@id'] || editingOpportunity.reason?.id,
        dueDate: editingOpportunity.dueDate,
        provider_id: currentCompany.id,
      };
      await opportunitiesActions.save(dataToSave);

      setEditModalVisible(false);
      setEditingOpportunity(null);

      Alert.alert('Sucesso', 'Oportunidade atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      Alert.alert('Erro', 'Não foi possível salvar as alterações');
    }
  };

  const handleSaveNewOpportunity = async () => {
    try {
      const dataToSave = {
        client: newOpportunity.client?.['@id'] || newOpportunity.client?.id,
        registeredBy:
          newOpportunity.client?.['@id'] || newOpportunity.client?.id,
        taskStatus:
          newOpportunity.taskStatus?.['@id'] || newOpportunity.taskStatus?.id,
        category:
          newOpportunity.category?.['@id'] || newOpportunity.category?.id,
        criticality:
          newOpportunity.criticality?.['@id'] || newOpportunity.criticality?.id,
        reason: newOpportunity.reason?.['@id'] || newOpportunity.reason?.id,
        type: 'relationship',
        dueDate: newOpportunity.dueDate,
        alterDate: newOpportunity.alterDate,
        provider: '/people/' + currentCompany.id,
      };

      await opportunitiesActions.save(dataToSave);

      setAddModalVisible(false);
      setNewOpportunity(null);

      Alert.alert('Sucesso', 'Oportunidade criada com sucesso!');

      opportunitiesActions.getItems({
        type: 'relationship',
        provider_id: currentCompany.id,
      });
    } catch (error) {
      console.error('Erro ao criar:', error);
      Alert.alert('Erro', 'Não foi possível criar a oportunidade');
    }
  };

  const toggleStatus = opportunity => {
    const newStatus =
      opportunity.taskStatus.realStatus === 'open' ? 'closed' : 'open';
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
                (opportunity.registeredBy?.id
                  ? `ID: ${opportunity.registeredBy.id}`
                  : 'N/A')}
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
              Anúncio:{' '}
              {(() => {
                try {
                  const parsed = JSON.parse(opportunity.announce);
                  return Array.isArray(parsed) ? parsed[0] || 'N/A' : 'N/A';
                } catch {
                  return 'N/A';
                }
              })()}
            </Text>
          </View>
        )}

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.chatButton]}
            onPress={() => handleOpportunityPress(opportunity)}>
            <IconWhatsApp name="whatsapp" size={16} color="#25D366" />
            <Text style={[styles.actionButtonText, {color: '#25D366'}]}>
              Conversar
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

  const renderSelectModal = (
    title,
    items,
    selectedItem,
    onSelect,
    visible,
    setVisible,
    renderKey = 'name',
  ) => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => setVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.selectModalContent}>
          <View style={styles.selectModalHeader}>
            <Text style={styles.selectModalTitle}>{title}</Text>
            <TouchableOpacity
              onPress={() => setVisible(false)}
              style={styles.closeButton}>
              <Icon name="times" size={20} color="#7f8c8d" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.selectModalBody}>
            {items.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.selectOption,
                  selectedItem?.id === item.id && styles.selectOptionActive,
                ]}
                onPress={() => {
                  onSelect(item);
                  setVisible(false);
                }}>
                {item.color && (
                  <View
                    style={[
                      styles.selectOptionDot,
                      {backgroundColor: item.color},
                    ]}
                  />
                )}
                {item.icon && (
                  <Icon
                    name={item.icon}
                    size={16}
                    color={selectedItem?.id === item.id ? '#fff' : '#3498db'}
                    style={styles.selectOptionIcon}
                  />
                )}
                <Text
                  style={[
                    styles.selectOptionText,
                    selectedItem?.id === item.id &&
                      styles.selectOptionTextActive,
                  ]}>
                  {item[renderKey]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderBeneficiarySelectModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={beneficiaryPickerVisible}
      onRequestClose={() => setBeneficiaryPickerVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.selectModalContent}>
          <View style={styles.selectModalHeader}>
            <Text style={styles.selectModalTitle}>Selecionar Beneficiário</Text>
            <TouchableOpacity
              onPress={() => setBeneficiaryPickerVisible(false)}
              style={styles.closeButton}>
              <Icon name="times" size={20} color="#7f8c8d" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.selectModalBody}>
            {people && people.length > 0 ? (
              people.map(person => (
                <TouchableOpacity
                  key={person.name}
                  style={[
                    styles.selectOption,
                    (editModalVisible
                      ? editingOpportunity?.client?.id
                      : newOpportunity?.client?.id) === person['@id'] &&
                      styles.selectOptionActive,
                  ]}
                  onPress={() => {
                    const clientData = {
                      '@id': person['@id'] || person.id,
                      id: person['@id'] || person.id,
                      name: person.name,
                      document: person.document,
                    };

                    if (editModalVisible) {
                      setEditingOpportunity(prev => ({
                        ...prev,
                        client: clientData,
                      }));
                    } else {
                      setNewOpportunity(prev => ({
                        ...prev,
                        client: clientData,
                      }));
                    }
                    setBeneficiaryPickerVisible(false);
                  }}>
                  <View style={styles.personInfo}>
                    <View style={styles.avatarContainer}>
                      <Icon name="user" size={20} color="#3498db" />
                    </View>
                    <View style={styles.personDetails}>
                      <Text
                        style={[
                          styles.personName,
                          (editModalVisible
                            ? editingOpportunity?.client?.id
                            : newOpportunity?.client?.id) === person['@id'] &&
                            styles.selectOptionTextActive,
                        ]}>
                        {person.name}
                      </Text>
                      {person.document && (
                        <Text style={styles.personDocument}>
                          {typeof person.document === 'string'
                            ? person.document
                            : 'Documento disponível'}
                        </Text>
                      )}
                    </View>
                  </View>
                  {(editModalVisible
                    ? editingOpportunity?.client?.id
                    : newOpportunity?.client?.id) === person.id && (
                    <Icon name="check-circle" size={20} color="#27ae60" />
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Icon name="user" size={48} color="#bdc3c7" />
                <Text style={styles.emptyText}>
                  Nenhum beneficiário encontrado
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
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
              <Text style={styles.editLabel}>Beneficiário</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setBeneficiaryPickerVisible(true)}>
                <View style={styles.selectButtonContent}>
                  <Icon
                    name="user"
                    size={16}
                    color="#3498db"
                    style={styles.selectButtonIcon}
                  />
                  <Text style={styles.selectButtonText}>
                    {editingOpportunity?.client?.name ||
                      'Selecione um beneficiário'}
                  </Text>
                </View>
                <Icon name="chevron-down" size={16} color="#7f8c8d" />
              </TouchableOpacity>
            </View>

            <View style={styles.editSection}>
              <Text style={styles.editLabel}>Status</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setStatusPickerVisible(true)}>
                <View style={styles.selectButtonContent}>
                  {editingOpportunity?.taskStatus?.color && (
                    <View
                      style={[
                        styles.selectButtonDot,
                        {backgroundColor: editingOpportunity.taskStatus.color},
                      ]}
                    />
                  )}
                  <Text style={styles.selectButtonText}>
                    {editingOpportunity?.taskStatus?.status ||
                      'Selecione um status'}
                  </Text>
                </View>
                <Icon name="chevron-down" size={16} color="#7f8c8d" />
              </TouchableOpacity>
            </View>

            <View style={styles.editSection}>
              <Text style={styles.editLabel}>Categoria</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setCategoryPickerVisible(true)}>
                <View style={styles.selectButtonContent}>
                  {editingOpportunity?.category?.icon && (
                    <Icon
                      name={editingOpportunity.category.icon}
                      size={16}
                      color="#3498db"
                      style={styles.selectButtonIcon}
                    />
                  )}
                  <Text style={styles.selectButtonText}>
                    {editingOpportunity?.category?.name ||
                      'Selecione uma categoria'}
                  </Text>
                </View>
                <Icon name="chevron-down" size={16} color="#7f8c8d" />
              </TouchableOpacity>
            </View>

            <View style={styles.editSection}>
              <Text style={styles.editLabel}>Criticidade</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setCriticalityPickerVisible(true)}>
                <View style={styles.selectButtonContent}>
                  {editingOpportunity?.criticality?.icon && (
                    <Icon
                      name={editingOpportunity.criticality.icon}
                      size={16}
                      color="#e67e22"
                      style={styles.selectButtonIcon}
                    />
                  )}
                  <Text style={styles.selectButtonText}>
                    {editingOpportunity?.criticality?.name ||
                      'Selecione uma criticidade'}
                  </Text>
                </View>
                <Icon name="chevron-down" size={16} color="#7f8c8d" />
              </TouchableOpacity>
            </View>

            <View style={styles.editSection}>
              <Text style={styles.editLabel}>Motivo</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setReasonPickerVisible(true)}>
                <View style={styles.selectButtonContent}>
                  {editingOpportunity?.reason?.icon && (
                    <Icon
                      name={editingOpportunity.reason.icon}
                      size={16}
                      color="#9b59b6"
                      style={styles.selectButtonIcon}
                    />
                  )}
                  <Text style={styles.selectButtonText}>
                    {editingOpportunity?.reason?.name || 'Selecione um motivo'}
                  </Text>
                </View>
                <Icon name="chevron-down" size={16} color="#7f8c8d" />
              </TouchableOpacity>
            </View>

            <View style={styles.editSection}>
              <Text style={styles.editLabel}>Data de Vencimento</Text>
              <TextInput
                style={styles.editInput}
                value={editingOpportunity?.dueDate || ''}
                onChangeText={text => {
                  setEditingOpportunity(prev => ({
                    ...prev,
                    dueDate: text,
                  }));
                }}
                placeholder="2025-10-10"
                placeholderTextColor="#6c757d"
              />
            </View>

            <View style={styles.editSection}>
              <Text style={styles.editLabel}>Data de Alteração</Text>
              <TextInput
                style={styles.editInput}
                value={editingOpportunity?.alterDate || ''}
                onChangeText={text => {
                  setEditingOpportunity(prev => ({
                    ...prev,
                    alterDate: text,
                  }));
                }}
                placeholder="2025-10-10"
                placeholderTextColor="#6c757d"
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

  const renderAddModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={addModalVisible}
      onRequestClose={() => setAddModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nova Oportunidade</Text>
            <TouchableOpacity
              onPress={() => setAddModalVisible(false)}
              style={styles.closeButton}>
              <Icon name="times" size={20} color="#7f8c8d" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.editSection}>
              <Text style={styles.editLabel}>Beneficiário</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setBeneficiaryPickerVisible(true)}>
                <View style={styles.selectButtonContent}>
                  <Icon
                    name="user"
                    size={16}
                    color="#3498db"
                    style={styles.selectButtonIcon}
                  />
                  <Text style={styles.selectButtonText}>
                    {newOpportunity?.client?.name ||
                      'Selecione um beneficiário'}
                  </Text>
                </View>
                <Icon name="chevron-down" size={16} color="#7f8c8d" />
              </TouchableOpacity>
            </View>

            <View style={styles.editSection}>
              <Text style={styles.editLabel}>Status</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setStatusPickerVisible(true)}>
                <View style={styles.selectButtonContent}>
                  {newOpportunity?.taskStatus?.color && (
                    <View
                      style={[
                        styles.selectButtonDot,
                        {backgroundColor: newOpportunity.taskStatus.color},
                      ]}
                    />
                  )}
                  <Text style={styles.selectButtonText}>
                    {newOpportunity?.taskStatus?.status ||
                      'Selecione um status'}
                  </Text>
                </View>
                <Icon name="chevron-down" size={16} color="#7f8c8d" />
              </TouchableOpacity>
            </View>

            <View style={styles.editSection}>
              <Text style={styles.editLabel}>Categoria</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setCategoryPickerVisible(true)}>
                <View style={styles.selectButtonContent}>
                  {newOpportunity?.category?.icon && (
                    <Icon
                      name={newOpportunity.category.icon}
                      size={16}
                      color="#3498db"
                      style={styles.selectButtonIcon}
                    />
                  )}
                  <Text style={styles.selectButtonText}>
                    {newOpportunity?.category?.name ||
                      'Selecione uma categoria'}
                  </Text>
                </View>
                <Icon name="chevron-down" size={16} color="#7f8c8d" />
              </TouchableOpacity>
            </View>

            <View style={styles.editSection}>
              <Text style={styles.editLabel}>Criticidade</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setCriticalityPickerVisible(true)}>
                <View style={styles.selectButtonContent}>
                  {newOpportunity?.criticality?.icon && (
                    <Icon
                      name={newOpportunity.criticality.icon}
                      size={16}
                      color="#e67e22"
                      style={styles.selectButtonIcon}
                    />
                  )}
                  <Text style={styles.selectButtonText}>
                    {newOpportunity?.criticality?.name ||
                      'Selecione uma criticidade'}
                  </Text>
                </View>
                <Icon name="chevron-down" size={16} color="#7f8c8d" />
              </TouchableOpacity>
            </View>

            <View style={styles.editSection}>
              <Text style={styles.editLabel}>Motivo</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setReasonPickerVisible(true)}>
                <View style={styles.selectButtonContent}>
                  {newOpportunity?.reason?.icon && (
                    <Icon
                      name={newOpportunity.reason.icon}
                      size={16}
                      color="#9b59b6"
                      style={styles.selectButtonIcon}
                    />
                  )}
                  <Text style={styles.selectButtonText}>
                    {newOpportunity?.reason?.name || 'Selecione um motivo'}
                  </Text>
                </View>
                <Icon name="chevron-down" size={16} color="#7f8c8d" />
              </TouchableOpacity>
            </View>

            <View style={styles.editSection}>
              <Text style={styles.editLabel}>Data de Vencimento</Text>
              <TextInput
                style={styles.editInput}
                value={newOpportunity?.dueDate || ''}
                onChangeText={text => {
                  setNewOpportunity(prev => ({
                    ...prev,
                    dueDate: text,
                  }));
                }}
                placeholder="2025-10-10"
                placeholderTextColor="#6c757d"
              />
            </View>

            <View style={styles.editSection}>
              <Text style={styles.editLabel}>Data de Alteração</Text>
              <TextInput
                style={styles.editInput}
                value={newOpportunity?.alterDate || ''}
                onChangeText={text => {
                  setNewOpportunity(prev => ({
                    ...prev,
                    alterDate: text,
                  }));
                }}
                placeholder="2025-10-10"
                placeholderTextColor="#6c757d"
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setAddModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleSaveNewOpportunity}>
              <Text style={styles.saveButtonText}>Criar</Text>
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
      <View
        style={{
          backgroundColor: '#fff',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#e9ecef',
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 2,
          margin: 20,
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#f8f9fa',
              borderRadius: 12,
              paddingHorizontal: 16,
              borderWidth: 1,
              borderColor: '#e9ecef',
            }}>
            <Icon name="search" size={20} color="#6c757d" />
            <TextInput
              placeholder="Buscar cliente..."
              value={searchText}
              onChangeText={setSearchText}
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 12,
                color: '#212529',
                fontSize: 16,
                width: '100%',
              }}
              placeholderTextColor="#6c757d"
            />
          </View>
          <TouchableOpacity
            style={{
              backgroundColor: '#2529a1',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              elevation: 2,
              shadowColor: '#2529a1',
              shadowOffset: {width: 0, height: 2},
              shadowOpacity: 0.3,
              shadowRadius: 4,
            }}
            onPress={() => setAddModalVisible(true)}>
            <IconAdd
              name="add"
              size={20}
              color="#FFFFFF"
              style={{marginRight: 4}}
            />
            <Text style={{color: '#FFFFFF', fontWeight: '600', fontSize: 14}}>
              Criar
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}>
        {filteredOpportunities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="line-chart" size={64} color="#bdc3c7" />
            <Text style={styles.emptyTitle}>
              {searchText
                ? 'Nenhuma oportunidade encontrada'
                : 'Nenhuma oportunidade'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchText
                ? 'Tente buscar com outros termos'
                : 'Adicione sua primeira oportunidade'}
            </Text>
          </View>
        ) : (
          <View style={styles.opportunitiesContainer}>
            {filteredOpportunities.map((opportunity, index) =>
              renderOpportunityCard(opportunity, index),
            )}
          </View>
        )}
      </ScrollView>

      {renderEditModal()}
      {renderAddModal()}

      {renderSelectModal(
        'Selecionar Status',
        status,
        editModalVisible
          ? editingOpportunity?.taskStatus
          : newOpportunity?.taskStatus,
        item => {
          if (editModalVisible) {
            setEditingOpportunity(prev => ({...prev, taskStatus: item}));
          } else {
            setNewOpportunity(prev => ({...prev, taskStatus: item}));
          }
        },
        statusPickerVisible,
        setStatusPickerVisible,
        'status',
      )}

      {renderSelectModal(
        'Selecionar Categoria',
        productCategories,
        editModalVisible
          ? editingOpportunity?.category
          : newOpportunity?.category,
        item => {
          if (editModalVisible) {
            setEditingOpportunity(prev => ({...prev, category: item}));
          } else {
            setNewOpportunity(prev => ({...prev, category: item}));
          }
        },
        categoryPickerVisible,
        setCategoryPickerVisible,
        'name',
      )}

      {renderSelectModal(
        'Selecionar Criticidade',
        criticalityCategories,
        editModalVisible
          ? editingOpportunity?.criticality
          : newOpportunity?.criticality,
        item => {
          if (editModalVisible) {
            setEditingOpportunity(prev => ({...prev, criticality: item}));
          } else {
            setNewOpportunity(prev => ({...prev, criticality: item}));
          }
        },
        criticalityPickerVisible,
        setCriticalityPickerVisible,
        'name',
      )}

      {renderSelectModal(
        'Selecionar Motivo',
        reasonCategories,
        editModalVisible ? editingOpportunity?.reason : newOpportunity?.reason,
        item => {
          if (editModalVisible) {
            setEditingOpportunity(prev => ({...prev, reason: item}));
          } else {
            setNewOpportunity(prev => ({...prev, reason: item}));
          }
        },
        reasonPickerVisible,
        setReasonPickerVisible,
        'name',
      )}

      {renderBeneficiarySelectModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchContainer: {
    marginTop: 4,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    color: '#212529',
    fontSize: 16,
    width: '100%',
  },
  clearSearchButton: {
    padding: 4,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  addButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
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
  chatButton: {
    borderColor: '#25D366',
    backgroundColor: '#25D36610',
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
  // Select Styles
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  selectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectButtonDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  selectButtonIcon: {
    marginRight: 8,
  },
  selectButtonText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  // Date Picker Styles
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 8,
  },
  // Select Modal Styles
  selectModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '60%',
  },
  selectModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  selectModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  selectModalBody: {
    maxHeight: 300,
  },
  selectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  selectOptionActive: {
    backgroundColor: '#3498db10',
  },
  selectOptionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  selectOptionIcon: {
    marginRight: 12,
  },
  selectOptionText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  selectOptionTextActive: {
    color: '#3498db',
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
  // Beneficiary Modal Styles
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3498db20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  personDetails: {
    flex: 1,
  },
  personName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  personDocument: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#7f8c8d',
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
});
