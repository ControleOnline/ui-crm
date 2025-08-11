import React, {useState, useEffect} from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Modal,
  StyleSheet,
} from 'react-native';
import {getStore} from '@store';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Picker} from '@react-native-picker/picker';

const CreateContractModal = ({visible, onClose, onSuccess}) => {
  const {actions: contractActions} = getStore('contract');
  const {getters: peopleGetters, actions: peopleActions} = getStore('people');
  const {getters: statusGetters, actions: statusActions} = getStore('status');
  // const {getters: modelsetters, actions: modelsActions} = getStore('model');

  const {items: people, currentCompany} = peopleGetters;
  const {items: status} = statusGetters;
  // const {items: models} = modelsetters;

  const [isLoading, setIsLoading] = useState(false);
  const [contractModels, setContractModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);

  // Form fields
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState('');
  const [docKey, setDocKey] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal states
  const [modelPickerVisible, setModelPickerVisible] = useState(false);
  const [beneficiaryPickerVisible, setBeneficiaryPickerVisible] =
    useState(false);

  useEffect(() => {
    if (visible) {
      loadInitialData();
    }
  }, [visible]);

  const loadInitialData = async () => {
    try {
      // Load people
      await peopleActions.getItems({
        company: '/people/' + currentCompany.id,
        link_type: 'client',
      });

      // Load status
      await statusActions.getItems({context: 'relationship'});
      // await models.getItems();

      // Load contract models - assumindo que existe um endpoint para isso
      await loadContractModels();
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    }
  };
  const loadContractModels = async () => {
    setLoadingModels(true);
    try {
      // Simulando busca de modelos - você pode ajustar conforme sua API
      const response = await contractActions.getItems({
        'contractModel.context': 'contract',
        limit: 100,
      });

      // Extrair modelos únicos
      const uniqueModels = [];
      const modelIds = new Set();

      if (response && Array.isArray(response)) {
        response.forEach(contract => {
          if (
            contract.contractModel &&
            !modelIds.has(contract.contractModel['@id'])
          ) {
            modelIds.add(contract.contractModel['@id']);
            uniqueModels.push(contract.contractModel);
          }
        });
      }

      setContractModels(uniqueModels);
    } catch (error) {
      console.error('Erro ao carregar modelos:', error);
      // Fallback com modelos mock se necessário
      setContractModels([
        {'@id': '/contract-models/1', model: 'Contrato de Serviços'},
        {'@id': '/contract-models/2', model: 'Contrato de Locação'},
        {'@id': '/contract-models/3', model: 'Contrato de Compra e Venda'},
      ]);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedModel || !selectedBeneficiary || !selectedStatus) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsLoading(true);
    try {
      const contractData = {
        contractModel: selectedModel,
        status: selectedStatus,
        beneficiary: selectedBeneficiary,
        docKey: docKey.trim() || undefined,
        startDate: startDate || new Date().toISOString(),
        endDate: endDate || undefined,
        creationDate: new Date().toISOString(),
        alterDate: new Date().toISOString(),
        peoples: [], // Pode ser preenchido posteriormente
      };

      await contractActions.save(contractData);

      alert('Contrato criado com sucesso!');
      resetForm();
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao criar contrato:', error);
      alert('Erro ao criar contrato. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedModel('');
    setSelectedStatus('');
    setSelectedBeneficiary('');
    setDocKey('');
    setStartDate('');
    setEndDate('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const formatDateForInput = dateString => {
    if (!dateString) {
      return '';
    }
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const renderModelSelectModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modelPickerVisible}
      onRequestClose={() => setModelPickerVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.selectModalContent}>
          <View style={styles.selectModalHeader}>
            <Text style={styles.selectModalTitle}>Selecionar Modelo</Text>
            <TouchableOpacity
              onPress={() => setModelPickerVisible(false)}
              style={styles.closeButton}>
              <Icon name="close" size={24} color="#666666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.selectModalBody}>
            {loadingModels ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#2529a1" />
                <Text style={styles.loadingText}>Carregando modelos...</Text>
              </View>
            ) : contractModels.length > 0 ? (
              contractModels.map(model => (
                <TouchableOpacity
                  key={model['@id']}
                  style={[
                    styles.selectOption,
                    selectedModel === model['@id'] && styles.selectOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedModel(model['@id']);
                    setModelPickerVisible(false);
                  }}>
                  <View style={styles.modelInfo}>
                    <View style={styles.iconContainer}>
                      <Icon name="description" size={20} color="#2529a1" />
                    </View>
                    <Text
                      style={[
                        styles.modelName,
                        selectedModel === model['@id'] &&
                          styles.selectOptionTextActive,
                      ]}>
                      {model.model}
                    </Text>
                  </View>
                  {selectedModel === model['@id'] && (
                    <Icon name="check-circle" size={24} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Icon name="description" size={48} color="#CCCCCC" />
                <Text style={styles.emptyText}>Nenhum modelo encontrado</Text>
              </View>
            )}
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
              <Icon name="close" size={24} color="#666666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.selectModalBody}>
            {people && people.length > 0 ? (
              people.map(person => (
                <TouchableOpacity
                  key={person['@id']}
                  style={[
                    styles.selectOption,
                    selectedBeneficiary === person['@id'] &&
                      styles.selectOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedBeneficiary(person['@id']);
                    setBeneficiaryPickerVisible(false);
                  }}>
                  <View style={styles.personInfo}>
                    <View style={styles.iconContainer}>
                      <Icon name="person" size={20} color="#2529a1" />
                    </View>
                    <Text
                      style={[
                        styles.personName,
                        selectedBeneficiary === person['@id'] &&
                          styles.selectOptionTextActive,
                      ]}>
                      {person.name}
                    </Text>
                  </View>
                  {selectedBeneficiary === person['@id'] && (
                    <Icon name="check-circle" size={24} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Icon name="person-outline" size={48} color="#CCCCCC" />
                <Text style={styles.emptyText}>Nenhuma pessoa encontrada</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Criar Novo Contrato</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#666666" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}>
            {/* Modelo do Contrato */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Modelo do Contrato <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setModelPickerVisible(true)}>
                <View style={styles.selectInputContent}>
                  <Icon
                    name="description"
                    size={20}
                    color="#2529a1"
                    style={{marginRight: 8}}
                  />
                  <Text
                    style={[
                      styles.selectInputText,
                      {color: selectedModel ? '#1A1A1A' : '#999999'},
                    ]}>
                    {selectedModel
                      ? contractModels.find(m => m['@id'] === selectedModel)
                          ?.model
                      : 'Selecionar modelo'}
                  </Text>
                </View>
                <Icon name="keyboard-arrow-down" size={24} color="#666666" />
              </TouchableOpacity>
            </View>

            {/* Beneficiário */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Beneficiário <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setBeneficiaryPickerVisible(true)}>
                <View style={styles.selectInputContent}>
                  <Icon
                    name="person"
                    size={20}
                    color="#2529a1"
                    style={{marginRight: 8}}
                  />
                  <Text
                    style={[
                      styles.selectInputText,
                      {color: selectedBeneficiary ? '#1A1A1A' : '#999999'},
                    ]}>
                    {selectedBeneficiary
                      ? people?.find(p => p['@id'] === selectedBeneficiary)
                          ?.name
                      : 'Selecionar beneficiário'}
                  </Text>
                </View>
                <Icon name="keyboard-arrow-down" size={24} color="#666666" />
              </TouchableOpacity>
            </View>

            {/* Status */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Status <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedStatus}
                  style={styles.picker}
                  onValueChange={itemValue => setSelectedStatus(itemValue)}>
                  <Picker.Item label="Selecionar status" value="" />
                  {status.map(statusItem => (
                    <Picker.Item
                      key={statusItem['@id']}
                      label={statusItem.realStatus || statusItem.status}
                      value={statusItem['@id']}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Chave do Documento */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Chave do Documento</Text>
              <TextInput
                style={styles.textInput}
                value={docKey}
                onChangeText={setDocKey}
                placeholder="Digite a chave do documento"
                placeholderTextColor="#999999"
              />
            </View>

            {/* Data de Início */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Data de Início</Text>
              <TextInput
                style={styles.textInput}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999999"
              />
            </View>

            {/* Data de Término */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Data de Término</Text>
              <TextInput
                style={styles.textInput}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999999"
              />
            </View>
          </ScrollView>

          {/* Botões de ação */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.createButton,
                (!selectedModel || !selectedBeneficiary || !selectedStatus) &&
                  styles.createButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={
                isLoading ||
                !selectedModel ||
                !selectedBeneficiary ||
                !selectedStatus
              }>
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Icon
                    name="add"
                    size={20}
                    color="#FFFFFF"
                    style={{marginRight: 8}}
                  />
                  <Text style={styles.createButtonText}>Criar Contrato</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {renderModelSelectModal()}
      {renderBeneficiarySelectModal()}
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  required: {
    color: '#FF4444',
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  selectInputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectInputText: {
    fontSize: 16,
    flex: 1,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  picker: {
    color: '#1A1A1A',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  createButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#2529a1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Select Modal Styles
  selectModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '70%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  selectModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  selectModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  selectModalBody: {
    maxHeight: 300,
  },
  selectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  selectOptionActive: {
    backgroundColor: '#F8F9FF',
  },
  selectOptionTextActive: {
    color: '#2529a1',
    fontWeight: '600',
  },
  modelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modelName: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  personName: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
    marginTop: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 12,
  },
});

export default CreateContractModal;
