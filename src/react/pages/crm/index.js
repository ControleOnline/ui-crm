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
  TouchableWithoutFeedback,
} from 'react-native';
import {Text} from 'react-native-animatable';
import Icon from 'react-native-vector-icons/FontAwesome';
import IconAdd from 'react-native-vector-icons/MaterialIcons';
import IconWhatsApp from 'react-native-vector-icons/FontAwesome';

import {useStores} from '@store';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showItemsPerPageDropdown, setShowItemsPerPageDropdown] =
    useState(false);
  const [dueDateDayPickerVisible, setDueDateDayPickerVisible] = useState(false);
  const [dueDateMonthPickerVisible, setDueDateMonthPickerVisible] =
    useState(false);
  const tasksStore = useStores(state => state.tasks);
  const opportunitiesGetters = tasksStore.getters;
  const opportunitiesActions = tasksStore.actions;
  const {
    items: opportunities,
    totalItems,
    isLoading,
    error,
  } = opportunitiesGetters;
  const peopleStore = useStores(state => state.people);
  const getters = peopleStore.getters;
  const peopleActions = peopleStore.actions;
  const statusStore = useStores(state => state.status);
  const statusGetters = statusStore.getters;
  const statusActions = statusStore.actions;
  const {items: status} = statusGetters;
  const categoriesStore = useStores(state => state.categories);
  const categoriesGetters = categoriesStore.getters;
  const categoriesActions = categoriesStore.actions;
  const {items: categories} = categoriesGetters;
  const {currentCompany, items: people} = getters;

  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      const params = {
        type: 'relationship',
        provider_id: currentCompany.id,
        provider: currentCompany.id,
        page: currentPage,
        itemsPerPage: itemsPerPage,
      };

      // Adiciona o parâmetro de busca se houver
      if (searchText.trim()) {
        params['client.name'] = searchText.trim();
      }

      opportunitiesActions.getItems(params);
      statusActions.getItems({context: 'relationship'});
      categoriesActions.getItems({
        context: ['relationship-criticality', 'products'],
      });
      peopleActions.getItems({
        company: '/people/' + currentCompany.id,
        link_type: 'client',
      });
    }, [currentCompany.id, currentPage, itemsPerPage, searchText]),
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, itemsPerPage]);

  const getCurrentDateComponents = () => {
    const today = new Date();
    return {
      day: String(today.getDate()).padStart(2, '0'),
      month: String(today.getMonth() + 1).padStart(2, '0'),
      year: String(today.getFullYear()),
    };
  };

  const productCategories = categories.filter(
    cat => cat.context === 'relationship',
  );

  const criticalityCategories = categories.filter(
    cat => cat.context === 'relationship-criticality',
  );
  const reasonCategories = categories.filter(
    cat => cat.context === 'relationship-reason',
  );

  const onRefresh = async () => {
    setRefreshing(true);
    const params = {
      type: 'relationship',
      provider_id: currentCompany.id,
      provider: currentCompany.id,
      page: currentPage,
      itemsPerPage: itemsPerPage,
    };

    // Adiciona o parâmetro de busca se houver
    if (searchText.trim()) {
      params['client.name'] = searchText.trim();
    }

    opportunitiesActions.getItems(params);
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
    });
  };

  const formatDateForInput = dateString => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDateComponents = dateString => {
    if (!dateString) {
      return {day: '', month: '', year: ''};
    }
    const date = new Date(dateString);
    return {
      day: String(date.getDate()).padStart(2, '0'),
      month: String(date.getMonth() + 1).padStart(2, '0'),
      year: String(date.getFullYear()),
    };
  };

  const formatDateFromComponents = (day, month, year) => {
    if (!day || !month || !year) {
      return '';
    }
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const getDaysArray = () => {
    return Array.from({length: 31}, (_, i) => ({
      id: String(i + 1).padStart(2, '0'),
      name: String(i + 1).padStart(2, '0'),
    }));
  };

  const getMonthsArray = () => {
    const months = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];
    return months.map((month, index) => ({
      id: String(index + 1).padStart(2, '0'),
      name: month,
    }));
  };

  const handleOpportunityPress = opportunity => {
    navigation.navigate('CrmConversation', {opportunity});
  };

  const parsePhoneNumbers = announce => {
    if (!announce) {
      return [];
    }
    try {
      const parsed = JSON.parse(announce);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // If it's not JSON, treat as single phone number
      return announce.trim() ? [announce.trim()] : [];
    }
  };

  const handleEditOpportunity = opportunity => {
    const dueDateComponents = parseDateComponents(opportunity.dueDate);
    const alterDateComponents = parseDateComponents(opportunity.alterDate);
    const phones = parsePhoneNumbers(opportunity.announce);
    const todayComponents = getCurrentDateComponents();
    setEditingOpportunity({
      ...opportunity,
      dueDate: opportunity.dueDate
        ? formatDateForInput(opportunity.dueDate)
        : '',
      alterDate: opportunity.alterDate
        ? formatDateForInput(opportunity.alterDate)
        : '',
      dueDateDay: dueDateComponents.day || todayComponents.day,
      dueDateMonth: dueDateComponents.month || todayComponents.month,
      dueDateYear: dueDateComponents.year || todayComponents.year,
      alterDateDay: alterDateComponents.day,
      alterDateMonth: alterDateComponents.month,
      alterDateYear: alterDateComponents.year,
      announce: opportunity.announce || '',
      phones: phones,
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    try {
      const dueDate = formatDateFromComponents(
        editingOpportunity.dueDateDay,
        editingOpportunity.dueDateMonth,
        editingOpportunity.dueDateYear,
      );
      const alterDate = formatDateFromComponents(
        editingOpportunity.alterDateDay,
        editingOpportunity.alterDateMonth,
        editingOpportunity.alterDateYear,
      );

      // Format phones as JSON array for API
      const validPhones = (editingOpportunity.phones || []).filter(phone =>
        phone.trim(),
      );
      const phoneData =
        validPhones.length > 0 ? JSON.stringify(validPhones) : '';

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
        dueDate: dueDate,
        alterDate: alterDate,
        announce: phoneData,
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
      const dueDate = formatDateFromComponents(
        newOpportunity?.dueDateDay,
        newOpportunity?.dueDateMonth,
        newOpportunity?.dueDateYear,
      );

      // Format phones as JSON array for API
      const validPhones = (newOpportunity?.phones || []).filter(phone =>
        phone.trim(),
      );
      const phoneData =
        validPhones.length > 0 ? JSON.stringify(validPhones) : '';

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
        dueDate: dueDate,
        announce: phoneData,
        provider: '/people/' + currentCompany.id,
      };

      await opportunitiesActions.save(dataToSave);

      setAddModalVisible(false);
      setNewOpportunity(null);

      Alert.alert('Sucesso', 'Oportunidade criada com sucesso!');

      const params = {
        type: 'relationship',
        provider_id: currentCompany.id,
        provider: currentCompany.id,
        page: currentPage,
        itemsPerPage: itemsPerPage,
      };

      // Adiciona o parâmetro de busca se houver
      if (searchText.trim()) {
        params['client.name'] = searchText.trim();
      }

      opportunitiesActions.getItems(params);
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

  const addPhoneInput = (isEdit = true) => {
    if (isEdit) {
      setEditingOpportunity(prev => ({
        ...prev,
        phones: [...(prev.phones || []), ''],
      }));
    } else {
      setNewOpportunity(prev => ({
        ...prev,
        phones: [...(prev.phones || []), ''],
      }));
    }
  };

  const removePhoneInput = (index, isEdit = true) => {
    if (isEdit) {
      setEditingOpportunity(prev => ({
        ...prev,
        phones: prev.phones.filter((_, i) => i !== index),
      }));
    } else {
      setNewOpportunity(prev => ({
        ...prev,
        phones: prev.phones.filter((_, i) => i !== index),
      }));
    }
  };

  const updatePhoneInput = (index, value, isEdit = true) => {
    if (isEdit) {
      setEditingOpportunity(prev => ({
        ...prev,
        phones: prev.phones.map((phone, i) => (i === index ? value : phone)),
      }));
    } else {
      setNewOpportunity(prev => ({
        ...prev,
        phones: prev.phones.map((phone, i) => (i === index ? value : phone)),
      }));
    }
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
                {formatDate(opportunity.dueDate)}
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

        {opportunity.announce && (
          <View style={styles.announceContainer}>
            <Icon name="bullhorn" size={12} color="#9b59b6" />
            <Text style={styles.announceText}>
              Telefones:{' '}
              {(() => {
                try {
                  const parsed = JSON.parse(opportunity.announce);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed.join(', ');
                  }
                  return 'N/A';
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

  const renderPhoneInputs = (phones = [], isEdit = true) => (
    <View style={styles.phoneInputsContainer}>
      {phones.length === 0 && (
        <TouchableOpacity
          style={styles.addPhoneButton}
          onPress={() => addPhoneInput(isEdit)}>
          <Icon name="plus" size={16} color="#27ae60" />
          <Text style={styles.addPhoneText}>Adicionar telefone</Text>
        </TouchableOpacity>
      )}

      {phones.map((phone, index) => (
        <View key={index} style={styles.phoneInputRow}>
          <TextInput
            style={[styles.textInput, styles.phoneInput]}
            value={phone}
            onChangeText={text => {
              // Remove formatting for storage but allow user to see formatted version
              const cleaned = text.replace(/\D/g, '');
              updatePhoneInput(index, cleaned, isEdit);
            }}
            placeholder="(11) 99999-9999"
            placeholderTextColor="#6c757d"
            keyboardType="phone-pad"
            maxLength={15}
          />
          <TouchableOpacity
            style={styles.removePhoneButton}
            onPress={() => removePhoneInput(index, isEdit)}>
            <Icon name="trash" size={16} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      ))}

      {phones.length > 0 && (
        <TouchableOpacity
          style={styles.addPhoneButton}
          onPress={() => addPhoneInput(isEdit)}>
          <Icon name="plus" size={16} color="#27ae60" />
          <Text style={styles.addPhoneText}>Adicionar outro telefone</Text>
        </TouchableOpacity>
      )}
    </View>
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
              <Text style={styles.editLabel}>Telefones</Text>
              {renderPhoneInputs(editingOpportunity?.phones || [], true)}
            </View>

            <View style={styles.editSection}>
              <Text style={styles.editLabel}>Data de Vencimento</Text>
              <View style={styles.datePickerContainer}>
                <TouchableOpacity
                  style={[styles.dateSelectButton, {flex: 1}]}
                  onPress={() => setDueDateDayPickerVisible(true)}>
                  <Text style={styles.dateSelectText}>
                    {editingOpportunity?.dueDateDay || 'Dia'}
                  </Text>
                  <Icon name="chevron-down" size={16} color="#7f8c8d" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.dateSelectButton, {flex: 2}]}
                  onPress={() => setDueDateMonthPickerVisible(true)}>
                  <Text style={styles.dateSelectText}>
                    {editingOpportunity?.dueDateMonth
                      ? getMonthsArray().find(
                          m => m.id === editingOpportunity.dueDateMonth,
                        )?.name
                      : 'Mês'}
                  </Text>
                  <Icon name="chevron-down" size={16} color="#7f8c8d" />
                </TouchableOpacity>

                <TextInput
                  style={[styles.dateSelectButton, styles.yearInput, {flex: 1}]}
                  value={editingOpportunity?.dueDateYear || ''}
                  onChangeText={text => {
                    setEditingOpportunity(prev => ({
                      ...prev,
                      dueDateYear: text,
                    }));
                  }}
                  placeholder="Ano"
                  placeholderTextColor="#6c757d"
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
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
              <Text style={styles.editLabel}>Telefones</Text>
              {renderPhoneInputs(newOpportunity?.phones || [], false)}
            </View>

            <View style={styles.editSection}>
              <Text style={styles.editLabel}>Data de Vencimento</Text>
              <View style={styles.datePickerContainer}>
                <TouchableOpacity
                  style={[styles.dateSelectButton, {flex: 1}]}
                  onPress={() => setDueDateDayPickerVisible(true)}>
                  <Text style={styles.dateSelectText}>
                    {newOpportunity?.dueDateDay || 'Dia'}
                  </Text>
                  <Icon name="chevron-down" size={16} color="#7f8c8d" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.dateSelectButton, {flex: 2}]}
                  onPress={() => setDueDateMonthPickerVisible(true)}>
                  <Text style={styles.dateSelectText}>
                    {newOpportunity?.dueDateMonth
                      ? getMonthsArray().find(
                          m => m.id === newOpportunity.dueDateMonth,
                        )?.name
                      : 'Mês'}
                  </Text>
                  <Icon name="chevron-down" size={16} color="#7f8c8d" />
                </TouchableOpacity>

                <TextInput
                  style={[styles.dateSelectButton, styles.yearInput, {flex: 1}]}
                  value={newOpportunity?.dueDateYear || ''}
                  onChangeText={text => {
                    setNewOpportunity(prev => ({
                      ...prev,
                      dueDateYear: text,
                    }));
                  }}
                  placeholder="Ano"
                  placeholderTextColor="#6c757d"
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
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
            onPress={() => {
              const todayComponents = getCurrentDateComponents();
              setNewOpportunity({
                phones: [],
                dueDateDay: todayComponents.day,
                dueDateMonth: todayComponents.month,
                dueDateYear: todayComponents.year,
              });
              setAddModalVisible(true);
            }}>
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

      {/* Items per page selector */}
      {!isLoading && opportunities && opportunities.length > 0 && !error && (
        <View
          style={{
            backgroundColor: '#fff',
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#e9ecef',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginHorizontal: 20,
            marginBottom: 16,
          }}>
          <Text style={{color: '#6c757d', fontSize: 14}}>
            Mostrando {opportunities.length} de {totalItems} oportunidades
          </Text>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={{color: '#6c757d', fontSize: 14, marginRight: 8}}>
              Por página:
            </Text>
            <View style={{position: 'relative'}}>
              <TouchableOpacity
                onPress={() =>
                  setShowItemsPerPageDropdown(!showItemsPerPageDropdown)
                }
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderWidth: 1,
                  borderColor: '#e9ecef',
                  borderRadius: 6,
                  backgroundColor: '#f8f9fa',
                  minWidth: 60,
                }}>
                <Text style={{color: '#495057', fontSize: 14, marginRight: 4}}>
                  {itemsPerPage}
                </Text>
                <Icon
                  name={
                    showItemsPerPageDropdown
                      ? 'keyboard-arrow-up'
                      : 'keyboard-arrow-down'
                  }
                  size={16}
                  color="#6c757d"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

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
            {opportunities.map((opportunity, index) =>
              renderOpportunityCard(opportunity, index),
            )}

            {/* Pagination Controls */}
            {totalItems > itemsPerPage && (
              <View
                style={{
                  backgroundColor: '#fff',
                  marginTop: 16,
                  borderRadius: 16,
                  padding: 20,
                  shadowColor: '#000',
                  shadowOffset: {width: 0, height: 3},
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  elevation: 4,
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                  <TouchableOpacity
                    onPress={() =>
                      setCurrentPage(prev => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 8,
                      backgroundColor:
                        currentPage === 1 ? '#f8f9fa' : '#2529a1',
                      opacity: currentPage === 1 ? 0.5 : 1,
                    }}>
                    <Icon
                      name="chevron-left"
                      size={20}
                      color={currentPage === 1 ? '#6c757d' : '#fff'}
                    />
                    <Text
                      style={{
                        color: currentPage === 1 ? '#6c757d' : '#fff',
                        marginLeft: 4,
                        fontWeight: '600',
                      }}>
                      Anterior
                    </Text>
                  </TouchableOpacity>

                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Text style={{color: '#6c757d', fontSize: 14}}>
                      Página {currentPage} de{' '}
                      {Math.ceil(totalItems / itemsPerPage)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() =>
                      setCurrentPage(prev =>
                        Math.min(
                          Math.ceil(totalItems / itemsPerPage),
                          prev + 1,
                        ),
                      )
                    }
                    disabled={
                      currentPage >= Math.ceil(totalItems / itemsPerPage)
                    }
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 8,
                      backgroundColor:
                        currentPage >= Math.ceil(totalItems / itemsPerPage)
                          ? '#f8f9fa'
                          : '#2529a1',
                      opacity:
                        currentPage >= Math.ceil(totalItems / itemsPerPage)
                          ? 0.5
                          : 1,
                    }}>
                    <Text
                      style={{
                        color:
                          currentPage >= Math.ceil(totalItems / itemsPerPage)
                            ? '#6c757d'
                            : '#fff',
                        marginRight: 4,
                        fontWeight: '600',
                      }}>
                      Próxima
                    </Text>
                    <Icon
                      name="chevron-right"
                      size={20}
                      color={
                        currentPage >= Math.ceil(totalItems / itemsPerPage)
                          ? '#6c757d'
                          : '#fff'
                      }
                    />
                  </TouchableOpacity>
                </View>
              </View>
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

      {/* Date Pickers for Due Date */}
      {renderSelectModal(
        'Selecionar Dia',
        getDaysArray(),
        {
          id: editModalVisible
            ? editingOpportunity?.dueDateDay
            : newOpportunity?.dueDateDay,
        },
        item => {
          if (editModalVisible) {
            setEditingOpportunity(prev => ({...prev, dueDateDay: item.id}));
          } else {
            setNewOpportunity(prev => ({...prev, dueDateDay: item.id}));
          }
        },
        dueDateDayPickerVisible,
        setDueDateDayPickerVisible,
        'name',
      )}

      {renderSelectModal(
        'Selecionar Mês',
        getMonthsArray(),
        {
          id: editModalVisible
            ? editingOpportunity?.dueDateMonth
            : newOpportunity?.dueDateMonth,
        },
        item => {
          if (editModalVisible) {
            setEditingOpportunity(prev => ({...prev, dueDateMonth: item.id}));
          } else {
            setNewOpportunity(prev => ({...prev, dueDateMonth: item.id}));
          }
        },
        dueDateMonthPickerVisible,
        setDueDateMonthPickerVisible,
        'name',
      )}

      {/* Date Pickers for Alter Date */}
      {renderSelectModal(
        'Selecionar Dia',
        getDaysArray(),
        {
          id: editModalVisible
            ? editingOpportunity?.alterDateDay
            : newOpportunity?.alterDateDay,
        },
        item => {
          if (editModalVisible) {
            setEditingOpportunity(prev => ({...prev, alterDateDay: item.id}));
          } else {
            setNewOpportunity(prev => ({...prev, alterDateDay: item.id}));
          }
        },
        'name',
      )}

      {renderSelectModal(
        'Selecionar Mês',
        getMonthsArray(),
        {
          id: editModalVisible
            ? editingOpportunity?.alterDateMonth
            : newOpportunity?.alterDateMonth,
        },
        item => {
          if (editModalVisible) {
            setEditingOpportunity(prev => ({...prev, alterDateMonth: item.id}));
          } else {
            setNewOpportunity(prev => ({...prev, alterDateMonth: item.id}));
          }
        },
        'name',
      )}

      {/* Dropdown Overlay */}
      {showItemsPerPageDropdown && (
        <TouchableWithoutFeedback
          onPress={() => setShowItemsPerPageDropdown(false)}>
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 998,
            }}>
            <View
              style={{
                position: 'absolute',
                top: 140,
                right: 20,
                backgroundColor: '#fff',
                borderWidth: 1,
                borderColor: '#e9ecef',
                borderRadius: 6,
                shadowColor: '#000',
                shadowOffset: {width: 0, height: 2},
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 999,
                zIndex: 999,
              }}>
              {[5, 10, 20, 50].map(size => (
                <TouchableOpacity
                  key={size}
                  onPress={() => {
                    setItemsPerPage(size);
                    setCurrentPage(1);
                    setShowItemsPerPageDropdown(false);
                  }}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    backgroundColor:
                      itemsPerPage === size ? '#f8f9fa' : 'transparent',
                    borderBottomWidth: size !== 50 ? 1 : 0,
                    borderBottomColor: '#f1f3f4',
                  }}>
                  <Text
                    style={{
                      color: itemsPerPage === size ? '#2529a1' : '#495057',
                      fontSize: 14,
                      fontWeight: itemsPerPage === size ? '600' : '400',
                    }}>
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      )}
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
  // Date Picker Styles
  datePickerContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dateSelectButton: {
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
  dateSelectText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  yearInput: {
    textAlign: 'center',
    justifyContent: 'center',
  },
  // Text Input Styles
  textInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#2c3e50',
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
    fontStyle: 'italic',
  },
  // Phone Input Styles
  phoneInputsContainer: {
    gap: 12,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phoneInput: {
    flex: 1,
  },
  addPhoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#27ae60',
    borderRadius: 8,
    backgroundColor: '#27ae6010',
    gap: 8,
  },
  addPhoneText: {
    color: '#27ae60',
    fontSize: 14,
    fontWeight: '600',
  },
  removePhoneButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#e74c3c10',
  },
});
