import React, {useCallback, useEffect, useState} from 'react';
import {Text, TextInput, TouchableOpacity, View} from 'react-native';
import css from '@controleonline/ui-orders/src/react/css/orders';

import localStyles from '../GeneralSettings.styles';
import GeneralSettingsSection from '../GeneralSettingsSection';
import {useGeneralSettingsConfig} from '../GeneralSettings.shared';
import {
  GOOGLE_MAPS_ANDROID_API_KEY_CONFIG_KEY,
  GOOGLE_MAPS_WEB_API_KEY_CONFIG_KEY,
  resolveGoogleMapsSettings,
} from '@controleonline/ui-common/src/react/utils/googleMapsConfig';

const MapsSection = () => {
  const {globalStyles} = css();
  const {currentCompany, effectiveCompanyConfigs, isSaving, saveConfigs} =
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
      iconBackgroundColor="#E0F2FE"
      iconColor="#0369A1"
      title="Mapas">
      <View style={localStyles.fieldBlock}>
        <Text style={localStyles.fieldLabel}>Chave do Google Maps Web</Text>
        <Text style={localStyles.helperText}>
          Usada no display web para carregar o mapa de entregas recentes.
        </Text>
        <TextInput
          value={webGoogleMapsApiKey}
          onChangeText={setWebGoogleMapsApiKey}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Cole a chave do Google Maps para web"
          placeholderTextColor="#94A3B8"
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
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Cole a chave do Google Maps para Android"
          placeholderTextColor="#94A3B8"
          style={localStyles.input}
        />
      </View>

      <TouchableOpacity
        style={[
          globalStyles.button,
          localStyles.primaryButton,
          (!currentCompany?.id || isSaving) && localStyles.primaryButtonDisabled,
        ]}
        disabled={!currentCompany?.id || isSaving}
        onPress={saveMapsSettings}>
        <Text style={localStyles.primaryButtonText}>Salvar chaves do mapa</Text>
      </TouchableOpacity>
    </GeneralSettingsSection>
  );
};

export default MapsSection;
