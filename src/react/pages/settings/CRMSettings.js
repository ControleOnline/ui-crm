import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';

import css from '@controleonline/ui-orders/src/react/css/orders';
import Formatter from '@controleonline/ui-common/src/utils/formatter';
import { useStore } from '@store';

const CRMSettings = () => {

  const { styles, globalStyles } = css();

  const peopleStore = useStore('people');
  const { currentCompany } = peopleStore.getters;

  const configsStore = useStore('configs');
  const { items: companyConfigs, isSaving } = configsStore.getters;
  const configActions = configsStore.actions;

  const [strategy, setStrategy] = useState('random');
  const [maxTasks, setMaxTasks] = useState('10');
  const [revenuePeriod, setRevenuePeriod] = useState('90');
  const [profiles, setProfiles] = useState([]);
  const [editingRevenueIndex, setEditingRevenueIndex] = useState(null);
  const [editingRevenueValue, setEditingRevenueValue] = useState('');

  const pickerMode = 'dropdown';

  useEffect(() => {

    if (!companyConfigs) return;

    setStrategy(companyConfigs['salesman-distribution-strategy'] || 'random');
    setMaxTasks(companyConfigs['salesman-max-tasks'] || '10');
    setRevenuePeriod(companyConfigs['after-sales-revenue-period'] || '90');

    try {

      const p = companyConfigs['after-sales-profiles'];

      if (p) {

        const parsed = typeof p === 'string' ? JSON.parse(p) : p;

        setProfiles(parsed);

      } else {

        setProfiles([
          { maxRevenue: 10000, days: 30 },
          { maxRevenue: 1000, days: 60 },
          { maxRevenue: 0, days: 120 }
        ]);

      }

    } catch {

      setProfiles([]);

    }

  }, [companyConfigs]);



  const saveConfig = (key, value) => {

    configActions.addConfigs({
      configKey: key,
      configValue: value,
      people: '/people/' + currentCompany.id,
      module: 4,
      visibility: 'public'
    }).catch(err => {

      Alert.alert(
        'Erro',
        err?.message || JSON.stringify(err)
      );

    });

  };



  const saveProfiles = () => {

    saveConfig(
      'after-sales-profiles',
      JSON.stringify(profiles)
    );

  };



  const addProfile = () => {

    setProfiles([
      ...profiles,
      { maxRevenue: 0, days: 30 }
    ]);

  };



  const updateProfile = (index, key, value) => {

    const copy = [...profiles];

    copy[index][key] = value;

    setProfiles(copy);

  };



  const removeProfile = (index) => {

    const copy = profiles.filter((_, i) => i !== index);

    setProfiles(copy);

  };

  const formatRevenueDisplay = (value) => {
    return Formatter.formatMoney(value || 0);
  };

  const formatRevenueEditValue = (value) => {
    if (value === null || value === undefined)
      return '';

    return String(value).replace('.', ',');
  };

  const handleRevenueFocus = (index, value) => {
    setEditingRevenueIndex(index);
    setEditingRevenueValue(formatRevenueEditValue(value));
  };

  const handleRevenueChange = (value) => {
    setEditingRevenueValue(value);
  };

  const handleRevenueBlur = (index) => {
    updateProfile(index, 'maxRevenue', Formatter.formatFloat(editingRevenueValue));
    setEditingRevenueIndex(null);
    setEditingRevenueValue('');
  };

  const formatDaysDisplay = (value) => {
    const days = parseInt(value, 10) || 0;
    return `${days} dias`;
  };



  return (

    <SafeAreaView style={styles.Settings.container}>

      <ScrollView
        contentContainerStyle={styles.Settings.scrollContent}
      >

        <View style={styles.Settings.mainContainer}>

          <Text style={styles.Settings.title}>
            {global.t?.t('configs','title','crmSettings')}
          </Text>



          {/* DISTRIBUTION STRATEGY */}

          <View style={{ marginTop: 20 }}>

            <Text style={styles.Settings.label}>
              {global.t?.t('configs','label','salesmanDistributionStrategy')}
            </Text>

            <Picker
              selectedValue={strategy}
              mode={pickerMode}
              onValueChange={(v) => {
                setStrategy(v);
                saveConfig(
                  'salesman-distribution-strategy',
                  v
                );
              }}
              style={styles.Settings.picker}
            >

              <Picker.Item label={global.t?.t('configs','option','random')} value="random" />

              <Picker.Item label={global.t?.t('configs','option','roundRobin')} value="round_robin" />

              <Picker.Item label={global.t?.t('configs','option','leastClients')} value="least_clients" />

              <Picker.Item label={global.t?.t('configs','option','lastReceived')} value="last_received" />

            </Picker>

          </View>



          {/* MAX TASKS */}

          <View style={{ marginTop: 20 }}>

            <Text style={styles.Settings.label}>
              {global.t?.t('configs','label','maxTasksPerSalesman')}
            </Text>

            <TextInput
              style={styles.Settings.input}
              value={maxTasks}
              keyboardType="numeric"
              onChangeText={(v) => setMaxTasks(v)}
              onBlur={() => saveConfig(
                'salesman-max-tasks',
                maxTasks
              )}
            />

          </View>



          {/* REVENUE PERIOD */}

          <View style={{ marginTop: 20 }}>

            <Text style={styles.Settings.label}>
              {global.t?.t('configs','label','revenuePeriod')}
            </Text>

            <TextInput
              style={styles.Settings.input}
              value={revenuePeriod}
              keyboardType="numeric"
              onChangeText={setRevenuePeriod}
              onBlur={() => saveConfig(
                'after-sales-revenue-period',
                revenuePeriod
              )}
            />

          </View>



          {/* AFTER SALES PROFILES */}

          <View style={{ marginTop: 30 }}>

            <Text style={styles.Settings.label}>
              {global.t?.t('configs','label','afterSalesProfiles')}
            </Text>

            {

              profiles.map((p, index) => (

                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 10
                  }}
                >

                  <TextInput
                    style={[
                      styles.Settings.input,
                      { flex: 1 }
                    ]}
                    keyboardType="decimal-pad"
                    value={editingRevenueIndex === index
                      ? editingRevenueValue
                      : formatRevenueDisplay(p.maxRevenue)}
                    placeholder={global.t?.t('configs','placeholder','revenueAbove')}
                    onFocus={() => handleRevenueFocus(index, p.maxRevenue)}
                    onChangeText={handleRevenueChange}
                    onBlur={() => handleRevenueBlur(index)}
                  />

                  <TextInput
                    style={[
                      styles.Settings.input,
                      { flex: 1, marginLeft: 10 }
                    ]}
                    keyboardType="numeric"
                    value={formatDaysDisplay(p.days)}
                    placeholder="Days"
                    onChangeText={(v) =>
                      updateProfile(index, 'days', parseInt(Formatter.onlyNumbers(v), 10) || 0)
                    }
                  />

                  <TouchableOpacity
                    onPress={() => removeProfile(index)}
                    style={{ marginLeft: 10 }}
                  >

                    <Icon
                      name="delete"
                      size={24}
                      color="red"
                    />

                  </TouchableOpacity>

                </View>

              ))

            }

            <TouchableOpacity
              style={[
                globalStyles.button,
                { marginTop: 15 }
              ]}
              onPress={addProfile}
            >

              <Text style={{ color: '#fff' }}>
                {global.t?.t('configs','button','addProfile')}
              </Text>

            </TouchableOpacity>

            <TouchableOpacity
              style={[
                globalStyles.button,
                { marginTop: 10 }
              ]}
              onPress={saveProfiles}
            >

              <Text style={{ color: '#fff' }}>
                {global.t?.t('configs','button','saveProfiles')}
              </Text>

            </TouchableOpacity>

          </View>



          {isSaving && (

            <ActivityIndicator
              size="large"
              style={{ marginTop: 20 }}
            />

          )}

        </View>

      </ScrollView>

    </SafeAreaView>

  );

};

export default CRMSettings;