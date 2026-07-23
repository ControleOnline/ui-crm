/*
 * @agents This section controls the map and location settings for the CRM page.
 * Keep the address and location behavior tied to shared config keys and company context.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {Text, TextInput, View} from 'react-native';

import {
  useGeneralSettingsPalette,
  useGeneralSettingsStyles,
} from '../GeneralSettings.styles';
import GeneralSettingsSection from '../GeneralSettingsSection';
import {useGeneralSettingsConfig} from '../GeneralSettings.shared';
import {
  GOOGLE_MAPS_ANDROID_API_KEY_CONFIG_KEY,
  GOOGLE_MAPS_WEB_API_KEY_CONFIG_KEY,
  resolveGoogleMapsSettings,
} from '@controleonline/ui-common/src/react/utils/googleMapsConfig';

const MapsSection = () => {
  const localStyles = useGeneralSettingsStyles();
  const themePalette = useGeneralSettingsPalette();
  const {currentCompany, effectiveCompanyConfigs, saveConfigs} =
    useGeneralSettingsConfig();

  const [webGoogleMapsApiKey, setWebGoogleMapsApiKey] = useState('');
  const [androidGoogleMapsApiKey, setAndroidGoogleMapsApiKey] = useState('');

  useEffect(() => {
    const nextSettings = resolveGoogleMapsSettings(effectiveCompanyConfigs);

    setWebGoogleMapsApiKey(nextSettings.webGoogleMapsApiKey);
    setAndroidGoogleMapsApiKey(nextSettings.androidGoogleMapsApiKey);
  }, [effectiveCompanyConfigs]);

  const saveMapsSettings = useCallback(async () => {
    await saveConfigs({
      [GOOGLE_MAPS_WEB_API_KEY_CONFIG_KEY]: String(
        webGoogleMapsApiKey || '',
      ).trim(),
      [GOOGLE_MAPS_ANDROID_API_KEY_CONFIG_KEY]: String(
        androidGoogleMapsApiKey || '',
      ).trim(),
    });
  }, [androidGoogleMapsApiKey, saveConfigs, webGoogleMapsApiKey]);

  return (
    <GeneralSettingsSection
      description="Define as chaves do Google Maps salvas na config publica da empresa. O display de entregas usa a chave web em runtime, sem depender de build."
      icon="map"
      iconBackgroundColor={themePalette.cardIconBackground}
      iconColor={themePalette.cardIconColor}
      title="Mapas">
      <View style={localStyles.fieldBlock}>
        <Text style={localStyles.fieldLabel}>Chave do Google Maps Web</Text>
        <Text style={localStyles.helperText}>
          Usada no display web para carregar o mapa de entregas recentes.
        </Text>
        <TextInput
          value={webGoogleMapsApiKey}
          onChangeText={setWebGoogleMapsApiKey}
          onBlur={saveMapsSettings}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Cole a chave do Google Maps para web"
          placeholderTextColor={themePalette.inputPlaceholderText}
          style={localStyles.input}
        />
      </View>

      <View style={localStyles.fieldBlock}>
        <Text style={localStyles.fieldLabel}>Chave do Google Maps Android</Text>
        <Text style={localStyles.helperText}>
          Reserve esta chave para fluxos nativos baseados no SDK do Google Maps. O display de entregas no Android usa a chave web, porque renderiza o mapa em WebView.
        </Text>
        <TextInput
          value={androidGoogleMapsApiKey}
          onChangeText={setAndroidGoogleMapsApiKey}
          onBlur={saveMapsSettings}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Cole a chave do Google Maps para Android"
          placeholderTextColor={themePalette.inputPlaceholderText}
          style={localStyles.input}
        />
      </View>
    </GeneralSettingsSection>
  );
};

export default MapsSection;
