import { DateTimePicker } from '@react-native-community/datetimepicker';
import {useStore} from '@store';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Dropdown = ({ label, value, options, onChange }) => (
  <View style={{ marginBottom: 20 }}>
    <Text style={styles.inputLabel}>{label}</Text>
    {options.map(opt => (
      <TouchableOpacity
        key={opt.value}
        style={[
          styles.selectOption,
          value === opt.value && styles.selectOptionActive,
        ]}
        onPress={() => onChange(opt.value)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {opt.icon && <Icon name={opt.icon} size={20} color="#2529a1" style={{ marginRight: 8 }} />}
          <Text style={[styles.selectInputText, value === opt.value && styles.selectOptionTextActive]}>
            {opt.label}
          </Text>
        </View>
        {value === opt.value && <Icon name="check-circle" size={24} color="#4CAF50" />}
      </TouchableOpacity>
    ))}
  </View>
);

const CreateContractModal = ({ visible, onClose, onSuccess }) => {
  const contractStore = useStore('contract');
  const contractActions = contractStore.actions;
  const peopleStore = useStore('people');
  const peopleGetters = peopleStore.getters;
  const peopleActions = peopleStore.actions;
  const statusStore = useStore('status');
  const statusGetters = statusStore.getters;
  const statusActions = statusStore.actions;

  const { items: people, currentCompany } = peopleGetters;
  const { items: status } = statusGetters;

  const [isLoading, setIsLoading] = useState(false);
  const [contractModels, setContractModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [date, setDate] = useState(new Date());
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState('');
  const [docKey, setDocKey] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (visible) loadInitialData();
  }, [visible]);

  const loadInitialData = async () => {
    try {
      await peopleActions.getItems({ company: '/people/' + currentCompany.id, link_type: 'client' });
      await statusActions.getItems({ context: 'relationship' });
      await loadContractModels();
    } catch (e) { console.error(e); }
  };

  const loadContractModels = async () => {
    setLoadingModels(true);
    try {
      const response = await contractActions.getItems({ 'contractModel.context': 'contract', limit: 100 });
      const uniqueModels = [];
      const ids = new Set();
      response?.forEach(c => { if(c.contractModel && !ids.has(c.contractModel['@id'])) { ids.add(c.contractModel['@id']); uniqueModels.push(c.contractModel); }});
      setContractModels(uniqueModels);
    } catch { setContractModels([{ '@id': '/contract-models/1', model: 'Contrato de Serviços' }, { '@id': '/contract-models/2', model: 'Contrato de Locação' }, { '@id': '/contract-models/3', model: 'Contrato de Compra e Venda' }]); }
    finally { setLoadingModels(false); }
  };

  const handleSubmit = async () => {
    if (!selectedModel || !selectedBeneficiary || !selectedStatus) return alert('Preencha todos os campos obrigatórios.');
    setIsLoading(true);
    try {
      const contractData = { contractModel: selectedModel, status: selectedStatus, beneficiary: selectedBeneficiary, docKey: docKey || undefined, startDate: startDate || new Date().toISOString(), endDate: endDate || undefined, creationDate: new Date().toISOString(), alterDate: new Date().toISOString(), peoples: [] };
      await contractActions.save(contractData);
      alert('Contrato criado com sucesso!');
      resetForm();
      onSuccess && onSuccess();
      onClose();
    } catch (e) { console.error(e); alert('Erro ao criar contrato.'); }
    finally { setIsLoading(false); }
  };

  const resetForm = () => { setSelectedModel(''); setSelectedStatus(''); setSelectedBeneficiary(''); setDocKey(''); setStartDate(''); setEndDate(''); };
  const handleClose = () => { resetForm(); onClose(); };
  const onChange = (event, selectedDate) => setDate(selectedDate);

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Criar Novo Contrato</Text>
            <TouchableOpacity onPress={handleClose}><Icon name="close" size={24} color="#666" /></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Dropdown label="Modelo do Contrato *" value={selectedModel} onChange={setSelectedModel} options={contractModels.map(m => ({ label: m.model, value: m['@id'], icon: 'description' }))} />
            <Dropdown label="Beneficiário *" value={selectedBeneficiary} onChange={setSelectedBeneficiary} options={people?.map(p => ({ label: p.name, value: p['@id'], icon: 'person' })) || []} />
            <Dropdown label="Status *" value={selectedStatus} onChange={setSelectedStatus} options={status?.map(s => ({ label: s.realStatus || s.status, value: s['@id'] })) || []} />

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Data de Início</Text>
              <TextInput style={styles.textInput} onFocus={() => setOpen(true)} value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" placeholderTextColor="#999" />
              {open && <DateTimePicker testID="dateTimePicker" value={date} mode="date" is24Hour={true} onChange={onChange} />}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}><Text style={styles.cancelButtonText}>Cancelar</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.createButton, (!selectedModel || !selectedBeneficiary || !selectedStatus) && styles.createButtonDisabled]} onPress={handleSubmit} disabled={isLoading || !selectedModel || !selectedBeneficiary || !selectedStatus}>
              {isLoading ? <ActivityIndicator size="small" color="#FFF" /> : <>
                <Icon name="add" size={20} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.createButtonText}>Criar Contrato</Text>
              </>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', alignItems:'center' },
  modalContent: { backgroundColor:'#FFF', borderRadius:16, width:'90%', maxHeight:'80%', elevation:10, paddingBottom:8 },
  modalHeader:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:20, paddingVertical:16, borderBottomWidth:1, borderBottomColor:'#E9ECEF' },
  modalTitle:{ fontSize:20, fontWeight:'600', color:'#1A1A1A' },
  modalBody:{ paddingHorizontal:20, paddingVertical:16 },
  inputGroup:{ marginBottom:20 },
  inputLabel:{ fontSize:16, fontWeight:'500', color:'#1A1A1A', marginBottom:8 },
  selectInputText:{ fontSize:16, flex:1 },
  selectOption:{ flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingVertical:12, borderWidth:1, borderColor:'#E0E0E0', borderRadius:8, marginBottom:4 },
  selectOptionActive:{ backgroundColor:'#F8F9FF' },
  selectOptionTextActive:{ color:'#2529a1', fontWeight:'600' },
  textInput:{ borderWidth:1, borderColor:'#E0E0E0', borderRadius:8, paddingHorizontal:12, paddingVertical:12, fontSize:16, color:'#1A1A1A', backgroundColor:'#FFF' },
  modalFooter:{ flexDirection:'row', justifyContent:'space-between', paddingHorizontal:20, paddingVertical:16, borderTopWidth:1, borderTopColor:'#E9ECEF' },
  cancelButton:{ flex:1, paddingVertical:12, marginRight:8, borderRadius:8, borderWidth:1, borderColor:'#E0E0E0', alignItems:'center' },
  cancelButtonText:{ fontSize:16, fontWeight:'600', color:'#666' },
  createButton:{ flex:1, flexDirection:'row', paddingVertical:12, marginLeft:8, borderRadius:8, backgroundColor:'#2529a1', alignItems:'center', justifyContent:'center' },
  createButtonDisabled:{ backgroundColor:'#CCC' },
  createButtonText:{ fontSize:16, fontWeight:'600', color:'#FFF' },
});

export default CreateContractModal;
