/*
 * @agents Franchise locator visibility (companies + addresses) for shop general settings.
 * Persist only on explicit user toggles — never auto-save prunes after refresh.
 */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  fetchAllShopFranchiseDirectory,
  resolveFranchiseAddressCoords,
} from '@controleonline/ui-common/src/react/utils/shopFranchises';
import {
  normalizeShopEntityId,
  SHOP_FRANCHISE_VISIBLE_ADDRESS_IDS_CONFIG_KEY,
  SHOP_FRANCHISE_VISIBLE_COMPANY_IDS_CONFIG_KEY,
} from '@controleonline/ui-common/src/react/utils/shopConfig';
import {
  buildFranchiseAddressesById,
  buildFranchiseCompaniesById,
  normalizeVisibleFranchiseIds,
  pruneFranchiseAddressIds,
  resolveSelectedFranchiseCompanies,
} from './shopFranchiseVisibility';
import {
  SelectionModal,
  buildNormalizedSearchText,
  filterSelectableItems,
  resolveAddressDetail,
  resolveAddressLabel,
  resolveCompanyLabel,
  resolveCompanyMeta,
  useLocalSelectionBrowser,
} from './shopSettingsShared';

const ShopFranchiseLocatorSection = ({
  currentCompanyId,
  effectiveCompanyConfigs,
  localStyles,
  saveConfigs,
  themePalette,
  globalStyles,
}) => {
  const navigation = useNavigation();
  const [visibleFranchiseCompanyIds, setVisibleFranchiseCompanyIds] = useState([]);
  const [visibleFranchiseAddressIds, setVisibleFranchiseAddressIds] = useState([]);
  const [franchiseCompanySearch, setFranchiseCompanySearch] = useState('');
  const [franchiseDirectory, setFranchiseDirectory] = useState([]);
  const [isLoadingFranchiseDirectory, setIsLoadingFranchiseDirectory] = useState(false);
  const [franchiseCompanySelectorVisible, setFranchiseCompanySelectorVisible] = useState(false);

  useEffect(() => {
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
  }, [effectiveCompanyConfigs]);

  useEffect(() => {
    if (!currentCompanyId) {
      setFranchiseDirectory([]);
      setIsLoadingFranchiseDirectory(false);
      return;
    }
    let cancelled = false;
    setIsLoadingFranchiseDirectory(true);
    fetchAllShopFranchiseDirectory({companyId: currentCompanyId})
      .then(items => {
        if (!cancelled) setFranchiseDirectory(Array.isArray(items) ? items : []);
      })
      .catch(() => {
        if (!cancelled) setFranchiseDirectory([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingFranchiseDirectory(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentCompanyId]);

  const availableFranchiseCompanies = useMemo(
    () => franchiseDirectory.filter(Boolean),
    [franchiseDirectory],
  );

  const franchiseCompanyBrowser = useLocalSelectionBrowser({
    items: availableFranchiseCompanies,
    visible: franchiseCompanySelectorVisible,
    resolveSearchText: company =>
      buildNormalizedSearchText(
        resolveCompanyLabel(company),
        resolveCompanyMeta(company),
      ),
  });

  const franchiseCompaniesById = useMemo(
    () => buildFranchiseCompaniesById(availableFranchiseCompanies),
    [availableFranchiseCompanies],
  );
  const franchiseAddressesById = useMemo(
    () => buildFranchiseAddressesById(availableFranchiseCompanies),
    [availableFranchiseCompanies],
  );
  const selectedFranchiseCompanies = useMemo(
    () =>
      resolveSelectedFranchiseCompanies({
        companyIds: visibleFranchiseCompanyIds,
        companiesById: franchiseCompaniesById,
      }),
    [franchiseCompaniesById, visibleFranchiseCompanyIds],
  );

  const selectedFranchiseAddressGroups = useMemo(
    () =>
      selectedFranchiseCompanies.map(company => {
        const linkedCompany = {
          id: company?.id,
          alias: company?.alias,
          name: company?.name,
        };
        const addresses = (company?.shopAddresses || []).map(address => ({
          ...address,
          linkedCompany,
        }));
        const selectedCount = addresses.filter(address =>
          visibleFranchiseAddressIds.includes(normalizeShopEntityId(address)),
        ).length;
        return {addresses, company, selectedCount};
      }),
    [selectedFranchiseCompanies, visibleFranchiseAddressIds],
  );

  const hasFranchiseCompanySearch = String(franchiseCompanySearch || '').trim() !== '';
  const visibleFranchiseCompanyResults = useMemo(() => {
    if (!hasFranchiseCompanySearch) return [];
    return filterSelectableItems({
      items: availableFranchiseCompanies.filter(
        company =>
          !visibleFranchiseCompanyIds.includes(normalizeShopEntityId(company)),
      ),
      query: franchiseCompanySearch,
      resolveSearchText: company =>
        buildNormalizedSearchText(
          resolveCompanyLabel(company),
          resolveCompanyMeta(company),
        ),
    });
  }, [
    availableFranchiseCompanies,
    franchiseCompanySearch,
    hasFranchiseCompanySearch,
    visibleFranchiseCompanyIds,
  ]);

  useEffect(() => {
    if (visibleFranchiseCompanyIds.length === 0) {
      if (visibleFranchiseAddressIds.length === 0) return;
      setVisibleFranchiseAddressIds([]);
      return;
    }
    if (Object.keys(franchiseAddressesById).length === 0) return;
    const nextAddressIds = pruneFranchiseAddressIds({
      addressIds: visibleFranchiseAddressIds,
      companyIds: visibleFranchiseCompanyIds,
      addressesById: franchiseAddressesById,
    });
    if (
      nextAddressIds.length === visibleFranchiseAddressIds.length &&
      nextAddressIds.every(
        (addressId, index) => addressId === visibleFranchiseAddressIds[index],
      )
    ) {
      return;
    }
    setVisibleFranchiseAddressIds(nextAddressIds);
  }, [franchiseAddressesById, visibleFranchiseAddressIds, visibleFranchiseCompanyIds]);

  const saveFranchiseVisibility = useCallback(
    (nextCompanyIds, nextAddressIds) => {
      setVisibleFranchiseCompanyIds(nextCompanyIds);
      setVisibleFranchiseAddressIds(nextAddressIds);
      return saveConfigs({
        [SHOP_FRANCHISE_VISIBLE_COMPANY_IDS_CONFIG_KEY]: nextCompanyIds,
        [SHOP_FRANCHISE_VISIBLE_ADDRESS_IDS_CONFIG_KEY]: nextAddressIds,
      });
    },
    [saveConfigs],
  );

  const companyHasMapCoords = useCallback(company => {
    const addresses = Array.isArray(company?.shopAddresses)
      ? company.shopAddresses
      : [];
    const primary = addresses[0];
    if (!primary) {
      return false;
    }
    const coords = resolveFranchiseAddressCoords(primary);
    return (
      coords.latitude != null &&
      coords.longitude != null &&
      Math.abs(Number(coords.latitude)) > 0.000001 &&
      Math.abs(Number(coords.longitude)) > 0.000001
    );
  }, []);

  const toggleFranchiseCompany = useCallback(
    company => {
      const companyId = normalizeShopEntityId(company);
      if (!companyId) return;
      // Sem lat/long não pode entrar no mapa.
      if (!companyHasMapCoords(company)) {
        return;
      }
      const isSelected = visibleFranchiseCompanyIds.includes(companyId);
      const nextCompanyIds = isSelected
        ? visibleFranchiseCompanyIds.filter(item => item !== companyId)
        : [...visibleFranchiseCompanyIds, companyId];

      // Keep address visibility in sync with selected companies.
      // When selecting a franchise, auto-include all of its addresses for the map.
      const companyAddressIds = (
        Array.isArray(company?.shopAddresses) ? company.shopAddresses : []
      )
        .map(addr => normalizeShopEntityId(addr))
        .filter(Boolean);

      let nextAddressIds;
      if (isSelected) {
        nextAddressIds = visibleFranchiseAddressIds.filter(
          addressId => !companyAddressIds.includes(addressId),
        );
      } else {
        const merged = new Set([
          ...visibleFranchiseAddressIds,
          ...companyAddressIds,
        ]);
        // Drop addresses whose company is no longer selected
        nextAddressIds = Array.from(merged).filter(addressId => {
          const address = franchiseAddressesById[addressId];
          if (!address) {
            return companyAddressIds.includes(addressId);
          }
          return nextCompanyIds.includes(
            normalizeShopEntityId(address?.linkedCompany),
          );
        });
      }

      saveFranchiseVisibility(nextCompanyIds, nextAddressIds);
    },
    [
      companyHasMapCoords,
      franchiseAddressesById,
      saveFranchiseVisibility,
      visibleFranchiseAddressIds,
      visibleFranchiseCompanyIds,
    ],
  );

  const toggleFranchiseAddress = useCallback(
    address => {
      const addressId = normalizeShopEntityId(address);
      if (!addressId) return;
      const nextAddressIds = visibleFranchiseAddressIds.includes(addressId)
        ? visibleFranchiseAddressIds.filter(item => item !== addressId)
        : [...visibleFranchiseAddressIds, addressId];
      saveFranchiseVisibility(visibleFranchiseCompanyIds, nextAddressIds);
    },
    [saveFranchiseVisibility, visibleFranchiseAddressIds, visibleFranchiseCompanyIds],
  );

  return (
    <>
      <View style={localStyles.fieldBlock}>
        <Text style={localStyles.fieldLabel}>Franquias exibidas no localizador</Text>
        <Text style={localStyles.helperText}>
          Selecione quais empresas vinculadas como franquia podem aparecer no mapa do shop.
        </Text>
        <View style={localStyles.selectorRow}>
          <TextInput
            value={franchiseCompanySearch}
            onChangeText={setFranchiseCompanySearch}
            placeholder="Buscar franquia..."
            placeholderTextColor={themePalette.inputPlaceholderText}
            style={[localStyles.input, localStyles.selectorInput]}
          />
          <TouchableOpacity
            style={localStyles.selectorListButton}
            activeOpacity={0.85}
            onPress={() => setFranchiseCompanySelectorVisible(true)}>
            <Icon name="view-list" size={18} color={themePalette.buttonIcon} />
            <Text style={localStyles.selectorListButtonText}>Lista</Text>
          </TouchableOpacity>
        </View>
        {isLoadingFranchiseDirectory ? (
          <ActivityIndicator size="small" color={themePalette.loadingSpinner} style={localStyles.sectionLoader} />
        ) : String(franchiseCompanySearch || '').trim() && visibleFranchiseCompanyResults.length === 0 ? (
          <View style={localStyles.emptyBox}>
            <Text style={localStyles.emptyTitle}>Nenhuma franquia encontrada</Text>
            <Text style={localStyles.emptyText}>Tente outro termo ou abra a lista completa ao lado.</Text>
          </View>
        ) : (
          visibleFranchiseCompanyResults.length > 0 && (
            <View style={localStyles.printerList}>
              {visibleFranchiseCompanyResults.map(company => {
                const companyId = normalizeShopEntityId(company);
                return (
                  <TouchableOpacity
                    key={`shop-franchise-company-search-${companyId}`}
                    style={localStyles.printerItem}
                    activeOpacity={0.85}
                    onPress={() => toggleFranchiseCompany(company)}>
                    <Icon name="storefront" size={20} color={themePalette.cardIconColor} />
                    <View style={localStyles.printerCopy}>
                      <Text style={localStyles.printerName}>{resolveCompanyLabel(company)}</Text>
                      <Text style={localStyles.printerDevice}>{resolveCompanyMeta(company) || 'Toque para liberar'}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )
        )}
        <Text style={localStyles.helperText}>
          {availableFranchiseCompanies.length > 0
            ? `${availableFranchiseCompanies.length} franquia(s) · ${visibleFranchiseCompanyIds.length} no mapa.`
            : 'Nenhuma franquia vinculada à empresa atual.'}
        </Text>
        {isLoadingFranchiseDirectory ? (
          <ActivityIndicator
            size="small"
            color={themePalette.loadingSpinner}
            style={localStyles.sectionLoader}
          />
        ) : availableFranchiseCompanies.length === 0 ? (
          <View style={localStyles.emptyBox}>
            <Text style={localStyles.emptyTitle}>Nenhuma franquia encontrada</Text>
            <Text style={localStyles.emptyText}>
              Cadastre vínculos linkType=franchisee em Minha empresa → Franquias.
            </Text>
          </View>
        ) : (
          <View style={localStyles.printerList}>
            {availableFranchiseCompanies.map(company => {
              const companyId = normalizeShopEntityId(company);
              const selected = visibleFranchiseCompanyIds.includes(companyId);
              const addresses = Array.isArray(company?.shopAddresses)
                ? company.shopAddresses
                : [];
              const primaryAddress = addresses[0] || null;
              const coords = primaryAddress
                ? resolveFranchiseAddressCoords(primaryAddress)
                : {latitude: null, longitude: null};
              const hasCoords =
                coords.latitude != null &&
                coords.longitude != null &&
                Math.abs(Number(coords.latitude)) > 0.000001 &&
                Math.abs(Number(coords.longitude)) > 0.000001;
              const name = resolveCompanyLabel(company);
              const addressLine = primaryAddress
                ? resolveAddressDetail(primaryAddress) ||
                  resolveAddressLabel(primaryAddress) ||
                  'Endereço não informado'
                : 'Sem endereço cadastrado';
              const coordsLine = hasCoords
                ? `${Number(coords.latitude).toFixed(6)}, ${Number(
                    coords.longitude,
                  ).toFixed(6)}`
                : 'Latitude/longitude não informadas';
              const needsEdit = !primaryAddress || !hasCoords;

              return (
                <View
                  key={`shop-franchise-card-${companyId}`}
                  style={[
                    localStyles.printerItem,
                    selected && localStyles.printerItemActive,
                    {alignItems: 'flex-start'},
                  ]}>
                  <TouchableOpacity
                    activeOpacity={hasCoords ? 0.85 : 1}
                    disabled={!hasCoords}
                    onPress={() => {
                      if (!hasCoords) return;
                      toggleFranchiseCompany(company);
                    }}
                    style={{paddingTop: 2, marginRight: 10, opacity: hasCoords ? 1 : 0.4}}
                    accessibilityRole="checkbox"
                    accessibilityState={{checked: selected, disabled: !hasCoords}}
                    accessibilityLabel={
                      hasCoords
                        ? `Exibir ${name} no mapa`
                        : `${name} sem latitude/longitude — edite o endereço`
                    }>
                    <Icon
                      name={
                        !hasCoords
                          ? 'check-box-outline-blank'
                          : selected
                            ? 'check-box'
                            : 'check-box-outline-blank'
                      }
                      size={24}
                      color={
                        !hasCoords
                          ? themePalette.iconDisabled || themePalette.textMuted
                          : selected
                            ? themePalette.iconActive || themePalette.primary
                            : themePalette.iconDisabled || themePalette.textMuted
                      }
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={hasCoords ? 0.85 : 1}
                    disabled={!hasCoords}
                    onPress={() => {
                      if (!hasCoords) return;
                      toggleFranchiseCompany(company);
                    }}
                    style={[localStyles.printerCopy, {flex: 1, opacity: hasCoords ? 1 : 0.7}]}>
                    <Text style={localStyles.printerName}>{name}</Text>
                    <Text style={localStyles.printerDevice}>{addressLine}</Text>
                    <Text
                      style={[
                        localStyles.printerDevice,
                        !hasCoords && {opacity: 0.75},
                      ]}>
                      {coordsLine}
                    </Text>
                  </TouchableOpacity>
                  {needsEdit ? (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => {
                        if (!companyId) return;
                        navigation.navigate('MyCompanyDetails', {
                          clientId: companyId,
                          contextKey: 'company',
                        });
                      }}
                      style={{padding: 6}}
                      accessibilityLabel={`Editar endereço de ${name}`}>
                      <Icon
                        name="edit"
                        size={20}
                        color={
                          themePalette.primary || themePalette.cardIconColor
                        }
                      />
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </View>

      <SelectionModal
        visible={franchiseCompanySelectorVisible}
        title="Selecionar franquias visiveis"
        helperText="Toque nas empresas vinculadas para controlar quais franquias podem aparecer no localizador do shop."
        browser={franchiseCompanyBrowser}
        globalStyles={globalStyles}
        onClose={() => setFranchiseCompanySelectorVisible(false)}
        onSelect={toggleFranchiseCompany}
        selectedIds={new Set(visibleFranchiseCompanyIds)}
        emptyIconName="storefront"
        emptyTitle="Nenhuma franquia encontrada"
        emptyText="Nao ha empresas vinculadas como franquia para esta empresa."
        resolveItemId={normalizeShopEntityId}
        resolveItemLabel={resolveCompanyLabel}
        resolveItemMeta={company => resolveCompanyMeta(company) || 'Toque para liberar'}
        palette={themePalette}
        searchPlaceholder="Pesquisar franquia..."
        selectionMeta={() => 'Franquia liberada para o localizador'}
        styles={localStyles}
      />
    </>
  );
};

export default ShopFranchiseLocatorSection;
