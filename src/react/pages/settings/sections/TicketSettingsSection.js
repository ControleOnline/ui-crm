/*
 * @agents General settings → Atendimento (app-community#1596/#1600): how requests are distributed and
 * who answers them. Support: rule (random / fewest open) + the people who answer support (the only
 * ones listed as responsible in /support). CRM: rule + sales assistants (salesmen always answer).
 * Saved per company through GET|PUT /tickets/settings.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Text, TouchableOpacity, View} from 'react-native';

import useToastMessage from '@controleonline/ui-crm/src/react/hooks/useToastMessage';
import {fetchTicketSettings, saveTicketSettings} from '../../../components/conversation/requestApi';
import {useGeneralSettingsPalette, useGeneralSettingsStyles} from '../GeneralSettings.styles';
import GeneralSettingsSection from '../GeneralSettingsSection';
import {useGeneralSettingsConfig} from '../GeneralSettings.shared';

const STRATEGIES = [
  {value: 'random', label: 'Aleatório'},
  {value: 'least_open', label: 'Quem tem menos chamados abertos'},
];

const Choice = ({active, label, onPress, palette, multi}) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      marginBottom: 6,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: active ? palette.primary : palette.cardBorder,
      backgroundColor: palette.cardBackground,
    }}>
    <View
      style={{
        width: 18,
        height: 18,
        borderRadius: multi ? 4 : 9,
        borderWidth: 2,
        marginRight: 10,
        borderColor: palette.primary,
        backgroundColor: active ? palette.primary : 'transparent',
      }}
    />
    <Text style={{color: palette.textPrimary, flex: 1}}>{label}</Text>
  </TouchableOpacity>
);

export default function TicketSettingsSection() {
  const styles = useGeneralSettingsStyles();
  const palette = useGeneralSettingsPalette();
  const {showError, showSuccess} = useToastMessage();
  const {currentCompany, mainCompany} = useGeneralSettingsConfig();
  const companyId = Number(currentCompany?.id || mainCompany?.id || 0) || null;
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!companyId) return;
    try {
      setSettings(await fetchTicketSettings(companyId));
    } catch (e) {
      showError(e?.message || 'Não foi possível carregar as configurações de atendimento.');
    }
  }, [companyId, showError]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async patch => {
    if (saving) return;
    setSaving(true);
    try {
      setSettings(await saveTicketSettings(companyId, patch));
      showSuccess('Configuração de atendimento salva.');
    } catch (e) {
      showError(e?.message || 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  const toggle = (field, id) => {
    const current = settings?.[field] || [];
    save({[field]: current.includes(id) ? current.filter(x => x !== id) : [...current, id]});
  };

  if (!settings) return <ActivityIndicator style={{marginTop: 16}} />;
  const employees = settings.employees || [];

  return (
    <View>
      <GeneralSettingsSection
        title="Suporte"
        description="Chamados de suporte nascem sem responsável e são distribuídos entre as pessoas marcadas abaixo. Só elas respondem e aparecem como responsáveis em Atendimento de suporte.">
        <Text style={styles.sectionTitle}>Regra de distribuição</Text>
        {STRATEGIES.map(s => (
          <Choice key={s.value} palette={palette} active={settings.support_strategy === s.value} label={s.label} onPress={() => save({support_strategy: s.value})} />
        ))}
        <Text style={[styles.sectionTitle, {marginTop: 12}]}>Quem atende suporte</Text>
        {!employees.length ? <Text style={styles.helperText}>Nenhum colaborador vinculado à empresa.</Text> : null}
        {employees.map(p => (
          <Choice key={p.id} multi palette={palette} active={settings.support_responders.includes(p.id)} label={p.alias || p.name} onPress={() => toggle('support_responders', p.id)} />
        ))}
      </GeneralSettingsSection>

      <GeneralSettingsSection
        title="Comercial (CRM)"
        description="Oportunidades nascem sem responsável e o motor do CRM distribui entre os vendedores. Vendedores sempre respondem; marque aqui os assistentes de vendas que também podem responder.">
        <Text style={styles.sectionTitle}>Regra de distribuição</Text>
        {STRATEGIES.map(s => (
          <Choice key={s.value} palette={palette} active={settings.crm_strategy === s.value} label={s.label} onPress={() => save({crm_strategy: s.value})} />
        ))}
        <Text style={[styles.sectionTitle, {marginTop: 12}]}>Assistentes de vendas</Text>
        {employees.map(p => (
          <Choice key={p.id} multi palette={palette} active={settings.crm_assistants.includes(p.id)} label={p.alias || p.name} onPress={() => toggle('crm_assistants', p.id)} />
        ))}
      </GeneralSettingsSection>
      {saving ? <ActivityIndicator style={{marginTop: 8}} /> : null}
    </View>
  );
}
