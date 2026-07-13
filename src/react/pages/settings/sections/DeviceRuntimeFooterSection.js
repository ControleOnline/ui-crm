import React, {useCallback, useEffect, useState} from 'react';
import {Alert, Text, TextInput} from 'react-native';

import {useStore} from '@store';
import {
  DEVICE_RUNTIME_FOOTER_TEXT_CONFIG_KEY,
  normalizeRuntimeFooterText,
} from '@controleonline/ui-common/src/react/utils/runtimeFooter';
import {colors as defaultThemeColors} from '@controleonline/../../src/styles/colors';
import {resolveThemePalette, withOpacity} from '@controleonline/../../src/styles/branding';

import localStyles from '../GeneralSettings.styles';
import GeneralSettingsSection from '../GeneralSettingsSection';
import {toConfigRequestValue, useGeneralSettingsConfig} from '../GeneralSettings.shared';

const DeviceRuntimeFooterSection = () => {
  const themeStore = useStore('theme');
  const {
    configActions,
    defaultCompany,
    defaultCompanyLabel,
    isMainCompanySelected,
    peopleActions,
  } = useGeneralSettingsConfig();
  const themePalette = resolveThemePalette(
    themeStore.getters.colors,
    defaultThemeColors,
  );

  const [deviceRuntimeFooterText, setDeviceRuntimeFooterText] = useState('');

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

    if (!isMainCompanySelected) {
      Alert.alert(
        'Empresa principal',
        'Abra as configuracoes da empresa principal para editar o rodape dos devices.',
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
    isMainCompanySelected,
    peopleActions,
  ]);

  return (
    <GeneralSettingsSection
      description="Exibe o nome do device e a versao do software em uma linha fina no rodape. Quando existir texto livre na empresa principal, ele entra na mesma linha ou alterna em telas pequenas."
      icon="dvr"
      iconBackgroundColor={withOpacity(themePalette.info, 0.12)}
      iconColor={themePalette.info}
      title="Rodape dos devices">
      <Text style={localStyles.helperText}>
        {`Esse texto livre e salvo na empresa principal (${defaultCompanyLabel}) e compartilhado com todos os devices.`}
      </Text>

      {!isMainCompanySelected && (
        <Text style={localStyles.helperText}>
          Abra a empresa principal para editar esse rodape.
        </Text>
      )}

      <Text style={localStyles.fieldLabel}>Texto livre</Text>
      <TextInput
        style={[
          localStyles.input,
          (!defaultCompany?.id || !isMainCompanySelected) &&
            localStyles.inputDisabled,
        ]}
        value={deviceRuntimeFooterText}
        onChangeText={setDeviceRuntimeFooterText}
        onBlur={saveDeviceRuntimeFooter}
        editable={!!defaultCompany?.id && isMainCompanySelected}
        placeholder="Ex.: www.seusite.com.br • (11) 99999-9999"
      />
      <Text style={localStyles.helperText}>
        No rodape pequeno, o app alterna entre nome do device / versao e esse
        texto.
      </Text>
    </GeneralSettingsSection>
  );
};

export default DeviceRuntimeFooterSection;
