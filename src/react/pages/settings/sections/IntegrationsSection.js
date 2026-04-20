import React, {useCallback, useEffect, useState} from 'react';
import {Alert, Text, TextInput, TouchableOpacity} from 'react-native';

import css from '@controleonline/ui-orders/src/react/css/orders';
import {
  CIELO_CONFIG_KEY,
  DEFAULT_CIELO_CONFIG,
  DEFAULT_NEW_RELIC_CONFIG,
  DEFAULT_SPOTIFY_CONFIG,
  NEW_RELIC_CONFIG_KEY,
  resolveCieloConfig,
  resolveNewRelicConfig,
  resolveSpotifyConfig,
  SPOTIFY_CONFIG_KEY,
} from '@controleonline/ui-common/src/utils/integrationConfigs';

import localStyles from '../GeneralSettings.styles';
import GeneralSettingsSection from '../GeneralSettingsSection';
import {toConfigRequestValue, toConfigCacheValue, useGeneralSettingsConfig} from '../GeneralSettings.shared';

const buildConfigUpdater = (setState, fieldKey) => value => {
  setState(currentValue => ({
    ...currentValue,
    [fieldKey]: value,
  }));
};

const IntegrationField = ({
  editable,
  fieldKey,
  onChangeText,
  placeholder,
  sectionState,
}) => (
  <>
    <Text style={localStyles.fieldLabel}>{fieldKey}</Text>
    <TextInput
      style={[localStyles.input, !editable && localStyles.inputDisabled]}
      value={sectionState[fieldKey]}
      onChangeText={onChangeText}
      editable={editable}
      autoCapitalize="none"
      autoCorrect={false}
      placeholder={placeholder}
    />
  </>
);

const IntegrationsSection = () => {
  const {globalStyles} = css();
  const {
    configActions,
    currentCompany,
    effectiveCompanyConfigs,
    isSaving,
  } = useGeneralSettingsConfig();

  const [cieloConfig, setCieloConfig] = useState(DEFAULT_CIELO_CONFIG);
  const [newRelicConfig, setNewRelicConfig] = useState(DEFAULT_NEW_RELIC_CONFIG);
  const [spotifyConfig, setSpotifyConfig] = useState(DEFAULT_SPOTIFY_CONFIG);

  useEffect(() => {
    setCieloConfig(resolveCieloConfig(effectiveCompanyConfigs));
    setNewRelicConfig(resolveNewRelicConfig(effectiveCompanyConfigs));
    setSpotifyConfig(resolveSpotifyConfig(effectiveCompanyConfigs));
  }, [effectiveCompanyConfigs]);

  const savePrivateConfig = useCallback(
    (configKey, configValue) => {
      if (!currentCompany?.id) {
        Alert.alert(
          'Empresa nao selecionada',
          'Selecione uma empresa para salvar as configuracoes da integracao.',
        );
        return Promise.resolve(false);
      }

      return new Promise(resolve => {
        configActions.addToQueue(() =>
          configActions
            .addConfigs({
              configKey,
              configValue: toConfigRequestValue(configValue),
              people: '/people/' + currentCompany.id,
              module: 4,
              visibility: 'private',
            })
            .then(data => {
              configActions.setItems({
                ...(effectiveCompanyConfigs || {}),
                [configKey]: toConfigCacheValue(configValue),
              });
              resolve(true);
              return data;
            })
            .catch(err => {
              Alert.alert('Erro', err?.message || JSON.stringify(err));
              resolve(false);
              return null;
            }),
        );
        configActions.initQueue();
      });
    },
    [configActions, currentCompany?.id, effectiveCompanyConfigs],
  );

  const saveCieloConfig = useCallback(
    () => savePrivateConfig(CIELO_CONFIG_KEY, cieloConfig),
    [cieloConfig, savePrivateConfig],
  );
  const saveNewRelicConfig = useCallback(
    () => savePrivateConfig(NEW_RELIC_CONFIG_KEY, newRelicConfig),
    [newRelicConfig, savePrivateConfig],
  );
  const saveSpotifyConfig = useCallback(
    () => savePrivateConfig(SPOTIFY_CONFIG_KEY, spotifyConfig),
    [savePrivateConfig, spotifyConfig],
  );

  const editable = !!currentCompany?.id && !isSaving;

  return (
    <>
      <GeneralSettingsSection
        description="Credenciais usadas pelo pagamento local da Cielo para a empresa ativa."
        icon="credit-card"
        iconBackgroundColor="#FEF3C7"
        iconColor="#B45309"
        title="Cielo">
        <Text style={localStyles.helperText}>
          Esses dados ficam vinculados a empresa ativa e sao tratados como
          configuracao privada.
        </Text>

        <IntegrationField
          editable={editable}
          fieldKey="ACCESS_TOKEN"
          onChangeText={buildConfigUpdater(setCieloConfig, 'ACCESS_TOKEN')}
          placeholder="Token da integracao Cielo"
          sectionState={cieloConfig}
        />
        <IntegrationField
          editable={editable}
          fieldKey="CLIENT_ID"
          onChangeText={buildConfigUpdater(setCieloConfig, 'CLIENT_ID')}
          placeholder="Client ID da Cielo"
          sectionState={cieloConfig}
        />
        <IntegrationField
          editable={editable}
          fieldKey="EMAIL"
          onChangeText={buildConfigUpdater(setCieloConfig, 'EMAIL')}
          placeholder="financeiro@empresa.com.br"
          sectionState={cieloConfig}
        />

        <TouchableOpacity
          style={[
            globalStyles.button,
            localStyles.primaryButton,
            !editable && localStyles.primaryButtonDisabled,
          ]}
          disabled={!editable}
          onPress={saveCieloConfig}>
          <Text style={localStyles.primaryButtonText}>Salvar Cielo</Text>
        </TouchableOpacity>
      </GeneralSettingsSection>

      <GeneralSettingsSection
        description="Campos de observabilidade para a empresa ativa. Sem integracao React nova neste patch."
        icon="analytics"
        iconBackgroundColor="#DBEAFE"
        iconColor="#1D4ED8"
        title="New Relic">
        <Text style={localStyles.helperText}>
          Use esta area para centralizar os parametros do New Relic por
          empresa.
        </Text>

        <IntegrationField
          editable={editable}
          fieldKey="LICENSE_KEY"
          onChangeText={buildConfigUpdater(setNewRelicConfig, 'LICENSE_KEY')}
          placeholder="License key"
          sectionState={newRelicConfig}
        />
        <IntegrationField
          editable={editable}
          fieldKey="APPLICATION_ID"
          onChangeText={buildConfigUpdater(
            setNewRelicConfig,
            'APPLICATION_ID',
          )}
          placeholder="Application ID"
          sectionState={newRelicConfig}
        />
        <IntegrationField
          editable={editable}
          fieldKey="ACCOUNT_ID"
          onChangeText={buildConfigUpdater(setNewRelicConfig, 'ACCOUNT_ID')}
          placeholder="Account ID"
          sectionState={newRelicConfig}
        />
        <IntegrationField
          editable={editable}
          fieldKey="TRUST_KEY"
          onChangeText={buildConfigUpdater(setNewRelicConfig, 'TRUST_KEY')}
          placeholder="Trust key"
          sectionState={newRelicConfig}
        />
        <IntegrationField
          editable={editable}
          fieldKey="BEACON"
          onChangeText={buildConfigUpdater(setNewRelicConfig, 'BEACON')}
          placeholder="bam.nr-data.net"
          sectionState={newRelicConfig}
        />
        <IntegrationField
          editable={editable}
          fieldKey="ERROR_BEACON"
          onChangeText={buildConfigUpdater(setNewRelicConfig, 'ERROR_BEACON')}
          placeholder="bam.nr-data.net"
          sectionState={newRelicConfig}
        />

        <TouchableOpacity
          style={[
            globalStyles.button,
            localStyles.primaryButton,
            !editable && localStyles.primaryButtonDisabled,
          ]}
          disabled={!editable}
          onPress={saveNewRelicConfig}>
          <Text style={localStyles.primaryButtonText}>Salvar New Relic</Text>
        </TouchableOpacity>
      </GeneralSettingsSection>

      <GeneralSettingsSection
        description="Chaves usadas pela integracao Spotify da empresa ativa."
        icon="graphic-eq"
        iconBackgroundColor="#DCFCE7"
        iconColor="#15803D"
        title="Spotify">
        <Text style={localStyles.helperText}>
          Guarde aqui as chaves de Spotify vinculadas a empresa ativa.
        </Text>

        <IntegrationField
          editable={editable}
          fieldKey="CLIENT_ID"
          onChangeText={buildConfigUpdater(setSpotifyConfig, 'CLIENT_ID')}
          placeholder="Client ID do Spotify"
          sectionState={spotifyConfig}
        />
        <IntegrationField
          editable={editable}
          fieldKey="CLIENT_SECRET"
          onChangeText={buildConfigUpdater(setSpotifyConfig, 'CLIENT_SECRET')}
          placeholder="Client secret do Spotify"
          sectionState={spotifyConfig}
        />

        <TouchableOpacity
          style={[
            globalStyles.button,
            localStyles.primaryButton,
            !editable && localStyles.primaryButtonDisabled,
          ]}
          disabled={!editable}
          onPress={saveSpotifyConfig}>
          <Text style={localStyles.primaryButtonText}>Salvar Spotify</Text>
        </TouchableOpacity>
      </GeneralSettingsSection>
    </>
  );
};

export default IntegrationsSection;
