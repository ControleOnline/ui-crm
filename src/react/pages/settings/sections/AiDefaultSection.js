/*
 * @agents General settings → IA: lists the AIs already connected to the company (keys are configured in
 * Integrações) and chooses which one the /ai chat uses (POST /mcp/chat/default, api-platform-mcp#86).
 */
import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Text, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import {api} from '@controleonline/ui-common/src/api';
import useToastMessage from '@controleonline/ui-crm/src/react/hooks/useToastMessage';

import {useGeneralSettingsPalette, useGeneralSettingsStyles} from '../GeneralSettings.styles';
import GeneralSettingsSection from '../GeneralSettingsSection';
import {useGeneralSettingsConfig} from '../GeneralSettings.shared';

const TITLES = {grok: 'Grok (xAI)', openai: 'Codex / OpenAI', gemini: 'Gemini', claude: 'Claude'};

const AiDefaultSection = () => {
  const navigation = useNavigation();
  const localStyles = useGeneralSettingsStyles();
  const palette = useGeneralSettingsPalette();
  const {showError, showSuccess} = useToastMessage();
  const {currentCompany, mainCompany} = useGeneralSettingsConfig();
  const companyId = Number(currentCompany?.id || mainCompany?.id || 0) || null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [providers, setProviders] = useState([]);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await api.fetch('/mcp/chat/providers', {params: {company_id: companyId}});
      const list = Array.isArray(res?.providers) ? res.providers : [];
      setProviders(list);
      setSelected(res?.default || list.find(p => p.default)?.provider || list[0]?.provider || null);
    } catch (e) {
      showError(e?.message || 'Não foi possível carregar as IAs conectadas.');
    } finally {
      setLoading(false);
    }
  }, [companyId, showError]);

  useEffect(() => {
    load();
  }, [load]);

  const choose = async provider => {
    if (provider === selected || saving) return;
    setSaving(provider);
    try {
      await api.post('/mcp/chat/default', {provider, company_id: companyId});
      setSelected(provider);
      showSuccess(`${TITLES[provider] || provider} será usada no atendimento.`);
    } catch (e) {
      showError(e?.message || 'Não foi possível salvar a IA padrão.');
    } finally {
      setSaving(null);
    }
  };

  return (
    <GeneralSettingsSection
      title="Inteligência Artificial"
      description="Escolha qual das IAs conectadas atende no /ai. As chaves e modelos de cada IA são configurados em Integrações.">
      {loading ? (
        <ActivityIndicator style={{marginTop: 12}} />
      ) : providers.length === 0 ? (
        <View>
          <Text style={localStyles.helperText}>Nenhuma IA conectada nesta empresa.</Text>
          <TouchableOpacity onPress={() => navigation.navigate('IntegrationsPage')} style={{marginTop: 8}}>
            <Text style={{color: palette?.primary || '#1976d2', fontWeight: '600'}}>Conectar uma IA em Integrações</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          {providers.map(p => {
            const active = p.provider === selected;
            return (
              <TouchableOpacity
                key={p.provider}
                onPress={() => choose(p.provider)}
                disabled={!!saving}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  marginBottom: 8,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: active ? palette?.primary || '#1976d2' : palette?.border || '#e2e8f0',
                  backgroundColor: palette?.surface || palette?.background || 'transparent',
                }}>
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    borderWidth: 2,
                    marginRight: 12,
                    borderColor: palette?.primary || '#1976d2',
                    backgroundColor: active ? palette?.primary || '#1976d2' : 'transparent',
                  }}
                />
                <View style={{flex: 1}}>
                  <Text style={localStyles.sectionTitle}>{TITLES[p.provider] || p.label || p.provider}</Text>
                  <Text style={localStyles.helperText}>{p.model ? `Modelo: ${p.model}` : 'Modelo padrão'}</Text>
                </View>
                {saving === p.provider ? <ActivityIndicator /> : active ? <Text style={localStyles.helperText}>Em uso</Text> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </GeneralSettingsSection>
  );
};

export default AiDefaultSection;
