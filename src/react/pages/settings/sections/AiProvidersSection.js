/*
 * @agents Company-scoped AI providers (Grok/Codex/Gemini/Claude) via /mcp/chat/config.
 * Keys stay server-side; UI only shows masked values and optional system_prompt.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {api} from '@controleonline/ui-common/src/api';
import useToastMessage from '@controleonline/ui-crm/src/react/hooks/useToastMessage';

import {
  useGeneralSettingsPalette,
  useGeneralSettingsStyles,
} from '../GeneralSettings.styles';
import GeneralSettingsSection from '../GeneralSettingsSection';
import {useGeneralSettingsConfig} from '../GeneralSettings.shared';

const PROVIDER_ORDER = ['grok', 'openai', 'gemini', 'claude'];
const PROVIDER_TITLES = {
  grok: 'Grok (xAI)',
  openai: 'Codex / OpenAI',
  gemini: 'Gemini',
  claude: 'Claude',
};

const emptyProvider = () => ({
  enabled: false,
  model: '',
  base_url: '',
  system_prompt: '',
  api_key: '',
  has_key: false,
  api_key_masked: null,
});

const AiProvidersSection = () => {
  const localStyles = useGeneralSettingsStyles();
  const themePalette = useGeneralSettingsPalette();
  const {showError, showSuccess} = useToastMessage();
  const {defaultCompany, hasDefaultCompanyAccess, isMainCompanySelected} =
    useGeneralSettingsConfig();

  const companyId = defaultCompany?.id || null;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [providers, setProviders] = useState(() => {
    const init = {};
    PROVIDER_ORDER.forEach(k => {
      init[k] = emptyProvider();
    });
    return init;
  });

  const load = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.fetch('/mcp/chat/config', {
        params: {company_id: Number(companyId)},
      });
      const remote = res?.providers || {};
      const next = {};
      PROVIDER_ORDER.forEach(k => {
        const r = remote[k] || {};
        next[k] = {
          enabled: !!r.enabled,
          model: String(r.model || ''),
          base_url: String(r.base_url || ''),
          system_prompt: String(r.system_prompt || ''),
          api_key: '',
          has_key: !!r.has_key,
          api_key_masked: r.api_key_masked || null,
        };
      });
      setProviders(next);
    } catch (e) {
      showError(e?.message || 'Falha ao carregar providers de IA');
    } finally {
      setLoading(false);
    }
  }, [companyId, showError]);

  useEffect(() => {
    load();
  }, [load]);

  const updateField = (key, field, value) => {
    setProviders(prev => ({
      ...prev,
      [key]: {...prev[key], [field]: value},
    }));
  };

  const save = useCallback(async () => {
    if (!hasDefaultCompanyAccess || !companyId) {
      showError('Empresa nao identificada para salvar providers de IA.');
      return;
    }
    if (!isMainCompanySelected) {
      showError('Abra as configuracoes da empresa principal para editar as IAs.');
      return;
    }
    setSaving(true);
    try {
      const payload = {};
      PROVIDER_ORDER.forEach(k => {
        const p = providers[k] || emptyProvider();
        payload[k] = {
          enabled: !!p.enabled,
          model: String(p.model || '').trim(),
          base_url: String(p.base_url || '').trim(),
          system_prompt: String(p.system_prompt || ''),
          api_key: String(p.api_key || '').trim(),
        };
      });
      await api.put('/mcp/chat/config', {
        company_id: Number(companyId),
        providers: payload,
      });
      showSuccess('Providers de IA salvos.');
      await load();
    } catch (e) {
      showError(e?.message || 'Falha ao salvar providers de IA');
    } finally {
      setSaving(false);
    }
  }, [
    companyId,
    hasDefaultCompanyAccess,
    isMainCompanySelected,
    load,
    providers,
    showError,
    showSuccess,
  ]);

  const editable = hasDefaultCompanyAccess && isMainCompanySelected && !saving;

  return (
    <GeneralSettingsSection
      title="Inteligencia Artificial / MCP"
      description="Configure Grok, Codex/OpenAI, Gemini e Claude por empresa. A chave nao volta em claro no GET. O prompt inicial e enviado em toda conversa do /mcp.">
      {!hasDefaultCompanyAccess ? (
        <Text style={localStyles.helperText}>
          Sem acesso a empresa padrao para editar configs.
        </Text>
      ) : loading ? (
        <ActivityIndicator style={{marginTop: 12}} />
      ) : (
        <View>
          {PROVIDER_ORDER.map(key => {
            const p = providers[key] || emptyProvider();
            return (
              <View key={key} style={{marginBottom: 20}}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}>
                  <Text style={localStyles.sectionTitle}>
                    {PROVIDER_TITLES[key] || key}
                  </Text>
                  <Switch
                    value={!!p.enabled}
                    onValueChange={v => updateField(key, 'enabled', v)}
                    disabled={!editable}
                  />
                </View>
                <Text style={localStyles.fieldLabel}>API key</Text>
                <TextInput
                  style={[
                    localStyles.input,
                    !editable && localStyles.inputDisabled,
                  ]}
                  value={p.api_key}
                  onChangeText={v => updateField(key, 'api_key', v)}
                  placeholder={
                    p.has_key
                      ? p.api_key_masked || '•••• (mantem a atual se vazio)'
                      : 'Cole a API key'
                  }
                  editable={editable}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry
                />
                <Text style={localStyles.fieldLabel}>Modelo</Text>
                <TextInput
                  style={[
                    localStyles.input,
                    !editable && localStyles.inputDisabled,
                  ]}
                  value={p.model}
                  onChangeText={v => updateField(key, 'model', v)}
                  placeholder="ex.: grok-4, gpt-4.1, gemini-2.0-flash"
                  editable={editable}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={localStyles.fieldLabel}>Base URL (opcional)</Text>
                <TextInput
                  style={[
                    localStyles.input,
                    !editable && localStyles.inputDisabled,
                  ]}
                  value={p.base_url}
                  onChangeText={v => updateField(key, 'base_url', v)}
                  placeholder="Padrao do provider se vazio"
                  editable={editable}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={localStyles.fieldLabel}>Prompt inicial</Text>
                <TextInput
                  style={[
                    localStyles.input,
                    !editable && localStyles.inputDisabled,
                    {minHeight: 80, textAlignVertical: 'top'},
                  ]}
                  value={p.system_prompt}
                  onChangeText={v => updateField(key, 'system_prompt', v)}
                  placeholder="Instrucoes fixas para esta IA (opcional)"
                  editable={editable}
                  multiline
                />
              </View>
            );
          })}
          <TouchableOpacity
            onPress={save}
            disabled={!editable || saving}
            style={{
              marginTop: 8,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
              backgroundColor: themePalette?.primary || '#1976d2',
              opacity: !editable || saving ? 0.5 : 1,
              alignSelf: 'flex-start',
            }}>
            <Text style={{color: '#fff', fontWeight: '600'}}>
              {saving ? 'Salvando…' : 'Salvar providers de IA'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </GeneralSettingsSection>
  );
};

export default AiProvidersSection;
