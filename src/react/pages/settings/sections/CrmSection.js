import React, {useCallback, useEffect, useState} from 'react';
import {Text, TextInput, TouchableOpacity, View} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {useStore} from '@store';
import css from '@controleonline/ui-orders/src/react/css/orders';
import Formatter from '@controleonline/ui-common/src/utils/formatter';
import {colors as defaultThemeColors} from '@controleonline/../../src/styles/colors';
import {resolveThemePalette, withOpacity} from '@controleonline/../../src/styles/branding';

import localStyles from '../GeneralSettings.styles';
import GeneralSettingsSection from '../GeneralSettingsSection';
import {
  DEFAULT_AFTER_SALES_PROFILES,
  GENERAL_SETTINGS_PICKER_MODE,
  normalizeProfiles,
  useGeneralSettingsConfig,
} from '../GeneralSettings.shared';

const CrmSection = () => {
  const themeStore = useStore('theme');
  const {styles, globalStyles} = css();
  const {currentCompany, effectiveCompanyConfigs, isSaving, saveConfig} =
    useGeneralSettingsConfig();
  const themePalette = resolveThemePalette(
    themeStore.getters.colors,
    defaultThemeColors,
  );

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

  const saveProfiles = useCallback(
    nextProfiles => {
      const value = Array.isArray(nextProfiles) ? nextProfiles : profiles;
      return saveConfig('after-sales-profiles', value);
    },
    [profiles, saveConfig],
  );

  const addProfile = useCallback(() => {
    const nextProfiles = [...profiles, {maxRevenue: 0, days: 30}];

    setProfiles(nextProfiles);
    saveProfiles(nextProfiles);
  }, [profiles, saveProfiles]);

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
    const nextProfiles = profiles.filter(
      (_, profileIndex) => profileIndex !== index,
    );

    setProfiles(nextProfiles);
    saveProfiles(nextProfiles);
  }, [profiles, saveProfiles]);

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
    const nextProfiles = profiles.map((profile, profileIndex) =>
      profileIndex === index
        ? {
            ...profile,
            maxRevenue: Formatter.formatFloat(editingRevenueValue),
          }
        : profile,
    );

    setProfiles(nextProfiles);
    setEditingRevenueIndex(null);
    setEditingRevenueValue('');
    saveProfiles(nextProfiles);
  };

  const formatDaysDisplay = value => {
    const days = parseInt(value, 10) || 0;
    return `${days} dias`;
  };

  return (
    <GeneralSettingsSection
      description="Configuracoes comerciais e regras de distribuicao de atendimento."
      icon="groups"
      iconBackgroundColor={withOpacity(themePalette.primary, 0.12)}
      iconColor={themePalette.primary}
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
              onBlur={() => saveProfiles()}
            />

            <TouchableOpacity
              onPress={() => removeProfile(index)}
              style={localStyles.removeProfileButton}>
              <Icon name="delete" size={22} color={themePalette.error} />
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

      </View>
    </GeneralSettingsSection>
  );
};

export default CrmSection;
