/*
 * @agents This section controls map keys, shop primary entry (mapa vs vitrine),
 * franchise-locator enablement, franchise address categories, franchise list
 * with visibility checkboxes and preview map pins for app_type=shop.
 */
import React, {createElement, useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import css from '@controleonline/ui-orders/src/react/css/orders';

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
  getEnabledShopHomeOptions,
  normalizeBooleanConfig,
  normalizeShopEntityId,
  normalizeShopPrimaryEntry,
  resolveShopSettings,
  saveAndUpdateConfigValue,
  SHOP_FRANCHISE_ADDRESS_CATEGORY_CONTEXT,
  SHOP_FRANCHISE_ADDRESS_CATEGORY_IDS_CONFIG_KEY,
  SHOP_FRANCHISE_LOCATOR_ENABLED_CONFIG_KEY,
  SHOP_FRANCHISE_VISIBLE_ADDRESS_IDS_CONFIG_KEY,
  SHOP_FRANCHISE_VISIBLE_COMPANY_IDS_CONFIG_KEY,
  SHOP_HOME_OPTION_FRANCHISE_LOCATOR,
  SHOP_HOME_OPTION_SALES,
  SHOP_PRIMARY_ENTRY_CONFIG_KEY,
  SHOP_SALES_PAGE_ENABLED_CONFIG_KEY,
} from '@controleonline/ui-common/src/react/utils/shopConfig';
import {fetchAllShopFranchiseDirectory} from '@controleonline/ui-common/src/react/utils/shopFranchises';
import ShopFranchiseLocatorSection from './shop/ShopFranchiseLocatorSection';
import {
  buildFranchiseAddressesById,
  normalizeVisibleFranchiseIds,
} from './shop/shopFranchiseVisibility';
import {
  resolveAddressLabel,
  resolveCompanyLabel,
} from './shop/shopSettingsShared';

const PRIMARY_ENTRY_LABELS = {
  [SHOP_HOME_OPTION_SALES]: 'Vitrine do shop',
  [SHOP_HOME_OPTION_FRANCHISE_LOCATOR]: 'Mapa das franquias',
};

const parseCoord = value => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const n = Number(value);
  if (!Number.isFinite(n) || Math.abs(n) < 0.000001) {
    return null;
  }
  return n;
};

const resolveAddressCoords = address => {
  const lat = parseCoord(
    address?.latitude ??
      address?.lat ??
      address?.map?.latitude ??
      address?.map?.lat ??
      address?.geo?.latitude,
  );
  const lng = parseCoord(
    address?.longitude ??
      address?.lng ??
      address?.lon ??
      address?.map?.longitude ??
      address?.map?.lng ??
      address?.map?.lon ??
      address?.geo?.longitude,
  );
  if (lat === null || lng === null) {
    return null;
  }
  return {lat, lng};
};

const buildStaticMapUrl = ({apiKey, markers, size = '640x320'}) => {
  if (!apiKey || !Array.isArray(markers) || markers.length === 0) {
    return null;
  }
  const markerParams = markers
    .slice(0, 40)
    .map(
      m =>
        `markers=color:red%7C${encodeURIComponent(`${m.lat},${m.lng}`)}`,
    )
    .join('&');
  const center = markers[0];
  return `https://maps.googleapis.com/maps/api/staticmap?size=${size}&maptype=roadmap&center=${center.lat},${center.lng}&zoom=${markers.length === 1 ? 14 : 11}&${markerParams}&key=${encodeURIComponent(apiKey)}`;
};

/** Fallback without Google key — OpenStreetMap static (multi-marker). */
const buildOsmStaticMapUrl = (markers, size = '640x320') => {
  if (!Array.isArray(markers) || markers.length === 0) {
    return null;
  }
  const center = markers[0];
  const zoom = markers.length === 1 ? 14 : 11;
  const markerParams = markers
    .slice(0, 40)
    .map(m => `markers=${m.lat},${m.lng},red-pushpin`)
    .join('&');
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${center.lat},${center.lng}&zoom=${zoom}&size=${size}&maptype=mapnik&${markerParams}`;
};

/** Interactive Leaflet map HTML for web iframe (no API key). */
const buildLeafletMapHtml = markers => {
  if (!Array.isArray(markers) || markers.length === 0) {
    return '';
  }
  const points = markers.slice(0, 40).map(m => ({
    lat: Number(m.lat),
    lng: Number(m.lng),
    label: String(m.companyLabel || m.label || 'Franquia'),
  }));
  const center = points[0];
  const markersJs = points
    .map(
      p =>
        `L.marker([${p.lat}, ${p.lng}]).addTo(map).bindPopup(${JSON.stringify(
          p.label,
        )});`,
    )
    .join('\n');
  const fitJs =
    points.length > 1
      ? `map.fitBounds([${points
          .map(p => `[${p.lat}, ${p.lng}]`)
          .join(', ')}], {padding: [28, 28]});`
      : '';
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
html,body{margin:0;padding:0;height:100%;width:100%;overflow:hidden;}
#map{position:absolute;inset:0;width:100%;height:100%;}
.leaflet-container{width:100%!important;height:100%!important;font:12px/1.4 system-ui,sans-serif;}
</style>
</head>
<body style="position:relative;width:100%;height:100%;">
<div id="map"></div>
<script>
var map = L.map('map').setView([${center.lat}, ${center.lng}], ${points.length === 1 ? 14 : 11});
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap'
}).addTo(map);
${markersJs}
${fitJs}
function resizeMap(){ map.invalidateSize(true); }
setTimeout(resizeMap, 0);
setTimeout(resizeMap, 100);
setTimeout(resizeMap, 400);
window.addEventListener('resize', resizeMap);
if (typeof ResizeObserver !== 'undefined') {
  new ResizeObserver(resizeMap).observe(document.getElementById('map'));
}
</script>
</body>
</html>`;
};


const MapsSection = () => {
  const {globalStyles} = css();
  const localStyles = useGeneralSettingsStyles();
  const themePalette = useGeneralSettingsPalette();
  const categoriesStore = useStore('categories');
  const categoryActions = categoriesStore.actions;
  const {
    currentCompany,
    defaultCompany,
    effectiveCompanyConfigs,
    saveConfig,
    saveConfigs,
    saveDefaultCompanyConfigs,
  } = useGeneralSettingsConfig();

  const [webGoogleMapsApiKey, setWebGoogleMapsApiKey] = useState('');
  const [androidGoogleMapsApiKey, setAndroidGoogleMapsApiKey] = useState('');
  const [mapBoxWidth, setMapBoxWidth] = useState(0);
  const [franchiseAddressCategories, setFranchiseAddressCategories] =
    useState([]);
  const [franchiseAddressCategoryIds, setFranchiseAddressCategoryIds] =
    useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [salesPageEnabled, setSalesPageEnabled] = useState(false);
  const [franchiseLocatorEnabled, setFranchiseLocatorEnabled] = useState(false);
  const [primaryEntry, setPrimaryEntry] = useState('');
  const [franchiseDirectory, setFranchiseDirectory] = useState([]);
  const [isLoadingFranchiseDirectory, setIsLoadingFranchiseDirectory] =
    useState(false);
  const [visibleFranchiseAddressIds, setVisibleFranchiseAddressIds] = useState(
    [],
  );
  const [visibleFranchiseCompanyIds, setVisibleFranchiseCompanyIds] = useState(
    [],
  );

  const defaultCompanyId = defaultCompany?.id || defaultCompany?.['@id'];
  const defaultCompanyIri = defaultCompanyId
    ? '/people/' + defaultCompanyId
    : '';
  const currentCompanyId = normalizeShopEntityId(
    currentCompany?.id || currentCompany?.['@id'],
  );
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

    const nextSales = normalizeBooleanConfig(
      effectiveCompanyConfigs?.[SHOP_SALES_PAGE_ENABLED_CONFIG_KEY],
    );
    const nextLocator = normalizeBooleanConfig(
      effectiveCompanyConfigs?.[SHOP_FRANCHISE_LOCATOR_ENABLED_CONFIG_KEY],
    );
    setSalesPageEnabled(nextSales);
    setFranchiseLocatorEnabled(nextLocator);
    setPrimaryEntry(
      normalizeShopPrimaryEntry(
        effectiveCompanyConfigs?.[SHOP_PRIMARY_ENTRY_CONFIG_KEY],
        {
          salesPageEnabled: nextSales,
          franchiseLocatorEnabled: nextLocator,
          loyaltyCouponsEnabled: false,
        },
      ),
    );
    setVisibleFranchiseCompanyIds(
      normalizeVisibleFranchiseIds(
        effectiveCompanyConfigs?.[SHOP_FRANCHISE_VISIBLE_COMPANY_IDS_CONFIG_KEY],
      ),
    );
    setVisibleFranchiseAddressIds(
      normalizeVisibleFranchiseIds(
        effectiveCompanyConfigs?.[SHOP_FRANCHISE_VISIBLE_ADDRESS_IDS_CONFIG_KEY],
      ),
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

  useEffect(() => {
    if (!franchiseLocatorEnabled || !currentCompanyId) {
      setFranchiseDirectory([]);
      setIsLoadingFranchiseDirectory(false);
      return undefined;
    }
    let cancelled = false;
    setIsLoadingFranchiseDirectory(true);
    fetchAllShopFranchiseDirectory({companyId: currentCompanyId})
      .then(items => {
        if (!cancelled) {
          setFranchiseDirectory(Array.isArray(items) ? items : []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFranchiseDirectory([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingFranchiseDirectory(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [currentCompanyId, franchiseLocatorEnabled]);

  const enabledHomeOptions = useMemo(
    () =>
      getEnabledShopHomeOptions({
        salesPageEnabled,
        franchiseLocatorEnabled,
        loyaltyCouponsEnabled: false,
      }),
    [franchiseLocatorEnabled, salesPageEnabled],
  );

  const primaryEntryOptions = useMemo(
    () =>
      enabledHomeOptions
        .filter(
          option =>
            option === SHOP_HOME_OPTION_SALES ||
            option === SHOP_HOME_OPTION_FRANCHISE_LOCATOR,
        )
        .map(option => ({
          value: option,
          label: PRIMARY_ENTRY_LABELS[option] || option,
        })),
    [enabledHomeOptions],
  );

  const franchiseAddressesById = useMemo(
    () => buildFranchiseAddressesById(franchiseDirectory),
    [franchiseDirectory],
  );

  const mapMarkers = useMemo(() => {
    // Exactly one pin per checked franchise (primary address with coordinates).
    const selectedCompanyIds = new Set(
      (visibleFranchiseCompanyIds || [])
        .map(normalizeShopEntityId)
        .filter(Boolean),
    );
    const markers = [];
    const seenCompanies = new Set();

    (Array.isArray(franchiseDirectory) ? franchiseDirectory : []).forEach(
      company => {
        const companyId = normalizeShopEntityId(company);
        if (!companyId || !selectedCompanyIds.has(companyId)) {
          return;
        }
        if (seenCompanies.has(companyId)) {
          return;
        }

        const addresses = Array.isArray(company?.shopAddresses)
          ? company.shopAddresses
          : [];
        // Prefer first address that has valid lat/long.
        let chosen = null;
        for (const address of addresses) {
          const coords = resolveAddressCoords(address);
          if (coords) {
            chosen = {address, coords};
            break;
          }
        }
        if (!chosen) {
          return;
        }

        seenCompanies.add(companyId);
        const addressId = normalizeShopEntityId(chosen.address);
        markers.push({
          ...chosen.coords,
          addressId: addressId || `${companyId}-primary`,
          companyId,
          label: resolveAddressLabel(chosen.address),
          companyLabel: resolveCompanyLabel(company),
        });
      },
    );

    return markers;
  }, [franchiseDirectory, visibleFranchiseCompanyIds]);

  const staticMapUrl = useMemo(
    () =>
      buildStaticMapUrl({
        apiKey: webGoogleMapsApiKey,
        markers: mapMarkers,
        size: '1280x480',
      }),
    [mapMarkers, webGoogleMapsApiKey],
  );

  const osmStaticMapUrl = useMemo(
    () => buildOsmStaticMapUrl(mapMarkers, '1280x480'),
    [mapMarkers],
  );

  const leafletMapHtml = useMemo(
    () => buildLeafletMapHtml(mapMarkers),
    [mapMarkers],
  );

  const previewMapUrl = staticMapUrl || osmStaticMapUrl;

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
      const nextIds = franchiseAddressCategoryIds.includes(categoryId)
        ? franchiseAddressCategoryIds.filter(id => id !== categoryId)
        : [...franchiseAddressCategoryIds, categoryId];
      setFranchiseAddressCategoryIds(nextIds);
      const saved = saveDefaultCompanyConfigs?.({
        [SHOP_FRANCHISE_ADDRESS_CATEGORY_IDS_CONFIG_KEY]: nextIds,
      });
      if (!saved) {
        setFranchiseAddressCategoryIds(franchiseAddressCategoryIds);
      }
    },
    [franchiseAddressCategoryIds, saveDefaultCompanyConfigs],
  );

  const toggleSalesPage = useCallback(() => {
    const next = !salesPageEnabled;
    saveAndUpdateConfigValue({
      configKey: SHOP_SALES_PAGE_ENABLED_CONFIG_KEY,
      nextValue: next,
      saveConfig,
      setValue: setSalesPageEnabled,
    });
  }, [salesPageEnabled, saveConfig]);

  const toggleFranchiseLocator = useCallback(() => {
    const next = !franchiseLocatorEnabled;
    saveAndUpdateConfigValue({
      configKey: SHOP_FRANCHISE_LOCATOR_ENABLED_CONFIG_KEY,
      nextValue: next,
      saveConfig,
      setValue: setFranchiseLocatorEnabled,
    });
  }, [franchiseLocatorEnabled, saveConfig]);

  const selectPrimaryEntry = useCallback(
    value => {
      if (primaryEntryOptions.length <= 1) {
        return;
      }
      saveAndUpdateConfigValue({
        configKey: SHOP_PRIMARY_ENTRY_CONFIG_KEY,
        nextValue: value,
        saveConfig,
        setValue: setPrimaryEntry,
      });
    },
    [primaryEntryOptions.length, saveConfig],
  );

  return (
    <GeneralSettingsSection
      description="Chaves do Google Maps, tela principal do shop (mapa de franquias vs vitrine), localizador e categorias de endereço no mapa."
      icon="map"
      iconBackgroundColor={themePalette.cardIconBackground}
      iconColor={themePalette.cardIconColor}
      title="Mapas">
      <View style={localStyles.fieldBlock}>
        <Text style={localStyles.fieldLabel}>Chave do Google Maps Web</Text>
        <Text style={localStyles.helperText}>
          Usada no display web e no mapa de franquias do shop.
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
          Reserve para fluxos nativos. O display de entregas no Android usa a
          chave web (WebView).
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

      <View style={localStyles.settingRow}>
        <View style={localStyles.settingCopy}>
          <Text style={localStyles.statusLabel}>Vitrine do shop</Text>
          <Text style={localStyles.settingDescription}>
            Ativa a vitrine principal (categorias/produtos) como entrada do
            app_type=shop.
          </Text>
        </View>
        <TouchableOpacity
          style={[
            localStyles.statusChip,
            salesPageEnabled
              ? localStyles.statusChipEnabled
              : localStyles.statusChipDisabled,
          ]}
          activeOpacity={0.85}
          onPress={toggleSalesPage}>
          <Icon
            name={salesPageEnabled ? 'check-circle' : 'block'}
            size={16}
            color={
              salesPageEnabled
                ? themePalette.badgeSelectedText
                : themePalette.badgeDisabledText
            }
          />
          <Text
            style={[
              localStyles.statusChipText,
              {
                color: salesPageEnabled
                  ? themePalette.badgeSelectedText
                  : themePalette.badgeDisabledText,
              },
            ]}>
            {salesPageEnabled ? 'Ativado' : 'Desativado'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={localStyles.settingRow}>
        <View style={localStyles.settingCopy}>
          <Text style={localStyles.statusLabel}>Localizador de franquias</Text>
          <Text style={localStyles.settingDescription}>
            Ativa o mapa das franquias como entrada do app_type=shop.
          </Text>
        </View>
        <TouchableOpacity
          style={[
            localStyles.statusChip,
            franchiseLocatorEnabled
              ? localStyles.statusChipEnabled
              : localStyles.statusChipDisabled,
          ]}
          activeOpacity={0.85}
          onPress={toggleFranchiseLocator}>
          <Icon
            name={franchiseLocatorEnabled ? 'check-circle' : 'block'}
            size={16}
            color={
              franchiseLocatorEnabled
                ? themePalette.badgeSelectedText
                : themePalette.badgeDisabledText
            }
          />
          <Text
            style={[
              localStyles.statusChipText,
              {
                color: franchiseLocatorEnabled
                  ? themePalette.badgeSelectedText
                  : themePalette.badgeDisabledText,
              },
            ]}>
            {franchiseLocatorEnabled ? 'Ativado' : 'Desativado'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={localStyles.fieldBlock}>
        <Text style={localStyles.fieldLabel}>Tela principal do shop</Text>
        <Text style={localStyles.helperText}>
          {primaryEntryOptions.length === 0
            ? 'Ative a vitrine e/ou o localizador acima para escolher a entrada principal.'
            : primaryEntryOptions.length === 1
              ? 'Apenas uma entrada está ativa — ela é usada automaticamente.'
              : 'Escolha qual entrada o app_type=shop abre primeiro: mapa das franquias ou vitrine.'}
        </Text>
        {primaryEntryOptions.length > 0 && (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 8,
              marginTop: 8,
            }}>
            {primaryEntryOptions.map(option => {
              const selected = primaryEntry === option.value;
              const locked = primaryEntryOptions.length === 1;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    localStyles.statusChip,
                    selected
                      ? localStyles.statusChipEnabled
                      : localStyles.statusChipDisabled,
                  ]}
                  activeOpacity={locked ? 1 : 0.85}
                  onPress={() => selectPrimaryEntry(option.value)}
                  disabled={locked}>
                  <Icon
                    name={
                      option.value === SHOP_HOME_OPTION_FRANCHISE_LOCATOR
                        ? 'map'
                        : 'storefront'
                    }
                    size={16}
                    color={
                      selected
                        ? themePalette.badgeSelectedText
                        : themePalette.badgeDisabledText
                    }
                  />
                  <Text
                    style={[
                      localStyles.statusChipText,
                      {
                        color: selected
                          ? themePalette.badgeSelectedText
                          : themePalette.badgeDisabledText,
                      },
                    ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
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
                    color={
                      selected ? themePalette.primary : themePalette.textMuted
                    }
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {franchiseLocatorEnabled ? (
        <>
          <ShopFranchiseLocatorSection
            currentCompanyId={currentCompanyId}
            effectiveCompanyConfigs={effectiveCompanyConfigs}
            localStyles={localStyles}
            saveConfigs={saveConfigs}
            themePalette={themePalette}
            globalStyles={globalStyles}
          />

          <View
            style={[localStyles.fieldBlock, {alignSelf: 'stretch', width: '100%'}]}
            testID="maps-franchise-map">
            <Text style={localStyles.fieldLabel}>Mapa das franquias</Text>
            <Text style={localStyles.helperText}>
              Pins das franquias marcadas acima (com latitude/longitude).
            </Text>
            {isLoadingFranchiseDirectory ? (
              <ActivityIndicator
                size="small"
                color={themePalette.loadingSpinner || themePalette.primary}
                style={localStyles.sectionLoader}
              />
            ) : mapMarkers.length === 0 ? (
              <View style={localStyles.emptyBox}>
                <Text style={localStyles.emptyTitle}>
                  Nenhum pin para exibir
                </Text>
                <Text style={localStyles.emptyText}>
                  Marque franquias com latitude/longitude na lista acima para
                  aparecerem no mapa.
                </Text>
              </View>
            ) : (
              <View style={{alignSelf: 'stretch', width: '100%'}}>
                <View
                  onLayout={event => {
                    const nextWidth = Math.round(
                      event?.nativeEvent?.layout?.width || 0,
                    );
                    if (nextWidth > 0 && nextWidth !== mapBoxWidth) {
                      setMapBoxWidth(nextWidth);
                    }
                  }}
                  style={{
                    alignSelf: 'stretch',
                    width: '100%',
                    height: 360,
                    borderRadius: 8,
                    overflow: 'hidden',
                    backgroundColor: themePalette.inputBackground || '#eee',
                  }}>
                  {Platform.OS === 'web' && leafletMapHtml && mapBoxWidth > 0
                    ? createElement('iframe', {
                        key: `franchise-map-${mapBoxWidth}-${mapMarkers.length}`,
                        title: 'Mapa das franquias',
                        srcDoc: leafletMapHtml,
                        width: mapBoxWidth,
                        height: 360,
                        style: {
                          width: mapBoxWidth,
                          height: 360,
                          border: 'none',
                          display: 'block',
                          margin: 0,
                          padding: 0,
                        },
                      })
                    : previewMapUrl
                      ? (
                          <Image
                            source={{uri: previewMapUrl}}
                            style={{
                              width: '100%',
                              height: 360,
                            }}
                            resizeMode="cover"
                            accessibilityLabel="Mapa das franquias com pins"
                          />
                        )
                      : null}
                </View>
                <Text style={localStyles.helperText}>
                  {mapMarkers.length} pin(s) no mapa
                  {visibleFranchiseCompanyIds.length > 0
                    ? ` · ${visibleFranchiseCompanyIds.length} franquia(s) selecionada(s)`
                    : ''}
                </Text>
              </View>
            )}
          </View>
        </>
      ) : null}
    </GeneralSettingsSection>
  );
};

export default MapsSection;
