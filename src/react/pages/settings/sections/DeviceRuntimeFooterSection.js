/*
 * @agents This section controls the runtime footer text shown in shared device contexts.
 * Keep writes tied to the shared config key and the current company store.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {Alert, Text, TextInput} from 'react-native';

import {
  DEVICE_RUNTIME_FOOTER_TEXT_CONFIG_KEY,
  normalizeRuntimeFooterText,
} from '@controleonline/ui-common/src/react/utils/runtimeFooter';
import {
  useGeneralSettingsPalette,
  useGeneralSettingsStyles,
} from '../GeneralSettings.styles';
import GeneralSettingsSection from '../GeneralSettingsSection';
import {toConfigRequestValue, useGeneralSettingsConfig} from '../GeneralSettings.shared';

const DeviceRuntimeFooterSection = () => {
  const localStyles = useGeneralSettingsStyles();
  const themePalette = useGeneralSettingsPalette();
  const {
    configActions,
    defaultCompany,
    defaultCompanyLabel,
    hasDefaultCompanyAccess,
    isMainCompanySelected,
    peopleActions,
  } = useGeneralSettingsConfig();
  const [deviceRuntimeFooterText, setDeviceRuntimeFooterText] = useState('');
  const canEditFooterText = !!defaultCompany?.id && hasDefaultCompanyAccess;

  useEffect(() => {
    setDeviceRuntimeFooterText(
      normalizeRuntimeFooterText(
        defaultCompany?.configs?.[DEVICE_RUNTIME_FOOTER_TEXT_CONFIG_KEY],
      ),
    );
  }, [defaultCompany?.configs]);

  const saveDeviceRuntimeFooter = useCallback(() => {
    if (!defaultCompany?.id) {
      Alert.alert(
        'Empresa principal indisponivel',
        'Nao foi possivel identificar a empresa principal para salvar o rodape.',
      );
      return Promise.resolve(false);
    }

    const normalizedText = normalizeRuntimeFooterText(deviceRuntimeFooterText);

    return new Promise(resolve => {
      configActions.addToQueue(() =>
        configActions
          .addConfigs({
            configKey: DEVICE_RUNTIME_FOOTER_TEXT_CONFIG_KEY,
            configValue: toConfigRequestValue(normalizedText),
            people: '/people/' + defaultCompany.id,
            module: 4,
            visibility: 'public',
          })
          .then(async data => {
            setDeviceRuntimeFooterText(normalizedText);

            try {
              await peopleActions.defaultCompany();
            } catch {}

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
  }, [
    configActions,
    defaultCompany?.id,
    deviceRuntimeFooterText,
    peopleActions,
  ]);

  return (
    <GeneralSettingsSection
      description="Exibe o nome do device e a versao do software em uma linha fina no rodape. Quando existir texto livre na empresa principal, o app passa por cada linha desse texto antes de mostrar novamente a linha de versao."
      icon="dvr"
      iconBackgroundColor={themePalette.cardIconBackground}
      iconColor={themePalette.cardIconColor}
      title="Rodape dos devices">
      <Text style={localStyles.helperText}>
        {`Esse texto livre e salvo na empresa principal (${defaultCompanyLabel}) e compartilhado com todos os devices.`}
      </Text>

      {!isMainCompanySelected && (
        <Text style={localStyles.helperText}>
          A edicao continua salvando na empresa principal, mesmo fora dela.
        </Text>
      )}

      <Text style={localStyles.fieldLabel}>Texto livre</Text>
      <TextInput
        style={[
          localStyles.input,
          localStyles.multilineInput,
          !canEditFooterText &&
            localStyles.inputDisabled,
        ]}
        value={deviceRuntimeFooterText}
        onChangeText={setDeviceRuntimeFooterText}
        onBlur={saveDeviceRuntimeFooter}
        multiline
        numberOfLines={4}
        editable={canEditFooterText}
        placeholder={`Ex.:\nwww.seusite.com.br\n(11) 99999-9999`}
      />
      <Text style={localStyles.helperText}>
        No rodape pequeno, o app alterna entre cada linha desse texto e a
        linha de nome do device / versao.
      </Text>
    </GeneralSettingsSection>
  );
};

export default DeviceRuntimeFooterSection;
