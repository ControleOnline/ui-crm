import React, {useCallback, useEffect, useState} from 'react';
import {Switch, Text, TextInput, TouchableOpacity, View} from 'react-native';

import css from '@controleonline/ui-orders/src/react/css/orders';
import useToastMessage from '@controleonline/ui-crm/src/react/hooks/useToastMessage';
import {
  isLikelyCronExpression,
  MAINTENANCE_ROUTINES_CONFIG_KEY,
  MAINTENANCE_ROUTINE_ITEMS,
  normalizeMaintenanceRoutines,
} from '@controleonline/ui-common/src/react/utils/maintenanceSettings';

import localStyles from '../GeneralSettings.styles';
import GeneralSettingsSection from '../GeneralSettingsSection';
import {useGeneralSettingsConfig} from '../GeneralSettings.shared';

const MaintenanceSection = () => {
  const {globalStyles} = css();
  const {showError, showSuccess} = useToastMessage();
  const {
    defaultCompany,
    defaultCompanyLabel,
    hasDefaultCompanyAccess,
    isMainCompanySelected,
    isSaving,
    peopleActions,
    saveConfigs,
  } = useGeneralSettingsConfig();
  const [routines, setRoutines] = useState(
    normalizeMaintenanceRoutines(defaultCompany?.configs?.[
      MAINTENANCE_ROUTINES_CONFIG_KEY
    ]),
  );

  useEffect(() => {
    setRoutines(
      normalizeMaintenanceRoutines(
        defaultCompany?.configs?.[MAINTENANCE_ROUTINES_CONFIG_KEY],
      ),
    );
  }, [defaultCompany?.configs]);

  const editable =
    hasDefaultCompanyAccess &&
    !!defaultCompany?.id &&
    isMainCompanySelected &&
    !isSaving;

  const updateRoutine = useCallback((routineKey, patch) => {
    setRoutines(currentValue => ({
      ...currentValue,
      [routineKey]: {
        ...(currentValue[routineKey] || {}),
        ...patch,
      },
    }));
  }, []);

  const saveRoutines = useCallback(async () => {
    if (!hasDefaultCompanyAccess || !defaultCompany?.id || !isMainCompanySelected) {
      showError(
        `Abra a empresa principal (${defaultCompanyLabel}) para editar as rotinas.`,
      );
      return;
    }

    const invalidRoutine = MAINTENANCE_ROUTINE_ITEMS.find(item => {
      const cronExpression = String(
        routines?.[item.key]?.cronExpression || '',
      ).trim();

      return !isLikelyCronExpression(cronExpression);
    });

    if (invalidRoutine) {
      showError(
        `A rotina "${invalidRoutine.title}" precisa de uma expressao cron com 5 campos.`,
      );
      return;
    }

    const success = await saveConfigs({
      [MAINTENANCE_ROUTINES_CONFIG_KEY]: routines,
    });

    if (!success) {
      return;
    }

    try {
      await peopleActions.defaultCompany();
    } catch {}

    showSuccess('Rotinas de manutencao salvas com sucesso.');
  }, [
    defaultCompany?.id,
    defaultCompanyLabel,
    hasDefaultCompanyAccess,
    isMainCompanySelected,
    peopleActions,
    routines,
    saveConfigs,
    showError,
    showSuccess,
  ]);

  return (
    <GeneralSettingsSection
      description="Centraliza as rotinas tecnicas executadas pelo cron geral de manutencao."
      icon="schedule"
      iconBackgroundColor="#CCFBF1"
      iconColor="#0F766E"
      title="Rotinas de manutencao">
      <Text style={localStyles.helperText}>
        {`Essas rotinas ficam gravadas na empresa principal (${defaultCompanyLabel}) e o cron geral tenta executa-las a cada minuto.`}
      </Text>

      {!isMainCompanySelected && hasDefaultCompanyAccess && (
        <Text style={localStyles.helperText}>
          Abra a empresa principal para editar a agenda. Fora dela esta tela
          fica somente para consulta.
        </Text>
      )}

      {MAINTENANCE_ROUTINE_ITEMS.map(item => {
        const routine = routines?.[item.key] || {
          enabled: item.defaultEnabled,
          cronExpression: item.defaultCronExpression,
        };

        return (
          <View key={item.key} style={localStyles.logPolicyCard}>
            <View style={localStyles.settingRow}>
              <View style={localStyles.settingCopy}>
                <Text style={localStyles.statusLabel}>{item.title}</Text>
                <Text style={localStyles.settingDescription}>
                  {item.description}
                </Text>
              </View>
              <Switch
                value={!!routine.enabled}
                onValueChange={value =>
                  updateRoutine(item.key, {enabled: value})
                }
                disabled={!editable}
              />
            </View>

            <View style={localStyles.fieldBlock}>
              <Text style={localStyles.fieldLabel}>Expressao cron</Text>
              <TextInput
                style={[
                  localStyles.input,
                  !editable && localStyles.inputDisabled,
                ]}
                value={String(routine.cronExpression || '')}
                onChangeText={value =>
                  updateRoutine(item.key, {cronExpression: value})
                }
                editable={editable}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder={item.defaultCronExpression}
              />
              <Text style={localStyles.helperText}>
                Use 5 campos no formato minuto hora dia mes semana. Exemplo:
                `* * * * *`.
              </Text>
            </View>
          </View>
        );
      })}

      <TouchableOpacity
        style={[
          globalStyles.button,
          localStyles.primaryButton,
          !editable && localStyles.primaryButtonDisabled,
        ]}
        disabled={!editable}
        onPress={saveRoutines}>
        <Text style={localStyles.primaryButtonText}>Salvar rotinas</Text>
      </TouchableOpacity>
    </GeneralSettingsSection>
  );
};

export default MaintenanceSection;
