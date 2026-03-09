import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Modal,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { useStore } from '@store';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AnimatedModal from '@controleonline/ui-crm/src/react/components/AnimatedModal';
import useToastMessage from '../../hooks/useToastMessage';
import translateWithFallback from '../../utils/translateWithFallback';

const CreateProposalsModal = ({ visible, onClose, onSuccess }) => {
  const tr = (type, key, fallback) =>
    translateWithFallback('createProposalModal', type, key, fallback);
  const {showError} = useToastMessage();
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

  const { items: people, currentCompany } = peopleGetters;

  const [isLoading, setIsLoading] = useState(false);
  const [contractModels, setContractModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);

  const [selectedModel, setSelectedModel] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [startDay, setStartDay] = useState('');
  const [startMonth, setStartMonth] = useState('');
  const [startYear, setStartYear] = useState('');

  const [modelPickerVisible, setModelPickerVisible] = useState(false);
  const [providerPickerVisible, setProviderPickerVisible] = useState(false);
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
        linkType: 'client',
      });
      await statusActions.getItems({ context: 'proposal' });
      await loadContractModels();
    } catch (error) {
      console.error(error);
    }
  };

  const loadContractModels = async () => {
    setLoadingModels(true);
    try {
      if (!currentCompany?.id) {
        setContractModels([]);
        return;
      }

      const currentCompanyId = String(currentCompany.id).replace(/\D/g, '');
      const companyIri = `/people/${currentCompanyId}`;
      const response = await modelsActions.getItems({
        context: 'proposal',
        company: companyIri,
        people: currentCompanyId,
      });

      const filteredModels = Array.isArray(response)
        ? response.filter(model => {
            const modelCompanyId = String(
              model?.people?.['@id'] ||
                model?.people ||
                model?.company?.['@id'] ||
                model?.company ||
                '',
            ).replace(/\D/g, '');

            return !modelCompanyId || modelCompanyId === currentCompanyId;
          })
        : [];

      setContractModels(filteredModels);
    } catch (error) {
    } finally {
      setLoadingModels(false);
    }
  };

  const formatDate = (year, month, day) => {
    const normalizedYear = String(year || '').replace(/\D/g, '');
    const normalizedMonth = String(month || '').replace(/\D/g, '');
    const normalizedDay = String(day || '').replace(/\D/g, '');

    if (
      normalizedYear.length !== 4 ||
      !normalizedMonth ||
      !normalizedDay
    ) {
      return null;
    }

    const parsedYear = parseInt(normalizedYear, 10);
    const parsedMonth = parseInt(normalizedMonth, 10);
    const parsedDay = parseInt(normalizedDay, 10);
    const candidate = new Date(parsedYear, parsedMonth - 1, parsedDay);
    const isValidDate =
      candidate.getFullYear() === parsedYear &&
      candidate.getMonth() === parsedMonth - 1 &&
      candidate.getDate() === parsedDay;

    if (!isValidDate) {
      return null;
    }

    return `${normalizedYear}-${normalizedMonth.padStart(2, '0')}-${normalizedDay.padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    const startDate = formatDate(startYear, startMonth, startDay);
    if (!selectedModel) {
      showError(tr('error', 'requiredFields', 'Por favor, preencha todos os campos obrigatorios.'));
      return;
    }

    if (!startDate) {
      showError(tr('error', 'invalidStartDate', 'Informe uma data de inicio valida.'));
      return;
    }

    setIsLoading(true);
    try {
      const contractData = {
        contractModel: selectedModel,
        provider: `/people/${currentCompany.id}`,
        startDate,
      };
      await contractActions.save(contractData);
      onSuccess && onSuccess();
      handleClose();
    } catch (error) {
      console.error(error);
      showError(tr('error', 'createFailed', 'Erro ao criar proposta. Tente novamente.'));
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedModel('');
    setSelectedProvider('');
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
      <View style={styles.pickerModalOverlay}>
        <View style={styles.pickerModalContent}>
          <View style={styles.pickerModalHeader}>
            <Text style={styles.pickerModalTitle}>
              {tr('title', 'selectModel', 'Selecionar Modelo')}
            </Text>
            <TouchableOpacity onPress={() => setModelPickerVisible(false)}>
              <Icon name="close" size={24} color="#666666" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerModalBody}>
            {loadingModels ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#2529a1" />
                <Text style={styles.loadingText}>
                  {tr('state', 'loadingModels', 'Carregando modelos...')}
                </Text>
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
                <Text style={styles.emptyText}>
                  {tr('state', 'noModelFound', 'Nenhum modelo encontrado')}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderProviderSelectModal = () => (
    <Modal animationType="slide" transparent visible={providerPickerVisible} onRequestClose={() => setProviderPickerVisible(false)}>
      <View style={styles.pickerModalOverlay}>
        <View style={styles.pickerModalContent}>
          <View style={styles.pickerModalHeader}>
            <Text style={styles.pickerModalTitle}>
              {tr('title', 'selectProvider', 'Selecionar Beneficiario')}
            </Text>
            <TouchableOpacity onPress={() => setProviderPickerVisible(false)}>
              <Icon name="close" size={24} color="#666666" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerModalBody}>
            {people && people.length > 0 ? (
              people.map(person => (
                <TouchableOpacity
                  key={person['@id']}
                  style={[styles.selectOption, selectedProvider === person['@id'] && styles.selectOptionActive]}
                  onPress={() => {
                    setSelectedProvider(person['@id']);
                    setProviderPickerVisible(false);
                  }}>
                  <View style={styles.personInfo}>
                    <View style={styles.iconContainer}>
                      <Icon name="person" size={20} color="#2529a1" />
                    </View>
                    <Text style={[styles.personName, selectedProvider === person['@id'] && styles.selectOptionTextActive]}>
                      {person.name}
                    </Text>
                  </View>
                  {selectedProvider === person['@id'] && <Icon name="check-circle" size={24} color="#4CAF50" />}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Icon name="person-outline" size={48} color="#CCCCCC" />
                <Text style={styles.emptyText}>
                  {tr('state', 'noPeopleFound', 'Nenhuma pessoa encontrada')}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderDayPicker = () => (
    <Modal transparent visible={dayPickerVisible} animationType="slide" onRequestClose={() => setDayPickerVisible(false)}>
      <View style={styles.pickerModalOverlay}>
        <View style={styles.pickerModalContent}>
          <View style={styles.pickerModalHeader}>
            <Text style={styles.pickerModalTitle}>
              {tr('title', 'selectDay', 'Selecionar Dia')}
            </Text>
            <TouchableOpacity onPress={() => setDayPickerVisible(false)}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerModalBody}>
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
    const months = [
      tr('month', 'january', 'Janeiro'),
      tr('month', 'february', 'Fevereiro'),
      tr('month', 'march', 'Marco'),
      tr('month', 'april', 'Abril'),
      tr('month', 'may', 'Maio'),
      tr('month', 'june', 'Junho'),
      tr('month', 'july', 'Julho'),
      tr('month', 'august', 'Agosto'),
      tr('month', 'september', 'Setembro'),
      tr('month', 'october', 'Outubro'),
      tr('month', 'november', 'Novembro'),
      tr('month', 'december', 'Dezembro'),
    ];
    return (
      <Modal transparent visible={monthPickerVisible} animationType="slide" onRequestClose={() => setMonthPickerVisible(false)}>
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>
                {tr('title', 'selectMonth', 'Selecionar Mes')}
              </Text>
              <TouchableOpacity onPress={() => setMonthPickerVisible(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerModalBody}>
              {months.map((month, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.selectOption, startMonth === (index + 1).toString() && styles.selectOptionActive]}
                  onPress={() => {
                    setStartMonth((index + 1).toString());
                    setMonthPickerVisible(false);
                  }}>
                  <Text style={[styles.modelName, startMonth === (index + 1).toString() && styles.selectOptionTextActive]}>{month}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <AnimatedModal visible={visible} onRequestClose={handleClose} style={{ justifyContent: 'flex-end' }}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {tr('title', 'createProposal', 'Criar Nova Proposta')}
          </Text>
          <TouchableOpacity onPress={handleClose} style={styles.headerCloseButton}>
            <Icon name="close" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalBody}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {tr('label', 'proposalModel', 'Modelo da Proposta')} <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity style={styles.selectInput} onPress={() => setModelPickerVisible(true)}>
              <View style={styles.selectInputContent}>
                <Icon name="description" size={20} color="#2529a1" style={{ marginRight: 8 }} />
                <Text style={[styles.selectInputText, { color: selectedModel ? '#1A1A1A' : '#999999' }]}>
                  {selectedModel
                    ? contractModels.find(m => m['@id'] === selectedModel)?.model
                    : tr('placeholder', 'selectModel', 'Selecionar modelo')}
                </Text>
              </View>
              <Icon name="keyboard-arrow-down" size={24} color="#666666" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {tr('label', 'startDate', 'Data de Inicio')} <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.dateContainer}>
              <TouchableOpacity style={styles.selectInputDate} onPress={() => setDayPickerVisible(true)}>
                <Text style={[styles.selectInputText, !startDay && { color: '#999' }]}>
                  {startDay || tr('placeholder', 'day', 'Dia')}
                </Text>
                <Icon name="arrow-drop-down" size={20} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.selectInputDate} onPress={() => setMonthPickerVisible(true)}>
                <Text style={[styles.selectInputText, !startMonth && { color: '#999' }]}>
                  {startMonth
                    ? [
                        tr('monthShort', 'jan', 'Jan'),
                        tr('monthShort', 'feb', 'Fev'),
                        tr('monthShort', 'mar', 'Mar'),
                        tr('monthShort', 'apr', 'Abr'),
                        tr('monthShort', 'may', 'Mai'),
                        tr('monthShort', 'jun', 'Jun'),
                        tr('monthShort', 'jul', 'Jul'),
                        tr('monthShort', 'aug', 'Ago'),
                        tr('monthShort', 'sep', 'Set'),
                        tr('monthShort', 'oct', 'Out'),
                        tr('monthShort', 'nov', 'Nov'),
                        tr('monthShort', 'dec', 'Dez'),
                      ][parseInt(startMonth) - 1]
                    : tr('placeholder', 'month', 'Mes')}
                </Text>
                <Icon name="arrow-drop-down" size={20} color="#666" />
              </TouchableOpacity>
              <TextInput
                style={styles.yearInput}
                value={startYear}
                onChangeText={text =>
                  setStartYear(String(text || '').replace(/\D/g, '').slice(0, 4))
                }
                placeholder="2024"
                placeholderTextColor="#999999"
                keyboardType="numeric"
                maxLength={4}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              Keyboard.dismiss();
              handleClose();
            }}>
            <Text style={styles.cancelButtonText}>{tr('action', 'cancel', 'Cancelar')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.createButton,
              (!selectedModel || !formatDate(startYear, startMonth, startDay)) &&
                styles.createButtonDisabled,
            ]}
            onPress={() => {
              Keyboard.dismiss();
              handleSubmit();
            }}
            disabled={
              isLoading || !selectedModel || !formatDate(startYear, startMonth, startDay)
            }>
            {isLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
              <Text style={styles.createButtonText}>{tr('action', 'save', 'Salvar')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {renderModelSelectModal()}
      {renderProviderSelectModal()}
      {renderDayPicker()}
      {renderMonthPicker()}
    </AnimatedModal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
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
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
  },
  selectInputContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  selectInputText: { fontSize: 16, flex: 1, color: '#1A1A1A' },
  dateContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  selectInputDate: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
  },
  yearInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#f8f9fa',
    textAlign: 'center',
  },
  modalFooter: { flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 1, borderTopColor: '#e9ecef' },
  cancelButton: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#6c757d', alignItems: 'center' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#6c757d' },
  createButton: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#007bff', alignItems: 'center', justifyContent: 'center' },
  createButtonDisabled: { backgroundColor: '#6c757d' },
  createButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  pickerModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerModalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, width: '100%', maxHeight: '50%', elevation: 10 },
  pickerModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E9ECEF' },
  pickerModalTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },
  pickerModalBody: { maxHeight: '100%' },
  selectOption: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F3F4' },
  selectOptionActive: { backgroundColor: '#F8F9FF' },
  selectOptionTextActive: { color: '#2529a1', fontWeight: '600' },
  modelInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  personInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8F9FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  modelName: { fontSize: 16, color: '#1A1A1A' },
  personName: { fontSize: 16, color: '#1A1A1A' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, color: '#999999', marginTop: 12 },
  loadingContainer: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { fontSize: 16, color: '#666666', marginTop: 12 },
});

export default CreateProposalsModal;

