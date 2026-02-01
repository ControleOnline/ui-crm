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
import {useStore} from '@store';
import Icon from 'react-native-vector-icons/MaterialIcons';

const CreateProposalsModal = ({visible, onClose, onSuccess}) => {
  const contractStore = useStore('contract');
  const contractActions = contractStore.actions;
  const peopleStore = useStore('people');
  const peopleGetters = peopleStore.getters;
  const peopleActions = peopleStore.actions;
  const statusStore = useStore('status');
  const statusGetters = statusStore.getters;
  const statusActions = statusStore.actions;
  const modelsStore = useStore('models');
  const modelsActions = modelsStore.actions;

  const {items: people, currentCompany} = peopleGetters;

  const [isLoading, setIsLoading] = useState(false);
  const [contractModels, setContractModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);

  const [selectedModel, setSelectedModel] = useState('');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState('');
  const [startDay, setStartDay] = useState('');
  const [startMonth, setStartMonth] = useState('');
  const [startYear, setStartYear] = useState('');

  const [modelPickerVisible, setModelPickerVisible] = useState(false);
  const [beneficiaryPickerVisible, setBeneficiaryPickerVisible] = useState(false);
  const [dayPickerVisible, setDayPickerVisible] = useState(false);
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      loadInitialData();
    }
  }, [visible]);

  const loadInitialData = async () => {
    try {
      await peopleActions.getItems({
        company: '/people/' + currentCompany.id,
        link_type: 'client',
      });
      await statusActions.getItems({context: 'relationship'});
      await loadContractModels();
    } catch (error) {
      console.error(error);
    }
  };

  const loadContractModels = async () => {
    setLoadingModels(true);
    try {
      const response = await modelsActions.getItems({context: 'proposal'});
      setContractModels(response);
    } catch (error) {
    } finally {
      setLoadingModels(false);
    }
  };

  const formatDate = (year, month, day) => {
    if (!year || !month || !day) return null;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!selectedModel) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    setIsLoading(true);
    try {
      const contractData = {
        contractModel: selectedModel,
        beneficiary: 'people/' + currentCompany.id,
        startDate: formatDate(startYear, startMonth, startDay),
      };
      await contractActions.save(contractData);
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Erro ao criar contrato. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedModel('');
    setSelectedBeneficiary('');
    setStartDay('');
    setStartMonth('');
    setStartYear('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const renderModelSelectModal = () => (
    <Modal animationType="slide" transparent visible={modelPickerVisible} onRequestClose={() => setModelPickerVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.selectModalContent}>
          <View style={styles.selectModalHeader}>
            <Text style={styles.selectModalTitle}>Selecionar Modelo</Text>
            <TouchableOpacity onPress={() => setModelPickerVisible(false)}>
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
                  style={[styles.selectOption, selectedModel === model['@id'] && styles.selectOptionActive]}
                  onPress={() => {
                    setSelectedModel(model['@id']);
                    setModelPickerVisible(false);
                  }}>
                  <View style={styles.modelInfo}>
                    <View style={styles.iconContainer}>
                      <Icon name="description" size={20} color="#2529a1" />
                    </View>
                    <Text style={[styles.modelName, selectedModel === model['@id'] && styles.selectOptionTextActive]}>
                      {model.model}
                    </Text>
                  </View>
                  {selectedModel === model['@id'] && <Icon name="check-circle" size={24} color="#4CAF50" />}
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
    <Modal animationType="slide" transparent visible={beneficiaryPickerVisible} onRequestClose={() => setBeneficiaryPickerVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.selectModalContent}>
          <View style={styles.selectModalHeader}>
            <Text style={styles.selectModalTitle}>Selecionar Beneficiário</Text>
            <TouchableOpacity onPress={() => setBeneficiaryPickerVisible(false)}>
              <Icon name="close" size={24} color="#666666" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.selectModalBody}>
            {people && people.length > 0 ? (
              people.map(person => (
                <TouchableOpacity
                  key={person['@id']}
                  style={[styles.selectOption, selectedBeneficiary === person['@id'] && styles.selectOptionActive]}
                  onPress={() => {
                    setSelectedBeneficiary(person['@id']);
                    setBeneficiaryPickerVisible(false);
                  }}>
                  <View style={styles.personInfo}>
                    <View style={styles.iconContainer}>
                      <Icon name="person" size={20} color="#2529a1" />
                    </View>
                    <Text style={[styles.personName, selectedBeneficiary === person['@id'] && styles.selectOptionTextActive]}>
                      {person.name}
                    </Text>
                  </View>
                  {selectedBeneficiary === person['@id'] && <Icon name="check-circle" size={24} color="#4CAF50" />}
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

  const renderDayPicker = () => (
    <Modal transparent visible={dayPickerVisible} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.selectModalContent}>
          <View style={styles.selectModalHeader}>
            <Text style={styles.selectModalTitle}>Selecionar Dia</Text>
            <TouchableOpacity onPress={() => setDayPickerVisible(false)}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.selectModalBody}>
            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
              <TouchableOpacity
                key={day}
                style={[styles.selectOption, startDay === day.toString() && styles.selectOptionActive]}
                onPress={() => {
                  setStartDay(day.toString());
                  setDayPickerVisible(false);
                }}>
                <Text style={[styles.modelName, startDay === day.toString() && styles.selectOptionTextActive]}>{day}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderMonthPicker = () => {
    const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    return (
      <Modal transparent visible={monthPickerVisible} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.selectModalContent}>
            <View style={styles.selectModalHeader}>
              <Text style={styles.selectModalTitle}>Selecionar Mês</Text>
              <TouchableOpacity onPress={() => setMonthPickerVisible(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.selectModalBody}>
              {months.map((month, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.selectOption, startMonth === (index+1).toString() && styles.selectOptionActive]}
                  onPress={() => {
                    setStartMonth((index+1).toString());
                    setMonthPickerVisible(false);
                  }}>
                  <Text style={[styles.modelName, startMonth === (index+1).toString() && styles.selectOptionTextActive]}>{month}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Criar Nova Proposta</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#666666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Modelo do Contrato <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity style={styles.selectInput} onPress={() => setModelPickerVisible(true)}>
                <View style={styles.selectInputContent}>
                  <Icon name="description" size={20} color="#2529a1" style={{marginRight: 8}} />
                  <Text style={[styles.selectInputText, {color: selectedModel ? '#1A1A1A' : '#999999'}]}>
                    {selectedModel ? contractModels.find(m => m['@id'] === selectedModel)?.model : 'Selecionar modelo'}
                  </Text>
                </View>
                <Icon name="keyboard-arrow-down" size={24} color="#666666" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Data de Início</Text>
              <View style={styles.dateContainer}>
                <TouchableOpacity style={styles.selectInput} onPress={() => setDayPickerVisible(true)}>
                  <Text style={styles.selectInputText}>{startDay || 'Dia'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.selectInput} onPress={() => setMonthPickerVisible(true)}>
                  <Text style={styles.selectInputText}>
                    {startMonth ? ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][parseInt(startMonth)-1] : 'Mês'}
                  </Text>
                </TouchableOpacity>
                <TextInput
                  style={[styles.yearInput, {flex: 1}]}
                  value={startYear}
                  onChangeText={setStartYear}
                  placeholder="2024"
                  placeholderTextColor="#999999"
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.createButton, !selectedModel && styles.createButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading || !selectedModel}>
              {isLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <>
                <Icon name="add" size={20} color="#FFFFFF" style={{marginRight: 8}} />
                <Text style={styles.createButtonText}>Criar Contrato</Text>
              </>}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {renderModelSelectModal()}
      {renderBeneficiarySelectModal()}
      {renderDayPicker()}
      {renderMonthPicker()}
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'},
  modalContent: {backgroundColor: '#fff', borderRadius: 16, width: '90%', maxHeight: '80%', elevation: 10, shadowColor: '#000', shadowOffset: {width:0,height:4}, shadowOpacity:0.25, shadowRadius:8},
  modalHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems:'center', paddingHorizontal:20,paddingVertical:16, borderBottomWidth:1,borderBottomColor:'#E9ECEF'},
  modalTitle: {fontSize:20,fontWeight:'600',color:'#1A1A1A'},
  closeButton: {padding:4},
  modalBody: {paddingHorizontal:20,paddingVertical:16,maxHeight:400},
  inputGroup: {marginBottom:20},
  inputLabel: {fontSize:16,fontWeight:'500',color:'#1A1A1A',marginBottom:8},
  required: {color:'#FF4444'},
  selectInput: {flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderWidth:1,borderColor:'#E0E0E0',borderRadius:8,paddingHorizontal:12,paddingVertical:12,backgroundColor:'#FFFFFF'},
  selectInputContent:{flexDirection:'row',alignItems:'center',flex:1},
  selectInputText:{fontSize:16,flex:1},
  yearInput: {borderWidth:1,borderColor:'#E0E0E0',borderRadius:8,paddingHorizontal:12,paddingVertical:12,fontSize:16,color:'#1A1A1A',backgroundColor:'#FFFFFF',textAlign:'center'},
  modalFooter:{flexDirection:'row',justifyContent:'space-between',paddingHorizontal:20,paddingVertical:16,borderTopWidth:1,borderTopColor:'#E9ECEF'},
  cancelButton:{flex:1,paddingVertical:12,marginRight:8,borderRadius:8,borderWidth:1,borderColor:'#E0E0E0',alignItems:'center'},
  cancelButtonText:{fontSize:16,fontWeight:'600',color:'#666666'},
  createButton:{flex:1,flexDirection:'row',paddingVertical:12,marginLeft:8,borderRadius:8,backgroundColor:'#2529a1',alignItems:'center',justifyContent:'center'},
  createButtonDisabled:{backgroundColor:'#CCCCCC'},
  createButtonText:{fontSize:16,fontWeight:'600',color:'#FFFFFF'},
  selectModalContent:{backgroundColor:'#FFFFFF',borderRadius:16,width:'90%',maxHeight:'70%',elevation:10,shadowColor:'#000',shadowOffset:{width:0,height:4},shadowOpacity:0.25,shadowRadius:8},
  selectModalHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:20,paddingVertical:16,borderBottomWidth:1,borderBottomColor:'#E9ECEF'},
  selectModalTitle:{fontSize:18,fontWeight:'600',color:'#1A1A1A'},
  selectModalBody:{maxHeight:300},
  selectOption:{flexDirection:'row',alignItems:'center',paddingHorizontal:20,paddingVertical:16,borderBottomWidth:1,borderBottomColor:'#F1F3F4'},
  selectOptionActive:{backgroundColor:'#F8F9FF'},
  selectOptionTextActive:{color:'#2529a1',fontWeight:'600'},
  modelInfo:{flexDirection:'row',alignItems:'center',flex:1},
  personInfo:{flexDirection:'row',alignItems:'center',flex:1},
  iconContainer:{width:40,height:40,borderRadius:20,backgroundColor:'#F8F9FF',alignItems:'center',justifyContent:'center',marginRight:12},
  modelName:{fontSize:16,color:'#1A1A1A'},
  personName:{fontSize:16,color:'#1A1A1A'},
  emptyState:{alignItems:'center',paddingVertical:40},
  emptyText:{fontSize:16,color:'#999999',marginTop:12},
  loadingContainer:{alignItems:'center',paddingVertical:40},
  loadingText:{fontSize:16,color:'#666666',marginTop:12},
  dateContainer:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-end'}
});

export default CreateProposalsModal;
