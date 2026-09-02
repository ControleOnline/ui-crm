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
import {
  PRIMARY_ENTRY_LABELS,
  resolveAddressCoords,
  buildStaticMapUrl,
  buildOsmStaticMapUrl,
  buildLeafletMapHtml,
} from './mapsSectionHelpers';
import MapsMapasControls from './MapsMapasControls';
import MapsFranchisePreview from './MapsFranchisePreview';

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
      <MapsMapasControls
        androidGoogleMapsApiKey={androidGoogleMapsApiKey}
        franchiseAddressCategories={franchiseAddressCategories}
        franchiseAddressCategoryIds={franchiseAddressCategoryIds}
        franchiseLocatorEnabled={franchiseLocatorEnabled}
        isLoadingCategories={isLoadingCategories}
        localStyles={localStyles}
        primaryEntry={primaryEntry}
        primaryEntryOptions={primaryEntryOptions}
        salesPageEnabled={salesPageEnabled}
        saveMapsSettings={saveMapsSettings}
        selectPrimaryEntry={selectPrimaryEntry}
        setAndroidGoogleMapsApiKey={setAndroidGoogleMapsApiKey}
        setWebGoogleMapsApiKey={setWebGoogleMapsApiKey}
        themePalette={themePalette}
        toggleFranchiseAddressCategory={toggleFranchiseAddressCategory}
        toggleFranchiseLocator={toggleFranchiseLocator}
        toggleSalesPage={toggleSalesPage}
        webGoogleMapsApiKey={webGoogleMapsApiKey}
      />

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

          <MapsFranchisePreview
            isLoadingFranchiseDirectory={isLoadingFranchiseDirectory}
            leafletMapHtml={leafletMapHtml}
            localStyles={localStyles}
            mapBoxWidth={mapBoxWidth}
            mapMarkers={mapMarkers}
            previewMapUrl={previewMapUrl}
            setMapBoxWidth={setMapBoxWidth}
            themePalette={themePalette}
            visibleFranchiseCompanyIds={visibleFranchiseCompanyIds}
          />
        </>
      ) : null}
    </GeneralSettingsSection>
  );
};

export default MapsSection;
