import React, {useCallback, useEffect, useState} from 'react';
import {Text, TextInput, TouchableOpacity, View} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';

import css from '@controleonline/ui-orders/src/react/css/orders';
import Formatter from '@controleonline/ui-common/src/utils/formatter';

import localStyles from '../GeneralSettings.styles';
import GeneralSettingsSection from '../GeneralSettingsSection';
import {
  DEFAULT_AFTER_SALES_PROFILES,
  GENERAL_SETTINGS_PICKER_MODE,
  normalizeProfiles,
  useGeneralSettingsConfig,
} from '../GeneralSettings.shared';

const CrmSection = () => {
  const {styles, globalStyles} = css();
  const {currentCompany, effectiveCompanyConfigs, isSaving, saveConfig} =
    useGeneralSettingsConfig();

  const [strategy, setStrategy] = useState('random');
  const [maxTasks, setMaxTasks] = useState('10');
  const [revenuePeriod, setRevenuePeriod] = useState('90');
  const [profiles, setProfiles] = useState(DEFAULT_AFTER_SALES_PROFILES);
  const [editingRevenueIndex, setEditingRevenueIndex] = useState(null);
  const [editingRevenueValue, setEditingRevenueValue] = useState('');

  useEffect(() => {
    setStrategy(
      String(
        effectiveCompanyConfigs['salesman-distribution-strategy'] || 'random',
      ),
    );
    setMaxTasks(String(effectiveCompanyConfigs['salesman-max-tasks'] || '10'));
    setRevenuePeriod(
      String(effectiveCompanyConfigs['after-sales-revenue-period'] || '90'),
    );
    setProfiles(normalizeProfiles(effectiveCompanyConfigs['after-sales-profiles']));
  }, [effectiveCompanyConfigs]);

  const saveProfiles = useCallback(() => {
    saveConfig('after-sales-profiles', profiles);
  }, [profiles, saveConfig]);

  const addProfile = useCallback(() => {
    setProfiles(current => [...current, {maxRevenue: 0, days: 30}]);
  }, []);

  const updateProfile = useCallback((index, key, value) => {
    setProfiles(current => {
      const copy = [...current];
      copy[index] = {
        ...copy[index],
        [key]: value,
      };
      return copy;
    });
  }, []);

  const removeProfile = useCallback(index => {
    setProfiles(current => current.filter((_, profileIndex) => profileIndex !== index));
  }, []);

  const formatRevenueDisplay = value => Formatter.formatMoney(value || 0);

  const formatRevenueEditValue = value => {
    if (value === null || value === undefined) {
      return '';
    }

    return String(value).replace('.', ',');
  };

  const handleRevenueFocus = (index, value) => {
    setEditingRevenueIndex(index);
    setEditingRevenueValue(formatRevenueEditValue(value));
  };

  const handleRevenueChange = value => {
    setEditingRevenueValue(value);
  };

  const handleRevenueBlur = index => {
    updateProfile(
      index,
      'maxRevenue',
      Formatter.formatFloat(editingRevenueValue),
    );
    setEditingRevenueIndex(null);
    setEditingRevenueValue('');
  };

  const formatDaysDisplay = value => {
    const days = parseInt(value, 10) || 0;
    return `${days} dias`;
  };

  return (
    <GeneralSettingsSection
      description="Configuracoes comerciais e regras de distribuicao de atendimento."
      icon="groups"
      iconBackgroundColor="#EDE9FE"
      iconColor="#7C3AED"
      title="CRM">
      <View style={localStyles.fieldBlock}>
        <Text style={localStyles.fieldLabel}>
          {global.t?.t('configs', 'label', 'salesmanDistributionStrategy')}
        </Text>

        <Picker
          selectedValue={strategy}
          mode={GENERAL_SETTINGS_PICKER_MODE}
          onValueChange={value => {
            setStrategy(value);
            saveConfig('salesman-distribution-strategy', value);
          }}
          style={styles.Settings.picker}>
          <Picker.Item
            label={global.t?.t('configs', 'option', 'random')}
            value="random"
          />
          <Picker.Item
            label={global.t?.t('configs', 'option', 'roundRobin')}
            value="round_robin"
          />
          <Picker.Item
            label={global.t?.t('configs', 'option', 'leastClients')}
            value="least_clients"
          />
          <Picker.Item
            label={global.t?.t('configs', 'option', 'lastReceived')}
            value="last_received"
          />
        </Picker>
      </View>

      <View style={localStyles.fieldBlock}>
        <Text style={localStyles.fieldLabel}>
          {global.t?.t('configs', 'label', 'maxTasksPerSalesman')}
        </Text>

        <TextInput
          style={localStyles.input}
          value={maxTasks}
          keyboardType="numeric"
          onChangeText={setMaxTasks}
          onBlur={() => saveConfig('salesman-max-tasks', maxTasks)}
        />
      </View>

      <View style={localStyles.fieldBlock}>
        <Text style={localStyles.fieldLabel}>
          {global.t?.t('configs', 'label', 'revenuePeriod')}
        </Text>

        <TextInput
          style={localStyles.input}
          value={revenuePeriod}
          keyboardType="numeric"
          onChangeText={setRevenuePeriod}
          onBlur={() => saveConfig('after-sales-revenue-period', revenuePeriod)}
        />
      </View>

      <View style={localStyles.fieldBlock}>
        <Text style={localStyles.fieldLabel}>
          {global.t?.t('configs', 'label', 'afterSalesProfiles')}
        </Text>

        {profiles.map((profile, index) => (
          <View key={index} style={localStyles.profileRow}>
            <TextInput
              style={[localStyles.input, localStyles.profileInput]}
              keyboardType="decimal-pad"
              value={
                editingRevenueIndex === index
                  ? editingRevenueValue
                  : formatRevenueDisplay(profile.maxRevenue)
              }
              placeholder={global.t?.t(
                'configs',
                'placeholder',
                'revenueAbove',
              )}
              onFocus={() => handleRevenueFocus(index, profile.maxRevenue)}
              onChangeText={handleRevenueChange}
              onBlur={() => handleRevenueBlur(index)}
            />

            <TextInput
              style={[
                localStyles.input,
                localStyles.profileInput,
                localStyles.profileInputSpacing,
              ]}
              keyboardType="numeric"
              value={formatDaysDisplay(profile.days)}
              placeholder="Dias"
              onChangeText={value =>
                updateProfile(
                  index,
                  'days',
                  parseInt(Formatter.onlyNumbers(value), 10) || 0,
                )
              }
            />

            <TouchableOpacity
              onPress={() => removeProfile(index)}
              style={localStyles.removeProfileButton}>
              <Icon name="delete" size={22} color="#DC2626" />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          style={[
            globalStyles.button,
            localStyles.primaryButton,
            (!currentCompany?.id || isSaving) && localStyles.primaryButtonDisabled,
          ]}
          disabled={!currentCompany?.id || isSaving}
          onPress={addProfile}>
          <Text style={localStyles.primaryButtonText}>
            {global.t?.t('configs', 'button', 'addProfile')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            globalStyles.button,
            localStyles.secondaryButton,
            (!currentCompany?.id || isSaving) && localStyles.primaryButtonDisabled,
          ]}
          disabled={!currentCompany?.id || isSaving}
          onPress={saveProfiles}>
          <Text style={localStyles.primaryButtonText}>
            {global.t?.t('configs', 'button', 'saveProfiles')}
          </Text>
        </TouchableOpacity>
      </View>
    </GeneralSettingsSection>
  );
};

export default CrmSection;
