import React, {useCallback, useEffect, useState} from 'react';
import {Text, TextInput, TouchableOpacity} from 'react-native';

import css from '@controleonline/ui-orders/src/react/css/orders';
import useToastMessage from '@controleonline/ui-crm/src/react/hooks/useToastMessage';
import {
  OAUTH_GOOGLE_CLIENT_ID_CONFIG_KEY,
  resolveCompanyGoogleOauthClientId,
} from '@controleonline/ui-common/src/utils/oauth';

import localStyles from '../GeneralSettings.styles';
import GeneralSettingsSection from '../GeneralSettingsSection';
import {toConfigRequestValue, useGeneralSettingsConfig} from '../GeneralSettings.shared';

const LoginSection = () => {
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

  const [googleClientId, setGoogleClientId] = useState('');

  useEffect(() => {
    setGoogleClientId(resolveCompanyGoogleOauthClientId(defaultCompany));
  }, [defaultCompany?.configs]);

  const saveGoogleOauthConfig = useCallback(() => {
    if (!hasDefaultCompanyAccess || !defaultCompany?.id) {
      showError(
        'Nao foi possivel identificar a empresa principal para salvar o login Google.',
      );
      return Promise.resolve(false);
    }

    if (!isMainCompanySelected) {
      showError(
        'Abra as configuracoes da empresa principal para editar o Google OAuth.',
      );
      return Promise.resolve(false);
    }

    const normalizedGoogleClientId = String(googleClientId || '').trim();

    return new Promise(resolve => {
      configActions.addToQueue(() =>
        configActions
          .addConfigs({
            configKey: OAUTH_GOOGLE_CLIENT_ID_CONFIG_KEY,
            configValue: toConfigRequestValue(normalizedGoogleClientId),
            people: '/people/' + defaultCompany.id,
            module: 4,
            visibility: 'public',
          })
          .then(async data => {
            setGoogleClientId(normalizedGoogleClientId);

            try {
              await peopleActions.defaultCompany();
            } catch {}

            showSuccess('Google OAuth salvo com sucesso.');
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
  }, [
    configActions,
    defaultCompany?.id,
    hasDefaultCompanyAccess,
    googleClientId,
    isMainCompanySelected,
    peopleActions,
    showError,
    showSuccess,
  ]);

  return (
    <GeneralSettingsSection
      description="Centraliza a chave publica usada pelo login Google da tela React."
      icon="login"
      iconBackgroundColor="#FFEDD5"
      iconColor="#EA580C"
      title="Login e autenticacao">
      <Text style={localStyles.helperText}>
        {`Esse client ID e salvo na empresa principal (${defaultCompanyLabel}) e controla quando o botao "Entrar com Google" aparece no login web.`}
      </Text>

      {!isMainCompanySelected && (
        <Text style={localStyles.helperText}>
          Abra a empresa principal para editar essa configuracao.
        </Text>
      )}

      <Text style={localStyles.fieldLabel}>OAUTH_GOOGLE_CLIENT_ID</Text>
      <TextInput
        style={[
          localStyles.input,
          (!defaultCompany?.id || !isMainCompanySelected) &&
            localStyles.inputDisabled,
        ]}
        value={googleClientId}
        onChangeText={setGoogleClientId}
        editable={!!defaultCompany?.id && isMainCompanySelected}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="1234567890-abc123def456.apps.googleusercontent.com"
      />
      <Text style={localStyles.helperText}>
        Deixe vazio para ocultar o login Google no React sem depender de
        variavel de ambiente.
      </Text>

      <TouchableOpacity
        style={[
          globalStyles.button,
          localStyles.primaryButton,
          (!defaultCompany?.id || !isMainCompanySelected || isSaving) &&
            localStyles.primaryButtonDisabled,
        ]}
        disabled={!defaultCompany?.id || !isMainCompanySelected || isSaving}
        onPress={saveGoogleOauthConfig}>
        <Text style={localStyles.primaryButtonText}>
          Salvar Google OAuth
        </Text>
      </TouchableOpacity>
    </GeneralSettingsSection>
  );
};

export default LoginSection;
