import { DateTimePicker } from '@react-native-community/datetimepicker';
import {useStore} from '@store';
import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import Icon from 'react-native-vector-icons/MaterialIcons';
import useToastMessage from '../hooks/useToastMessage';
import styles from './CreateContractModal.styles';
import { inlineStyle_11_8, inlineStyle_21_14, inlineStyle_22_71, inlineStyle_137_56 } from './CreateContractModal.styles';

const Dropdown = ({ label, value, options, onChange }) => (
  <View style={inlineStyle_11_8}>
    <Text style={styles.inputLabel}>{label}</Text>
    {options.map(opt => (
      <TouchableOpacity
        key={opt.value}
        style={[
          styles.selectOption,
          value === opt.value && styles.selectOptionActive,
        ]}
        onPress={() => onChange(opt.value)}>
        <View style={inlineStyle_21_14}>
          {opt.icon && <Icon name={opt.icon} size={20} color="#2529a1" style={inlineStyle_22_71} />}
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
  const {showError, showSuccess} = useToastMessage();
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
  const [selectedProvider, setSelectedProvider] = useState('');
  const [docKey, setDocKey] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (visible) loadInitialData();
  }, [visible]);

  const loadInitialData = async () => {
    try {
      await peopleActions.getItems({ company: '/people/' + currentCompany.id, linkType: 'client' });
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
    } catch { setContractModels([{ '@id': '/contract-models/1', model: 'Contrato de Servicos' }, { '@id': '/contract-models/2', model: 'Contrato de Locacao' }, { '@id': '/contract-models/3', model: 'Contrato de Compra e Venda' }]); }
    finally { setLoadingModels(false); }
  };

  const handleSubmit = async () => {
    if (!selectedModel || !selectedProvider || !selectedStatus || !startDate) {
      showError(global.t?.t('contract','error', 'requiredFields'));
      return;
    }
    setIsLoading(true);
    try {
      const contractData = { contractModel: selectedModel, status: selectedStatus, provider: selectedProvider, docKey: docKey || undefined, startDate, endDate: endDate || undefined, creationDate: new Date().toISOString(), alterDate: new Date().toISOString(), peoples: [] };
      await contractActions.save(contractData);
      showSuccess(global.t?.t('contract','success', 'created'));
      resetForm();
      onSuccess && onSuccess();
      onClose();
    } catch (e) { console.error(e); showError(global.t?.t('contract','error', 'createFailed')); }
    finally { setIsLoading(false); }
  };

  const resetForm = () => { setSelectedModel(''); setSelectedStatus(''); setSelectedProvider(''); setDocKey(''); setStartDate(''); setEndDate(''); };
  const handleClose = () => { resetForm(); onClose(); };
  const onChange = (event, selectedDate) => {
    if (selectedDate) {
      setDate(selectedDate);
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const d = String(selectedDate.getDate()).padStart(2, '0');
      setStartDate(`${y}-${m}-${d}`);
    }
    setOpen(false);
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{global.t?.t('contract','title', 'createContract')}</Text>
            <TouchableOpacity onPress={handleClose}><Icon name="close" size={24} color="#666" /></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Dropdown label={`${global.t?.t('contract','label', 'contractModel')} *`} value={selectedModel} onChange={setSelectedModel} options={contractModels.map(m => ({ label: m.model, value: m['@id'], icon: 'description' }))} />
            <Dropdown label={`${global.t?.t('contract','label', 'provider')} *`} value={selectedProvider} onChange={setSelectedProvider} options={people?.map(p => ({ label: p.name, value: p['@id'], icon: 'person' })) || []} />
            <Dropdown label={`${global.t?.t('contract','label', 'status')} *`} value={selectedStatus} onChange={setSelectedStatus} options={status?.map(s => ({ label: s.realStatus || s.status, value: s['@id'] })) || []} />

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{global.t?.t('contract','label', 'startDate')} *</Text>
              <TextInput style={styles.textInput} onFocus={() => setOpen(true)} value={startDate} onChangeText={setStartDate} placeholder={global.t?.t('contract','placeholder', 'date')} placeholderTextColor="#999" />
              {open && <DateTimePicker testID="dateTimePicker" value={date} mode="date" is24Hour={true} onChange={onChange} />}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}><Text style={styles.cancelButtonText}>{global.t?.t('contract','action', 'cancel')}</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.createButton, (!selectedModel || !selectedProvider || !selectedStatus || !startDate) && styles.createButtonDisabled]} onPress={handleSubmit} disabled={isLoading || !selectedModel || !selectedProvider || !selectedStatus || !startDate}>
              {isLoading ? <ActivityIndicator size="small" color="#FFF" /> : <>
                <Icon name="add" size={20} color="#FFF" style={inlineStyle_137_56} />
                <Text style={styles.createButtonText}>{global.t?.t('contract','action', 'createContract')}</Text>
              </>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CreateContractModal;
