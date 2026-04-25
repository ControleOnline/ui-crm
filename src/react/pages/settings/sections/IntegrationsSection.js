import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Text, TextInput, TouchableOpacity} from 'react-native';

import css from '@controleonline/ui-orders/src/react/css/orders';
import useToastMessage from '@controleonline/ui-crm/src/react/hooks/useToastMessage';
import {api} from '@controleonline/ui-common/src/api';
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
import LoginSection from './LoginSection';
import {
  toConfigCacheValue,
  toConfigRequestValue,
  useGeneralSettingsConfig,
} from '../GeneralSettings.shared';

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
  const {showError, showSuccess} = useToastMessage();
  const {
    configActions,
    defaultCompany,
    defaultCompanyLabel,
    hasDefaultCompanyAccess,
    isMainCompanySelected,
    isSaving,
    peopleActions,
  } = useGeneralSettingsConfig();
  const [privateConfigs, setPrivateConfigs] = useState({});
  const [isLoadingPrivateConfigs, setIsLoadingPrivateConfigs] = useState(false);

  const [cieloConfig, setCieloConfig] = useState(DEFAULT_CIELO_CONFIG);
  const [newRelicConfig, setNewRelicConfig] = useState(DEFAULT_NEW_RELIC_CONFIG);
  const [spotifyConfig, setSpotifyConfig] = useState(DEFAULT_SPOTIFY_CONFIG);

  useEffect(() => {
    if (!hasDefaultCompanyAccess || !defaultCompany?.id) {
      setPrivateConfigs({});
      setIsLoadingPrivateConfigs(false);
      return undefined;
    }

    let cancelled = false;
    setIsLoadingPrivateConfigs(true);

    api
      .fetch('/configs', {
        params: {
          people: '/people/' + defaultCompany.id,
          visibility: 'private',
        },
      })
      .then(response => {
        if (cancelled) {
          return;
        }

        const items = Array.isArray(response?.member)
          ? response.member
          : Array.isArray(response?.['hydra:member'])
            ? response['hydra:member']
            : [];

        const mapped = items.reduce((accumulator, item) => {
          const configKey = String(item?.configKey || '').trim();
          if (configKey) {
            accumulator[configKey] = item?.configValue;
          }
          return accumulator;
        }, {});

        setPrivateConfigs(mapped);
      })
      .catch(error => {
        if (!cancelled) {
          setPrivateConfigs({});
          showError(
            error?.message ||
              'Nao foi possivel carregar as configuracoes privadas da empresa principal.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingPrivateConfigs(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [defaultCompany?.id, hasDefaultCompanyAccess, showError]);

  useEffect(() => {
    setCieloConfig(resolveCieloConfig(privateConfigs));
    setNewRelicConfig(resolveNewRelicConfig(privateConfigs));
    setSpotifyConfig(resolveSpotifyConfig(privateConfigs));
  }, [privateConfigs]);

  const savePrivateConfig = useCallback(
    (configKey, configValue) => {
      if (!hasDefaultCompanyAccess || !defaultCompany?.id) {
        showError(
          'Nao foi possivel identificar a empresa principal para salvar a integracao.',
        );
        return Promise.resolve(false);
      }

      if (!isMainCompanySelected) {
        showError(
          `Abra a empresa principal (${defaultCompanyLabel}) para editar essas credenciais.`,
        );
        return Promise.resolve(false);
      }

      return new Promise(resolve => {
        configActions.addToQueue(() =>
          configActions
            .addConfigs({
              configKey,
              configValue: toConfigRequestValue(configValue),
              people: '/people/' + defaultCompany.id,
              module: 4,
              visibility: 'private',
            })
            .then(async data => {
              setPrivateConfigs(currentValue => ({
                ...(currentValue || {}),
                [configKey]: toConfigCacheValue(configValue),
              }));

              try {
                await peopleActions.defaultCompany();
              } catch {}

              showSuccess('Configuracao tecnica salva com sucesso.');
              resolve(true);
              return data;
            })
            .catch(err => {
              showError(err?.message || JSON.stringify(err));
              resolve(false);
              return null;
            }),
        );
        configActions.initQueue();
      });
    },
    [
      configActions,
      defaultCompany?.id,
      defaultCompanyLabel,
      hasDefaultCompanyAccess,
      isMainCompanySelected,
      peopleActions,
      showError,
      showSuccess,
    ],
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

  const editable =
    hasDefaultCompanyAccess &&
    !!defaultCompany?.id &&
    isMainCompanySelected &&
    !isSaving &&
    !isLoadingPrivateConfigs;

  return (
    <>
      <LoginSection />

      <GeneralSettingsSection
        description="Credenciais tecnicas da Cielo centralizadas na empresa principal."
        icon="credit-card"
        iconBackgroundColor="#FEF3C7"
        iconColor="#B45309"
        title="Cielo">
        <Text style={localStyles.helperText}>
          {`Esses dados privados ficam vinculados a empresa principal (${defaultCompanyLabel}).`}
        </Text>
        {!isMainCompanySelected && hasDefaultCompanyAccess && (
          <Text style={localStyles.helperText}>
            Abra a empresa principal para editar as credenciais. Fora dela esta
            tela fica somente para consulta.
          </Text>
        )}
        {isLoadingPrivateConfigs && (
          <ActivityIndicator style={localStyles.sectionLoader} color="#B45309" />
        )}

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
        description="Campos de observabilidade centralizados na empresa principal."
        icon="analytics"
        iconBackgroundColor="#DBEAFE"
        iconColor="#1D4ED8"
        title="New Relic">
        <Text style={localStyles.helperText}>
          Use esta area para centralizar os parametros do New Relic da empresa
          principal.
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
        description="Chaves usadas pela integracao Spotify da empresa principal."
        icon="graphic-eq"
        iconBackgroundColor="#DCFCE7"
        iconColor="#15803D"
        title="Spotify">
        <Text style={localStyles.helperText}>
          Guarde aqui as chaves de Spotify vinculadas a empresa principal.
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
