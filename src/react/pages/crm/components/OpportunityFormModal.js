import React from 'react';
import { ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-animatable';
import Icon from 'react-native-vector-icons/FontAwesome';

import AnimatedModal from '@controleonline/ui-common/src/react/components/AnimatedModal';
import { formatPhoneValue } from '../../../utils/opportunityPhone';
import { getMonthsArray } from '../../../utils/opportunityDate';
import styles from '../index.styles';

const PhoneInputs = ({ isEdit, onAdd, onRemove, onUpdate, phones = [] }) => (
  <View style={styles.phoneInputsContainer}>
    {phones.length === 0 && (
      <TouchableOpacity
        style={styles.addPhoneButton}
        onPress={() => onAdd(isEdit)}>
        <Icon name="plus" size={16} color="#10b981" />
        <Text style={styles.addPhoneText}>
          {global.t?.t('people', 'action', 'addPhone')}
        </Text>
      </TouchableOpacity>
    )}

    {phones.map((phone, index) => (
      <View key={index} style={styles.phoneInputRow}>
        <TextInput
          style={[styles.textInput, styles.phoneInput]}
          value={phone}
          onChangeText={text => onUpdate(index, text, isEdit)}
          placeholder="(11) 99999-9999"
          placeholderTextColor="#6c757d"
          keyboardType="phone-pad"
          maxLength={15}
        />
        <TouchableOpacity
          style={styles.removePhoneButton}
          onPress={() => onRemove(index, isEdit)}>
          <Icon name="trash" size={16} color="#c10015" />
        </TouchableOpacity>
      </View>
    ))}

    {phones.length > 0 && (
      <TouchableOpacity
        style={styles.addPhoneButton}
        onPress={() => onAdd(isEdit)}>
        <Icon name="plus" size={16} color="#10b981" />
        <Text style={styles.addPhoneText}>
          {global.t?.t('people', 'action', 'addAnotherPhone')}
        </Text>
      </TouchableOpacity>
    )}
  </View>
);

const SelectButton = ({ children, iconName, onPress }) => (
  <TouchableOpacity style={styles.selectButton} onPress={onPress}>
    <View style={styles.selectButtonContent}>
      {iconName && (
        <Icon
          name={iconName}
          size={16}
          color="#3498db"
          style={styles.selectButtonIcon}
        />
      )}
      {children}
    </View>
    <Icon name="chevron-down" size={16} color="#7f8c8d" />
  </TouchableOpacity>
);

const OpportunityFormModal = ({
  isEdit,
  isQuestionLikeIcon,
  isValidFontAwesomeIcon,
  getProviderName,
  getStatusFilterLabel,
  onAddPhone,
  onClose,
  onRemovePhone,
  onSave,
  onUpdatePhone,
  opportunity,
  setCategoryPickerVisible,
  setCriticalityPickerVisible,
  setDueDateDayPickerVisible,
  setDueDateMonthPickerVisible,
  setOpportunity,
  setProviderPickerVisible,
  setReasonPickerVisible,
  setStatusPickerVisible,
  visible,
}) => {
  const setField = (field, value) => {
    setOpportunity(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const reasonIcon = opportunity?.reason?.icon;
  const showReasonIcon =
    reasonIcon &&
    isValidFontAwesomeIcon(reasonIcon) &&
    !isQuestionLikeIcon(reasonIcon);

  return (
    <AnimatedModal visible={visible} onRequestClose={onClose}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {isEdit
              ? global.t?.t('people', 'modal', 'editOpportunity')
              : global.t?.t('people', 'modal', 'newOpportunity')}
            {isEdit ? opportunity?.id : ''}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="times" size={20} color="#7f8c8d" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalBody}>
          <View style={styles.editSection}>
            <Text style={styles.editLabel}>
              {global.t?.t('people', 'form', 'provider')}
            </Text>
            <SelectButton
              iconName="user"
              onPress={() => setProviderPickerVisible(true)}>
              <Text style={styles.selectButtonText}>
                {getProviderName(opportunity?.client) ||
                  global.t?.t('people', 'form', 'selectProvider')}
              </Text>
            </SelectButton>
          </View>

          <View style={styles.editSection}>
            <Text style={styles.editLabel}>
              {global.t?.t('people', 'form', 'status')}
            </Text>
            <SelectButton onPress={() => setStatusPickerVisible(true)}>
              {opportunity?.taskStatus?.color && (
                <View
                  style={[
                    styles.selectButtonDot,
                    { backgroundColor: opportunity.taskStatus.color },
                  ]}
                />
              )}
              <Text style={styles.selectButtonText}>
                {getStatusFilterLabel(opportunity?.taskStatus) ||
                  global.t?.t('people', 'form', 'selectStatus')}
              </Text>
            </SelectButton>
          </View>

          <View style={styles.editSection}>
            <Text style={styles.editLabel}>
              {global.t?.t('people', 'form', 'category')}
            </Text>
            <SelectButton onPress={() => setCategoryPickerVisible(true)}>
              <Text style={styles.selectButtonText}>
                {opportunity?.category?.name ||
                  global.t?.t('people', 'form', 'selectCategory')}
              </Text>
            </SelectButton>
          </View>

          <View style={styles.editSection}>
            <Text style={styles.editLabel}>
              {global.t?.t('people', 'form', 'criticality')}
            </Text>
            <SelectButton onPress={() => setCriticalityPickerVisible(true)}>
              <Text style={styles.selectButtonText}>
                {opportunity?.criticality?.name ||
                  global.t?.t('people', 'form', 'selectCriticality')}
              </Text>
            </SelectButton>
          </View>

          <View style={styles.editSection}>
            <Text style={styles.editLabel}>
              {global.t?.t('people', 'form', 'leadSource')}
            </Text>
            <SelectButton onPress={() => setReasonPickerVisible(true)}>
              {showReasonIcon && (
                <Icon
                  name={reasonIcon}
                  size={16}
                  color="#9b59b6"
                  style={styles.selectButtonIcon}
                />
              )}
              <Text style={styles.selectButtonText}>
                {opportunity?.reason?.name ||
                  global.t?.t('people', 'form', 'selectReason')}
              </Text>
            </SelectButton>
          </View>

          <View style={styles.editSection}>
            <Text style={styles.editLabel}>
              {global.t?.t('people', 'form', 'phones')}
            </Text>
            <PhoneInputs
              isEdit={isEdit}
              onAdd={onAddPhone}
              onRemove={onRemovePhone}
              onUpdate={onUpdatePhone}
              phones={opportunity?.phones || []}
            />
          </View>

          <View style={styles.editSection}>
            <Text style={styles.editLabel}>
              {global.t?.t('people', 'form', 'returnDate')}
            </Text>
            <View style={styles.datePickerContainer}>
              <TouchableOpacity
                style={[styles.dateSelectButton, { flex: 1 }]}
                onPress={() => setDueDateDayPickerVisible(true)}>
                <Text style={styles.dateSelectText}>
                  {opportunity?.dueDateDay ||
                    global.t?.t('people', 'form', 'day')}
                </Text>
                <Icon name="chevron-down" size={16} color="#7f8c8d" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dateSelectButton, { flex: 2 }]}
                onPress={() => setDueDateMonthPickerVisible(true)}>
                <Text style={styles.dateSelectText}>
                  {opportunity?.dueDateMonth
                    ? getMonthsArray().find(
                        m => m.id === opportunity.dueDateMonth,
                      )?.name
                    : global.t?.t('people', 'form', 'month')}
                </Text>
                <Icon name="chevron-down" size={16} color="#7f8c8d" />
              </TouchableOpacity>

              <TextInput
                style={[styles.dateSelectButton, styles.yearInput, { flex: 1 }]}
                value={opportunity?.dueDateYear || ''}
                onChangeText={text => setField('dueDateYear', text)}
                placeholder={global.t?.t('people', 'form', 'year')}
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
            onPress={onClose}>
            <Text style={styles.cancelButtonText}>
              {global.t?.t('people', 'action', 'cancel')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, styles.saveButton]}
            onPress={onSave}>
            <Text style={styles.saveButtonText}>
              {isEdit
                ? global.t?.t('people', 'action', 'save')
                : global.t?.t('people', 'action', 'create')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </AnimatedModal>
  );
};

export default OpportunityFormModal;
