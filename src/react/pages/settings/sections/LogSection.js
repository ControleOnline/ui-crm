import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Switch, Text, TextInput, TouchableOpacity, View} from 'react-native';

import css from '@controleonline/ui-orders/src/react/css/orders';
import useToastMessage from '@controleonline/ui-crm/src/react/hooks/useToastMessage';
import {
  DEFAULT_LOG_POLICY,
  findInvalidLogAlertRecipients,
  formatRecipientsForInput,
  LOG_ERROR_EMAIL_ENABLED_KEY,
  LOG_ERROR_EMAIL_RECIPIENTS_KEY,
  LOG_POLICY_CONFIG_KEY,
  LOG_POLICY_ITEMS,
  normalizeLogAlertRecipients,
  normalizeLogPolicy,
} from '@controleonline/ui-common/src/react/utils/logSettings';

import localStyles from '../GeneralSettings.styles';
import GeneralSettingsSection from '../GeneralSettingsSection';
import {useGeneralSettingsConfig} from '../GeneralSettings.shared';

const LogPolicyRow = ({
  editable,
  item,
  onChange,
  policy,
}) => {
  const keepForever = policy.retentionDays === null;

  return (
    <View style={localStyles.logPolicyCard}>
      <View style={localStyles.settingRow}>
        <View style={localStyles.settingCopy}>
          <Text style={localStyles.statusLabel}>{item.title}</Text>
          <Text style={localStyles.settingDescription}>{item.description}</Text>
        </View>
        <Switch
          value={!!policy.enabled}
          onValueChange={value => onChange(item.key, {enabled: value})}
          disabled={!editable}
        />
      </View>

      <View style={localStyles.settingRow}>
        <View style={localStyles.settingCopy}>
          <Text style={localStyles.statusLabel}>Manter para sempre</Text>
          <Text style={localStyles.settingDescription}>
            Desative para informar quantos dias esse grupo deve ficar salvo.
          </Text>
        </View>
        <Switch
          value={keepForever}
          onValueChange={value =>
            onChange(item.key, {retentionDays: value ? null : 30})
          }
          disabled={!editable}
        />
      </View>

      {!keepForever && (
        <View style={localStyles.fieldBlock}>
          <Text style={localStyles.fieldLabel}>Retencao em dias</Text>
          <TextInput
            style={[localStyles.input, !editable && localStyles.inputDisabled]}
            value={policy.retentionDays ? String(policy.retentionDays) : ''}
            onChangeText={value =>
              onChange(item.key, {
                retentionDays:
                  value.replace(/\D+/g, '').trim() === ''
                    ? null
                    : Number(value.replace(/\D+/g, '')),
              })
            }
            editable={editable}
            keyboardType="numeric"
            placeholder="30"
          />
        </View>
      )}
    </View>
  );
};

const LogSection = () => {
  const {globalStyles} = css();
  const {showError, showSuccess} = useToastMessage();
  const {
    currentCompany,
    defaultCompany,
    defaultCompanyLabel,
    effectiveCompanyConfigs,
    isMainCompanySelected,
    isSaving,
    peopleActions,
    saveConfigs,
  } = useGeneralSettingsConfig();

  const logConfigsSource = useMemo(() => {
    if (isMainCompanySelected) {
      return effectiveCompanyConfigs;
    }

    return defaultCompany?.configs || {};
  }, [defaultCompany?.configs, effectiveCompanyConfigs, isMainCompanySelected]);

  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(false);
  const [recipientInput, setRecipientInput] = useState('');
  const [logPolicy, setLogPolicy] = useState(DEFAULT_LOG_POLICY);

  useEffect(() => {
    setEmailAlertsEnabled(
      String(logConfigsSource?.[LOG_ERROR_EMAIL_ENABLED_KEY] || '')
        .trim()
        .toLowerCase() === 'true' ||
        String(logConfigsSource?.[LOG_ERROR_EMAIL_ENABLED_KEY] || '').trim() === '1',
    );
    setRecipientInput(
      formatRecipientsForInput(logConfigsSource?.[LOG_ERROR_EMAIL_RECIPIENTS_KEY]),
    );
    setLogPolicy(normalizeLogPolicy(logConfigsSource?.[LOG_POLICY_CONFIG_KEY]));
  }, [logConfigsSource]);

  const editable = !!currentCompany?.id && isMainCompanySelected && !isSaving;

  const handlePolicyChange = useCallback((policyKey, patch) => {
    setLogPolicy(currentValue => ({
      ...currentValue,
      [policyKey]: {
        ...(currentValue[policyKey] || DEFAULT_LOG_POLICY[policyKey]),
        ...patch,
      },
    }));
  }, []);

  const saveLogSettings = useCallback(async () => {
    if (!defaultCompany?.id || !isMainCompanySelected) {
      showError(
        `Abra a empresa principal (${defaultCompanyLabel}) para editar as configuracoes de log.`,
      );
      return;
    }

    const invalidRecipients = findInvalidLogAlertRecipients(recipientInput);
    if (invalidRecipients.length > 0) {
      showError(
        `Existem e-mails invalidos na lista: ${invalidRecipients.join(', ')}`,
      );
      return;
    }

    const normalizedRecipients = normalizeLogAlertRecipients(recipientInput);
    if (emailAlertsEnabled && normalizedRecipients.length === 0) {
      showError(
        'Informe ao menos um e-mail valido ou desabilite o aviso por e-mail.',
      );
      return;
    }

    const success = await saveConfigs({
      [LOG_ERROR_EMAIL_ENABLED_KEY]: emailAlertsEnabled,
      [LOG_ERROR_EMAIL_RECIPIENTS_KEY]: normalizedRecipients,
      [LOG_POLICY_CONFIG_KEY]: logPolicy,
    });

    if (!success) {
      return;
    }

    try {
      await peopleActions.defaultCompany();
    } catch {}

    showSuccess('Configuracoes de log salvas com sucesso.');
  }, [
    defaultCompany?.id,
    defaultCompanyLabel,
    emailAlertsEnabled,
    isMainCompanySelected,
    logPolicy,
    peopleActions,
    recipientInput,
    saveConfigs,
    showError,
    showSuccess,
  ]);

  return (
    <GeneralSettingsSection
      description="Centraliza avisos por e-mail e a politica geral de habilitacao e retencao dos logs do sistema."
      icon="bug-report"
      iconBackgroundColor="#FEE2E2"
      iconColor="#B91C1C"
      title="Logs e alertas">
      <Text style={localStyles.helperText}>
        {`Essas configuracoes sao globais e ficam vinculadas a empresa principal (${defaultCompanyLabel}).`}
      </Text>

      {!isMainCompanySelected && (
        <Text style={localStyles.helperText}>
          Abra a empresa principal para editar essa politica. Nesta visualizacao
          voce esta vendo apenas a configuracao central.
        </Text>
      )}

      <View style={localStyles.settingRow}>
        <View style={localStyles.settingCopy}>
          <Text style={localStyles.statusLabel}>Aviso por e-mail para erro 500</Text>
          <Text style={localStyles.settingDescription}>
            Quando ativo, erros criticos do backend enviam alerta para os e-mails informados abaixo.
          </Text>
        </View>
        <Switch
          value={emailAlertsEnabled}
          onValueChange={setEmailAlertsEnabled}
          disabled={!editable}
        />
      </View>

      <View style={localStyles.fieldBlock}>
        <Text style={localStyles.fieldLabel}>Destinatarios</Text>
        <TextInput
          style={[
            localStyles.input,
            localStyles.multilineInput,
            (!editable || !emailAlertsEnabled) && localStyles.inputDisabled,
          ]}
          value={recipientInput}
          onChangeText={setRecipientInput}
          editable={editable && emailAlertsEnabled}
          multiline
          placeholder={'ops@empresa.com.br\nsuporte@empresa.com.br'}
        />
        <Text style={localStyles.helperText}>
          Use um e-mail por linha ou separe por virgula. Deixe vazio para manter o aviso desabilitado.
        </Text>
      </View>

      <View style={localStyles.fieldBlock}>
        <Text style={localStyles.fieldLabel}>Politica geral de logs</Text>
        <Text style={localStyles.helperText}>
          Defina quais grupos continuam gravando e por quanto tempo ficam retidos antes da limpeza automatica.
        </Text>
      </View>

      <View style={localStyles.logPolicyList}>
        {LOG_POLICY_ITEMS.map(item => (
          <LogPolicyRow
            key={item.key}
            editable={editable}
            item={item}
            onChange={handlePolicyChange}
            policy={logPolicy[item.key] || DEFAULT_LOG_POLICY[item.key]}
          />
        ))}
      </View>

      <TouchableOpacity
        style={[
          globalStyles.button,
          localStyles.primaryButton,
          !editable && localStyles.primaryButtonDisabled,
        ]}
        disabled={!editable}
        onPress={saveLogSettings}>
        <Text style={localStyles.primaryButtonText}>Salvar logs e alertas</Text>
      </TouchableOpacity>
    </GeneralSettingsSection>
  );
};

export default LogSection;
