import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getPeopleDisplayName } from '@controleonline/ui-common/src/react/utils/peopleDisplay';
import styles from './CreateProposalsModal.styles';

const { MONTHS } = require('../../utils/proposalCreateHelpers');

export const ModelSelectModal = ({
  visible,
  onClose,
  loadingModels,
  contractModels,
  selectedModel,
  onSelect,
}) => (
  <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
    <View style={styles.pickerModalOverlay}>
      <View style={styles.pickerModalContent}>
        <View style={styles.pickerModalHeader}>
          <Text style={styles.pickerModalTitle}>Selecionar modelo da proposta</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color="#666666" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.pickerModalBody}>
          {loadingModels ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Carregando modelos...</Text>
            </View>
          ) : contractModels.length > 0 ? (
            contractModels.map(model => (
              <TouchableOpacity
                key={model['@id']}
                style={[styles.selectOption, selectedModel === model['@id'] && styles.selectOptionActive]}
                onPress={() => onSelect(model['@id'])}>
                <View style={styles.optionInfo}>
                  <View style={styles.iconContainer}>
                    <Icon name="description" size={20} color="#2529a1" />
                  </View>
                  <Text
                    style={[
                      styles.optionName,
                      selectedModel === model['@id'] && styles.selectOptionTextActive,
                    ]}>
                    {model.model || model.name || 'Modelo'}
                  </Text>
                </View>
                {selectedModel === model['@id'] && (
                  <Icon name="check-circle" size={24} color="#10b981" />
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Icon name="description" size={48} color="#CCCCCC" />
              <Text style={styles.emptyText}>Nenhum modelo encontrado.</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

export const ClientSelectModal = ({
  visible,
  onClose,
  people,
  selectedClient,
  onSelect,
}) => (
  <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
    <View style={styles.pickerModalOverlay}>
      <View style={styles.pickerModalContent}>
        <View style={styles.pickerModalHeader}>
          <Text style={styles.pickerModalTitle}>Selecionar responsavel do cliente</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color="#666666" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.pickerModalBody}>
          {people.length > 0 ? (
            people.map(person => (
              <TouchableOpacity
                key={person['@id']}
                style={[
                  styles.selectOption,
                  selectedClient === person['@id'] && styles.selectOptionActive,
                ]}
                onPress={() => onSelect(person['@id'])}>
                <View style={styles.optionInfo}>
                  <View style={styles.iconContainer}>
                    <Icon name="person" size={20} color="#2529a1" />
                  </View>
                  <Text
                    style={[
                      styles.optionName,
                      selectedClient === person['@id'] && styles.selectOptionTextActive,
                    ]}>
                    {getPeopleDisplayName(person)}
                  </Text>
                </View>
                {selectedClient === person['@id'] && (
                  <Icon name="check-circle" size={24} color="#10b981" />
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Icon name="business" size={48} color="#CCCCCC" />
              <Text style={styles.emptyText}>Nenhum cliente encontrado.</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

export const DayPickerModal = ({ visible, onClose, startDay, onSelect }) => (
  <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
    <View style={styles.pickerModalOverlay}>
      <View style={styles.pickerModalContent}>
        <View style={styles.pickerModalHeader}>
          <Text style={styles.pickerModalTitle}>Selecionar dia</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color="#666666" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.pickerModalBody}>
          {Array.from({ length: 31 }, (_, index) => index + 1).map(day => (
            <TouchableOpacity
              key={day}
              style={[styles.selectOption, startDay === String(day) && styles.selectOptionActive]}
              onPress={() => onSelect(String(day))}>
              <Text
                style={[
                  styles.optionName,
                  startDay === String(day) && styles.selectOptionTextActive,
                ]}>
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

export const MonthPickerModal = ({ visible, onClose, startMonth, onSelect }) => (
  <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
    <View style={styles.pickerModalOverlay}>
      <View style={styles.pickerModalContent}>
        <View style={styles.pickerModalHeader}>
          <Text style={styles.pickerModalTitle}>Selecionar mes</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color="#666666" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.pickerModalBody}>
          {MONTHS.map((label, index) => {
            const monthValue = String(index + 1);
            return (
              <TouchableOpacity
                key={monthValue}
                style={[
                  styles.selectOption,
                  startMonth === monthValue && styles.selectOptionActive,
                ]}
                onPress={() => onSelect(monthValue)}>
                <Text
                  style={[
                    styles.optionName,
                    startMonth === monthValue && styles.selectOptionTextActive,
                  ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  </Modal>
);
