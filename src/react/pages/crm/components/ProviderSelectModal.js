import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-animatable';
import Icon from 'react-native-vector-icons/FontAwesome';

import AnimatedModal from '@controleonline/ui-common/src/react/components/AnimatedModal';
import { colors } from '@controleonline/../../src/styles/colors';
import { formatDisplayUppercase } from '@controleonline/ui-common/src/react/utils/entityDisplay';
import { normalizePeopleReferenceValue } from '../../../utils/opportunityPeople';
import styles from '../index.styles';

const ProviderSelectModal = ({
  closeProviderPicker,
  editModalVisible,
  editingOpportunity,
  isProviderSearchLoading,
  newOpportunity,
  providerOptions,
  providerPickerVisible,
  providerSearchText,
  setEditingOpportunity,
  setNewOpportunity,
  setProviderSearchText,
}) => (
  <AnimatedModal
    visible={providerPickerVisible}
    onRequestClose={closeProviderPicker}>
    <View style={styles.selectModalContent}>
      <View style={styles.selectModalHeader}>
        <Text style={styles.selectModalTitle}>
          {global.t?.t('people', 'modal', 'selectProvider')}
        </Text>
        <TouchableOpacity
          onPress={closeProviderPicker}
          style={styles.closeButton}>
          <Icon name="times" size={20} color="#7f8c8d" />
        </TouchableOpacity>
      </View>

      <View style={styles.selectModalSearchSection}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder={global.t?.t('people', 'search', 'placeholder')}
            placeholderTextColor="#94A3B8"
            value={providerSearchText}
            onChangeText={setProviderSearchText}
          />
          {providerSearchText.length > 0 && (
            <TouchableOpacity
              onPress={() => setProviderSearchText('')}
              style={styles.clearSearchButton}>
              <Icon name="times-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.selectModalBody}>
        {isProviderSearchLoading && providerOptions.length === 0 ? (
          <View style={styles.providerSearchLoadingState}>
            <ActivityIndicator color={colors.primary} size="small" />
          </View>
        ) : providerOptions.length > 0 ? (
          providerOptions
            .filter((person, index, source) => {
              const currentRef = normalizePeopleReferenceValue(person);
              if (!currentRef) {
                return true;
              }

              return (
                source.findIndex(
                  candidate =>
                    normalizePeopleReferenceValue(candidate) === currentRef,
                ) === index
              );
            })
            .map((person, index) => {
              const selectedClientRef = normalizePeopleReferenceValue(
                editModalVisible
                  ? editingOpportunity?.client
                  : newOpportunity?.client,
              );
              const personRef = normalizePeopleReferenceValue(person);
              const personKey =
                personRef ||
                `person-${person.id || 'sem-id'}-${person.document || 'sem-doc'}-${person.name || 'sem-nome'}-${index}`;
              const isSelected =
                Boolean(selectedClientRef) &&
                Boolean(personRef) &&
                selectedClientRef === personRef;

              return (
                <TouchableOpacity
                  key={personKey}
                  style={[
                    styles.selectOption,
                    isSelected && styles.selectOptionActive,
                  ]}
                  onPress={() => {
                    const clientData = {
                      '@id': personRef || person['@id'] || '',
                      id: person.id ?? personRef,
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
                    closeProviderPicker();
                  }}>
                  <View style={styles.personInfo}>
                    <View style={styles.avatarContainer}>
                      <Icon name="user" size={20} color="#3498db" />
                    </View>
                    <View style={styles.personDetails}>
                      <Text
                        style={[
                          styles.personAlias,
                          isSelected && styles.selectOptionTextActive,
                        ]}>
                        {formatDisplayUppercase(person.alias)}
                      </Text>
                      <Text style={styles.personName}>
                        {person.peopleType === 'J' ? ' (PJ)' : ' (PF)'}{' '}
                        {formatDisplayUppercase(person.name)}
                      </Text>
                    </View>
                  </View>
                  {isSelected && (
                    <Icon name="check-circle" size={20} color="#10b981" />
                  )}
                </TouchableOpacity>
              );
            })
        ) : (
          <View style={styles.emptyState}>
            <Icon name="user" size={48} color="#bdc3c7" />
            <Text style={styles.emptyText}>
              {global.t?.t('people', 'empty', 'noProviderFound')}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  </AnimatedModal>
);

export default ProviderSelectModal;
