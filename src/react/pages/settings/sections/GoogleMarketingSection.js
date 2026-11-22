/*
 * @agents Google Marketing integration cards (GA4 / Google Ads / AdSense).
 * Backed by #84 (api-platform-integration). OAuth per scope set stays in
 * /configs private (GOOGLE_SERVICE_<SET>), while the identifiers below live
 * in GA4_PROPERTY_ID / GOOGLE_ADS_CUSTOMER / ADSENSE_ACCOUNT.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {Linking, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';

import useToastMessage from '@controleonline/ui-crm/src/react/hooks/useToastMessage';
import {api} from '@controleonline/ui-common/src/api';

import {
  useGeneralSettingsPalette,
  useGeneralSettingsStyles,
} from '../GeneralSettings.styles';
import GeneralSettingsSection from '../GeneralSettingsSection';
import {
  toConfigRequestValue,
  useGeneralSettingsConfig,
} from '../GeneralSettings.shared';

const styles = StyleSheet.create({
  buttonRow: {flexDirection: 'row', marginTop: 12, columnGap: 8},
});

const SCOPE_SETS = [
  {
    key: 'analytics',
    title: global.t?.t('settings', 'googleMarketing', 'ga4.title', 'Google Analytics 4'),
    description: global.t?.t('settings', 'googleMarketing', 'ga4.desc', 'Sessões, usuários, conversões e páginas vistas por campanha.'),
    icon: 'bar-chart',
    configKey: 'GA4_PROPERTY_ID',
    fieldKey: 'PROPERTY_ID',
    fieldPlaceholder: 'properties/123456789 ou 123456789',
  },
  {
    key: 'ads',
    title: global.t?.t('settings', 'googleMarketing', 'ads.title', 'Google Ads'),
    description: global.t?.t('settings', 'googleMarketing', 'ads.desc', 'Campanhas, custo, cliques e conversões; permite pausar/retomar via chat IA.'),
    icon: 'ads-click',
    configKey: 'GOOGLE_ADS_CUSTOMER',
    fieldKey: 'customer_id',
    fieldPlaceholder: '1234567890',
  },
  {
    key: 'adsense',
    title: global.t?.t('settings', 'googleMarketing', 'adsense.title', 'Google AdSense'),
    description: global.t?.t('settings', 'googleMarketing', 'adsense.desc', 'Receita, RPM e impressões por site e unidade.'),
    icon: 'monetization-on',
    configKey: 'ADSENSE_ACCOUNT',
    fieldKey: 'ACCOUNT_NAME',
    fieldPlaceholder: 'accounts/pub-0000000000000000',
  },
];

const resolveTextConfig = (configs, key) => {
  const raw = configs?.[key];
  if (typeof raw === 'string') {
    return raw.trim();
  }
  return '';
};

const resolveJsonConfig = (configs, key, field) => {
  const raw = configs?.[key];
  if (typeof raw !== 'string' || raw === '') {
    return '';
  }
  try {
    const parsed = JSON.parse(raw);
    return String(parsed?.[field] || '').trim();
  } catch {
    return '';
  }
};

const GoogleMarketingSection = () => {
  const localStyles = useGeneralSettingsStyles();
  const themePalette = useGeneralSettingsPalette();
  const {showError, showSuccess} = useToastMessage();
  const {
    configActions,
    mainCompany,
    hasDefaultCompanyAccess,
    isMainCompanySelected,
    isSaving,
  } = useGeneralSettingsConfig();

  const [configs, setConfigs] = useState({});
  const [statuses, setStatuses] = useState({});
  const [fieldValues, setFieldValues] = useState({});
  const [loading, setLoading] = useState(false);

  const companyId = mainCompany?.id;
  const editable = hasDefaultCompanyAccess && isMainCompanySelected && !isSaving && !loading;

  const loadConfigs = useCallback(async () => {
    if (!companyId) {
      setConfigs({});
      setStatuses({});
      return;
    }
    setLoading(true);
    try {
      const response = await api.fetch('/configs', {
        params: {people: '/people/' + companyId, visibility: 'private'},
      });
      const items = Array.isArray(response?.member)
        ? response.member
        : Array.isArray(response?.['hydra:member'])
          ? response['hydra:member']
          : [];
      const mapped = items.reduce((acc, item) => {
        const k = String(item?.configKey || '').trim();
        if (k) acc[k] = item?.configValue;
        return acc;
      }, {});
      setConfigs(mapped);

      const nextStatuses = {};
      await Promise.all(
        SCOPE_SETS.map(async scope => {
          try {
            const status = await api.fetch('/integrations/google-marketing/status', {
              params: {provider_id: companyId, scope_set: scope.key},
            });
            nextStatuses[scope.key] = status;
          } catch {
            nextStatuses[scope.key] = {connected: false};
          }
        }),
      );
      setStatuses(nextStatuses);
    } catch (err) {
      showError(err?.message || global.t?.t('settings', 'googleMarketing', 'loadFailed', 'Não foi possível carregar o status das integrações Google.'));
    } finally {
      setLoading(false);
    }
  }, [companyId, showError]);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  useEffect(() => {
    const next = {};
    SCOPE_SETS.forEach(scope => {
      if (scope.key === 'ads') {
        next[scope.key] = resolveJsonConfig(configs, scope.configKey, 'customer_id');
      } else {
        next[scope.key] = resolveTextConfig(configs, scope.configKey);
      }
    });
    setFieldValues(next);
  }, [configs]);

  const connect = useCallback(
    async scope => {
      if (!editable) return;
      try {
        const result = await api.fetch('/integrations/google-marketing/authorization-page', {
          method: 'POST',
          body: {
            provider_id: companyId,
            scope_set: scope.key,
            return_url: '/settings/integrations',
          },
        });
        if (result?.authorization_url) {
          Linking.openURL(result.authorization_url);
        } else {
          showError(String(result?.message || result?.error || 'authorization_failed'));
        }
      } catch (err) {
        showError(err?.message || String(err));
      }
    },
    [companyId, editable, showError],
  );

  const disconnect = useCallback(
    async scope => {
      if (!editable) return;
      try {
        await api.fetch('/integrations/google-marketing/disconnect', {
          method: 'POST',
          body: {provider_id: companyId, scope_set: scope.key},
        });
        showSuccess(global.t?.t('settings', 'googleMarketing', 'disconnected', 'Integração desconectada.'));
        loadConfigs();
      } catch (err) {
        showError(err?.message || String(err));
      }
    },
    [companyId, editable, loadConfigs, showError, showSuccess],
  );

  const saveField = useCallback(
    async scope => {
      if (!editable) return;
      const value = fieldValues[scope.key] || '';
      const configValue = scope.key === 'ads' ? {customer_id: value} : value;
      configActions.addToQueue(() =>
        configActions
          .addConfigs({
            configKey: scope.configKey,
            configValue: toConfigRequestValue(configValue),
            people: '/people/' + companyId,
            module: 4,
            visibility: 'private',
          })
          .then(() => {
            showSuccess(global.t?.t('settings', 'googleMarketing', 'saved', 'Identificador salvo.'));
            loadConfigs();
          })
          .catch(err => showError(err?.message || JSON.stringify(err))),
      );
      configActions.initQueue();
    },
    [configActions, companyId, editable, fieldValues, loadConfigs, showError, showSuccess],
  );

  return SCOPE_SETS.map(scope => {
    const status = statuses[scope.key];
    const connected = Boolean(status?.connected);
    return (
      <GeneralSettingsSection
        key={scope.key}
        description={scope.description}
        icon={scope.icon}
        iconBackgroundColor={themePalette.cardIconBackground}
        iconColor={themePalette.cardIconColor}
        title={scope.title}>
        <Text style={localStyles.helperText}>
          {connected
            ? global.t?.t('settings', 'googleMarketing', 'connected', 'Conectado como ') + (status?.scopes?.join(' ') || '')
            : global.t?.t('settings', 'googleMarketing', 'notConnected', 'Não conectado. Autorize a conta Google que administra esses dados.')}
        </Text>
        <Text style={localStyles.fieldLabel}>{scope.fieldKey}</Text>
        <TextInput
          style={[localStyles.input, !editable && localStyles.inputDisabled]}
          value={fieldValues[scope.key] || ''}
          onChangeText={next =>
            setFieldValues(prev => ({...prev, [scope.key]: next}))
          }
          onBlur={() => saveField(scope)}
          editable={editable}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={scope.fieldPlaceholder}
        />
        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={() => connect(scope)}
            style={[localStyles.selectorListButton, !editable && localStyles.inputDisabled]}
            disabled={!editable}>
            <Text style={localStyles.selectorListButtonText}>
              {global.t?.t('settings', 'googleMarketing', 'connect', 'Conectar com Google')}
            </Text>
          </TouchableOpacity>
          {connected ? (
            <TouchableOpacity
              onPress={() => disconnect(scope)}
              style={[localStyles.selectorListButton, !editable && localStyles.inputDisabled]}
              disabled={!editable}>
              <Text style={localStyles.selectorListButtonText}>
                {global.t?.t('settings', 'googleMarketing', 'disconnect', 'Desconectar')}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </GeneralSettingsSection>
    );
  });
};

export default GoogleMarketingSection;
