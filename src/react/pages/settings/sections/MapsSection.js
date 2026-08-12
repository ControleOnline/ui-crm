/*
 * @agents This section controls the map and location settings for the CRM page.
 * Keep the address and location behavior tied to shared config keys and company context.
 */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Text, TextInput, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {useStore} from '@store';
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
import {
  resolveShopSettings,
  SHOP_FRANCHISE_ADDRESS_CATEGORY_CONTEXT,
  SHOP_FRANCHISE_ADDRESS_CATEGORY_IDS_CONFIG_KEY,
} from '@controleonline/ui-common/src/react/utils/shopConfig';

const MapsSection = () => {
  const localStyles = useGeneralSettingsStyles();
  const themePalette = useGeneralSettingsPalette();
  const categoriesStore = useStore('categories');
  const categoryActions = categoriesStore.actions;
  const {
    defaultCompany,
    effectiveCompanyConfigs,
    saveConfigs,
    saveDefaultCompanyConfigs,
  } =
    useGeneralSettingsConfig();

  const [webGoogleMapsApiKey, setWebGoogleMapsApiKey] = useState('');
  const [androidGoogleMapsApiKey, setAndroidGoogleMapsApiKey] = useState('');
  const [franchiseAddressCategories, setFranchiseAddressCategories] =
    useState([]);
  const [franchiseAddressCategoryIds, setFranchiseAddressCategoryIds] =
    useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const defaultCompanyId = defaultCompany?.id || defaultCompany?.['@id'];
  const defaultCompanyIri = defaultCompanyId ? '/people/' + defaultCompanyId : '';
  const shopSettings = useMemo(
    () => resolveShopSettings(effectiveCompanyConfigs),
    [effectiveCompanyConfigs],
  );

  useEffect(() => {
    const nextSettings = resolveGoogleMapsSettings(effectiveCompanyConfigs);

    setWebGoogleMapsApiKey(nextSettings.webGoogleMapsApiKey);
    setAndroidGoogleMapsApiKey(nextSettings.androidGoogleMapsApiKey);
    setFranchiseAddressCategoryIds(
      shopSettings.franchiseAddressCategoryIds || [],
    );
  }, [effectiveCompanyConfigs, shopSettings.franchiseAddressCategoryIds]);

  useEffect(() => {
    if (!defaultCompanyIri || !categoryActions?.getItems) {
      setFranchiseAddressCategories([]);
      return undefined;
    }

    let isMounted = true;
    setIsLoadingCategories(true);

    categoryActions
      .getItems({
        context: SHOP_FRANCHISE_ADDRESS_CATEGORY_CONTEXT,
        people: defaultCompanyIri,
        itemsPerPage: 100,
      })
      .then(result => {
        const items = Array.isArray(result)
          ? result
          : result?.member ||
            result?.['hydra:member'] ||
            categoriesStore.getters?.items ||
            [];

        if (isMounted) {
          setFranchiseAddressCategories(Array.isArray(items) ? items : []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setFranchiseAddressCategories([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingCategories(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [categoryActions, categoriesStore.getters, defaultCompanyIri]);

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

  const toggleFranchiseAddressCategory = useCallback(
    category => {
      const categoryId = String(category?.id || category?.['@id'] || '')
        .replace(/\D+/g, '')
        .trim();

      if (!categoryId) {
        return;
      }

      const selectedIds = new Set(franchiseAddressCategoryIds);
      if (selectedIds.has(categoryId)) {
        selectedIds.delete(categoryId);
      } else {
        selectedIds.add(categoryId);
      }

      const nextIds = Array.from(selectedIds);
      setFranchiseAddressCategoryIds(nextIds);

      saveDefaultCompanyConfigs({
        [SHOP_FRANCHISE_ADDRESS_CATEGORY_IDS_CONFIG_KEY]: nextIds,
      }).then(saved => {
        if (!saved) {
          setFranchiseAddressCategoryIds(franchiseAddressCategoryIds);
        }
      });
    },
    [
      franchiseAddressCategoryIds,
      saveDefaultCompanyConfigs,
    ],
  );

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

      <View style={localStyles.fieldBlock}>
        <Text style={localStyles.fieldLabel}>
          Categorias de endereços no mapa de franquias
        </Text>
        {isLoadingCategories ? (
          <ActivityIndicator size={22} color={themePalette.primary} />
        ) : franchiseAddressCategories.length === 0 ? (
          <Text style={localStyles.helperText}>
            Nenhuma categoria de endereço encontrada.
          </Text>
        ) : (
          <View>
            {franchiseAddressCategories.map(category => {
              const categoryId = String(category?.id || category?.['@id'] || '')
                .replace(/\D+/g, '')
                .trim();
              const selected = franchiseAddressCategoryIds.includes(categoryId);

              return (
                <TouchableOpacity
                  activeOpacity={0.85}
                  key={category?.['@id'] || category?.id}
                  onPress={() => toggleFranchiseAddressCategory(category)}
                  style={[
                    localStyles.franchiseAddressOption,
                    selected && localStyles.franchiseAddressOptionActive,
                  ]}>
                  <View style={localStyles.franchiseAddressOptionCopy}>
                    <Text style={localStyles.franchiseAddressName}>
                      {category?.name || `Categoria #${categoryId}`}
                    </Text>
                  </View>
                  <Icon
                    name={selected ? 'check-box' : 'check-box-outline-blank'}
                    size={22}
                    color={selected ? themePalette.primary : themePalette.textMuted}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </GeneralSettingsSection>
  );
};

export default MapsSection;
