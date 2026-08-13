import { useCallback, useState } from 'react';

import {
  formatDateForInput,
  formatDateFromComponents,
  getCurrentDateComponents,
  parseDateComponents,
} from '../../../utils/opportunityDate';
import {
  formatPhoneValue,
  hasDuplicatePhones,
  parsePhoneNumbers,
  sanitizePhoneValue,
} from '../../../utils/opportunityPhone';
import { normalizePeopleReferenceValue } from '../../../utils/opportunityPeople';

const useOpportunityForms = ({
  buildOpportunityParams,
  currentCompany,
  opportunitiesActions,
  setCurrentPage,
  showError,
  showSuccess,
}) => {
  const [editingOpportunity, setEditingOpportunity] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newOpportunity, setNewOpportunity] = useState(null);
  const [statusPickerVisible, setStatusPickerVisible] = useState(false);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [criticalityPickerVisible, setCriticalityPickerVisible] = useState(false);
  const [reasonPickerVisible, setReasonPickerVisible] = useState(false);
  const [dueDateDayPickerVisible, setDueDateDayPickerVisible] = useState(false);
  const [dueDateMonthPickerVisible, setDueDateMonthPickerVisible] = useState(false);
  const [alterDateDayPickerVisible, setAlterDateDayPickerVisible] = useState(false);
  const [alterDateMonthPickerVisible, setAlterDateMonthPickerVisible] = useState(false);

  const handleOpportunityPress = useCallback(
    (navigation, opportunity) => {
      navigation.navigate('CrmConversation', { opportunity });
    },
    [],
  );

  const handleEditOpportunity = opportunity => {
    const dueDateComponents = parseDateComponents(opportunity.dueDate);
    const alterDateComponents = parseDateComponents(opportunity.alterDate);
    const phones = parsePhoneNumbers(opportunity.announce);
    const todayComponents = getCurrentDateComponents();
    setEditingOpportunity({
      ...opportunity,
      dueDate: opportunity.dueDate ? formatDateForInput(opportunity.dueDate) : '',
      alterDate: opportunity.alterDate ? formatDateForInput(opportunity.alterDate) : '',
      dueDateDay: dueDateComponents.day || todayComponents.day,
      dueDateMonth: dueDateComponents.month || todayComponents.month,
      dueDateYear: dueDateComponents.year || todayComponents.year,
      alterDateDay: alterDateComponents.day,
      alterDateMonth: alterDateComponents.month,
      alterDateYear: alterDateComponents.year,
      announce: opportunity.announce || '',
      phones,
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
      const validPhones = (editingOpportunity.phones || [])
        .map(phone => sanitizePhoneValue(phone))
        .filter(Boolean);

      if (hasDuplicatePhones(validPhones)) {
        showError(global.t?.t('people', 'toast', 'duplicatePhone'));
        return;
      }

      await opportunitiesActions.save({
        id: editingOpportunity.id,
        client: normalizePeopleReferenceValue(editingOpportunity?.client),
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
        dueDate,
        alterDate,
        announce: validPhones.length > 0 ? JSON.stringify(validPhones) : '',
        provider_id: currentCompany.id,
      });

      setEditModalVisible(false);
      setEditingOpportunity(null);
      showSuccess(global.t?.t('people', 'toast', 'opportunityUpdated'));
    } catch (error) {
      console.error('Erro ao salvar:', error);
      showError(global.t?.t('people', 'toast', 'saveChangesError'));
    }
  };

  const validateNewOpportunity = () => {
    const clientId = normalizePeopleReferenceValue(newOpportunity?.client);
    const taskStatusId =
      newOpportunity?.taskStatus?.['@id'] || newOpportunity?.taskStatus?.id;
    const categoryId =
      newOpportunity?.category?.['@id'] || newOpportunity?.category?.id;
    const criticalityId =
      newOpportunity?.criticality?.['@id'] || newOpportunity?.criticality?.id;
    const reasonId = newOpportunity?.reason?.['@id'] || newOpportunity?.reason?.id;
    const dueDateDay = newOpportunity?.dueDateDay;
    const dueDateMonth = newOpportunity?.dueDateMonth;
    const dueDateYear = (newOpportunity?.dueDateYear || '').trim();
    const missingFields = [];

    if (!clientId) missingFields.push(global.t?.t('people', 'required', 'provider'));
    if (!taskStatusId) missingFields.push(global.t?.t('people', 'required', 'status'));
    if (!categoryId) missingFields.push(global.t?.t('people', 'required', 'category'));
    if (!criticalityId) missingFields.push(global.t?.t('people', 'required', 'criticality'));
    if (!reasonId) missingFields.push(global.t?.t('people', 'required', 'leadSource'));
    if (!dueDateDay || !dueDateMonth || !dueDateYear) {
      missingFields.push(global.t?.t('people', 'required', 'returnDate'));
    }

    return {
      categoryId,
      clientId,
      criticalityId,
      dueDateDay,
      dueDateMonth,
      dueDateYear,
      missingFields,
      reasonId,
      taskStatusId,
    };
  };

  const handleSaveNewOpportunity = async () => {
    try {
      const data = validateNewOpportunity();
      if (data.missingFields.length > 0) {
        showError(
          `${global.t?.t('people', 'toast', 'requiredFieldsPrefix')} ${data.missingFields.join(', ')}.`,
        );
        return;
      }

      if (!/^\d{4}$/.test(data.dueDateYear)) {
        showError(global.t?.t('people', 'toast', 'invalidDueYear'));
        return;
      }

      const dueDate = formatDateFromComponents(
        data.dueDateDay,
        data.dueDateMonth,
        data.dueDateYear,
      );
      const dueDateObj = new Date(`${dueDate}T00:00:00`);
      const isValidDueDate =
        dueDate &&
        !Number.isNaN(dueDateObj.getTime()) &&
        String(dueDateObj.getDate()).padStart(2, '0') === data.dueDateDay &&
        String(dueDateObj.getMonth() + 1).padStart(2, '0') === data.dueDateMonth &&
        String(dueDateObj.getFullYear()) === data.dueDateYear;

      if (!isValidDueDate) {
        showError(global.t?.t('people', 'toast', 'invalidReturnDate'));
        return;
      }

      const validPhones = (newOpportunity?.phones || [])
        .map(phone => sanitizePhoneValue(phone))
        .filter(Boolean);

      if (hasDuplicatePhones(validPhones)) {
        showError(global.t?.t('people', 'toast', 'duplicatePhone'));
        return;
      }

      await opportunitiesActions.save({
        client: data.clientId,
        registeredBy: data.clientId,
        taskStatus: data.taskStatusId,
        category: data.categoryId,
        criticality: data.criticalityId,
        reason: data.reasonId,
        type: 'relationship',
        dueDate,
        announce: validPhones.length > 0 ? JSON.stringify(validPhones) : '',
        provider: `/people/${currentCompany.id}`,
      });

      setAddModalVisible(false);
      setNewOpportunity(null);
      showSuccess(global.t?.t('people', 'toast', 'opportunityCreated'));

      const params = buildOpportunityParams({ page: 1 });
      if (params) {
        opportunitiesActions.getItems(params);
      }
      setCurrentPage(1);
    } catch (error) {
      console.error('Erro ao criar:', error);
      showError(global.t?.t('people', 'toast', 'createOpportunityError'));
    }
  };

  const addPhoneInput = (isEdit = true) => {
    const setter = isEdit ? setEditingOpportunity : setNewOpportunity;
    setter(prev => ({
      ...prev,
      phones: [...(prev.phones || []), ''],
    }));
  };

  const removePhoneInput = (index, isEdit = true) => {
    const setter = isEdit ? setEditingOpportunity : setNewOpportunity;
    setter(prev => ({
      ...prev,
      phones: prev.phones.filter((_, i) => i !== index),
    }));
  };

  const updatePhoneInput = (index, value, isEdit = true) => {
    const setter = isEdit ? setEditingOpportunity : setNewOpportunity;
    const maskedValue = formatPhoneValue(value);
    setter(prev => ({
      ...prev,
      phones: prev.phones.map((phone, i) => (i === index ? maskedValue : phone)),
    }));
  };

  const openAddOpportunity = () => {
    const todayComponents = getCurrentDateComponents();
    setNewOpportunity({
      phones: [],
      dueDateDay: todayComponents.day,
      dueDateMonth: todayComponents.month,
      dueDateYear: todayComponents.year,
    });
    setAddModalVisible(true);
  };

  return {
    addModalVisible,
    addPhoneInput,
    alterDateDayPickerVisible,
    alterDateMonthPickerVisible,
    categoryPickerVisible,
    criticalityPickerVisible,
    dueDateDayPickerVisible,
    dueDateMonthPickerVisible,
    editModalVisible,
    editingOpportunity,
    handleEditOpportunity,
    handleOpportunityPress,
    handleSaveEdit,
    handleSaveNewOpportunity,
    newOpportunity,
    openAddOpportunity,
    reasonPickerVisible,
    removePhoneInput,
    setAddModalVisible,
    setAlterDateDayPickerVisible,
    setAlterDateMonthPickerVisible,
    setCategoryPickerVisible,
    setCriticalityPickerVisible,
    setDueDateDayPickerVisible,
    setDueDateMonthPickerVisible,
    setEditModalVisible,
    setEditingOpportunity,
    setNewOpportunity,
    setReasonPickerVisible,
    setStatusPickerVisible,
    statusPickerVisible,
    updatePhoneInput,
  };
};

export default useOpportunityForms;
