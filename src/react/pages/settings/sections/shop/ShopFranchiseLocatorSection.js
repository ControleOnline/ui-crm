/*
 * @agents Franchise locator visibility (companies + addresses) for shop general settings.
 * Persist only on explicit user toggles — never auto-save prunes after refresh.
 */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {fetchAllShopFranchiseDirectory} from '@controleonline/ui-common/src/react/utils/shopFranchises';
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

  const toggleFranchiseCompany = useCallback(
    company => {
      const companyId = normalizeShopEntityId(company);
      if (!companyId) return;
      const nextCompanyIds = visibleFranchiseCompanyIds.includes(companyId)
        ? visibleFranchiseCompanyIds.filter(item => item !== companyId)
        : [...visibleFranchiseCompanyIds, companyId];
      const nextAddressIds = visibleFranchiseAddressIds.filter(addressId => {
        const address = franchiseAddressesById[addressId];
        if (!address) return false;
        return nextCompanyIds.includes(
          normalizeShopEntityId(address?.linkedCompany),
        );
      });
      saveFranchiseVisibility(nextCompanyIds, nextAddressIds);
    },
    [
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
            ? `${availableFranchiseCompanies.length} franquia(s) da empresa atual · ${visibleFranchiseCompanyIds.length} liberada(s) no mapa.`
            : 'Nenhuma franquia vinculada à empresa atual.'}
        </Text>
        {isLoadingFranchiseDirectory ? (
          <ActivityIndicator size="small" color={themePalette.loadingSpinner} style={localStyles.sectionLoader} />
        ) : availableFranchiseCompanies.length === 0 ? (
          <View style={localStyles.emptyBox}>
            <Text style={localStyles.emptyTitle}>Nenhuma franquia encontrada</Text>
            <Text style={localStyles.emptyText}>
              Cadastre vínculos linkType=franchisee em Minha empresa → Franquias (mesma fonte da aba Franquias).
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
              return (
                <View key={`shop-franchise-company-dir-${companyId}`}>
                  <TouchableOpacity
                    style={[localStyles.printerItem, selected && localStyles.printerItemActive]}
                    activeOpacity={0.85}
                    onPress={() => toggleFranchiseCompany(company)}>
                    <Icon
                      name={selected ? 'check-box' : 'check-box-outline-blank'}
                      size={22}
                      color={
                        selected
                          ? themePalette.iconActive || themePalette.primary
                          : themePalette.iconDisabled || themePalette.textMuted
                      }
                    />
                    <View style={localStyles.printerCopy}>
                      <Text style={localStyles.printerName}>{resolveCompanyLabel(company)}</Text>
                      <Text style={localStyles.printerDevice}>
                        {resolveCompanyMeta(company) ||
                          (selected
                            ? 'Visível no mapa — toque para ocultar'
                            : 'Toque para exibir no mapa')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  {addresses.length > 0 ? (
                    <View style={{marginLeft: 12, marginBottom: 8}}>
                      {addresses.map(address => {
                        const addressId = normalizeShopEntityId(address);
                        const addrSelected =
                          visibleFranchiseAddressIds.includes(addressId);
                        const lat = address?.latitude ?? address?.lat;
                        const lng =
                          address?.longitude ?? address?.lng ?? address?.lon;
                        const hasCoords =
                          lat != null &&
                          lng != null &&
                          Math.abs(Number(lat)) > 0.000001 &&
                          Math.abs(Number(lng)) > 0.000001;
                        const coordLabel = hasCoords
                          ? ` · ${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`
                          : ' · sem lat/long';
                        return (
                          <TouchableOpacity
                            key={`shop-franchise-dir-addr-${addressId}`}
                            style={[
                              localStyles.printerItem,
                              addrSelected && localStyles.printerItemActive,
                            ]}
                            activeOpacity={0.85}
                            onPress={() => {
                              if (!selected) {
                                toggleFranchiseCompany(company);
                              }
                              toggleFranchiseAddress({
                                ...address,
                                linkedCompany: {
                                  id: company?.id,
                                  alias: company?.alias,
                                  name: company?.name,
                                },
                              });
                            }}>
                            <Icon
                              name={
                                addrSelected
                                  ? 'check-box'
                                  : 'check-box-outline-blank'
                              }
                              size={20}
                              color={
                                addrSelected
                                  ? themePalette.iconActive ||
                                    themePalette.primary
                                  : themePalette.iconDisabled ||
                                    themePalette.textMuted
                              }
                            />
                            <View style={localStyles.printerCopy}>
                              <Text style={localStyles.printerName}>
                                {resolveAddressLabel(address)}
                              </Text>
                              <Text style={localStyles.printerDevice}>
                                {(resolveAddressDetail(address) || 'Endereço') +
                                  coordLabel}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View style={localStyles.fieldBlock}>
        <Text style={localStyles.fieldLabel}>Enderecos exibidos no localizador</Text>
        <Text style={localStyles.helperText}>
          Abaixo de cada franquia selecionada, marque quais enderecos entram no mapa. Ao remover a franquia acima, os enderecos dela saem junto.
        </Text>
        {visibleFranchiseCompanyIds.length === 0 ? (
          <View style={localStyles.emptyBox}>
            <Text style={localStyles.emptyTitle}>Selecione franquias primeiro</Text>
            <Text style={localStyles.emptyText}>Os enderecos aparecem agrupados logo abaixo de cada franquia liberada.</Text>
          </View>
        ) : isLoadingFranchiseDirectory ? (
          <ActivityIndicator size="small" color={themePalette.loadingSpinner} style={localStyles.sectionLoader} />
        ) : (
          <View style={localStyles.printerList}>
            {selectedFranchiseAddressGroups.map(({company, addresses, selectedCount}) => {
              const companyId = normalizeShopEntityId(company);
              return (
                <View key={`shop-franchise-address-group-${companyId}`} style={localStyles.fieldBlock}>
                  <Text style={localStyles.fieldLabel}>
                    {resolveCompanyLabel(company)}
                    {selectedCount > 0 ? ` (${selectedCount})` : ''}
                  </Text>
                  {addresses.length === 0 ? (
                    <Text style={localStyles.helperText}>
                      {company?.__orphan
                        ? 'Franquia salva; enderecos aparecem quando o diretorio terminar de carregar.'
                        : 'Essa franquia ainda nao trouxe enderecos para liberar no localizador.'}
                    </Text>
                  ) : (
                    addresses.map(address => {
                      const addressId = normalizeShopEntityId(address);
                      const selected = visibleFranchiseAddressIds.includes(addressId);
                      return (
                        <TouchableOpacity
                          key={`shop-franchise-address-${addressId}`}
                          style={[localStyles.printerItem, selected && localStyles.printerItemActive]}
                          activeOpacity={0.85}
                          onPress={() => toggleFranchiseAddress(address)}>
                          <Icon
                            name={selected ? 'check-circle' : 'radio-button-unchecked'}
                            size={20}
                            color={selected ? themePalette.iconActive : themePalette.iconDisabled}
                          />
                          <View style={localStyles.printerCopy}>
                            <Text style={localStyles.printerName}>{resolveAddressLabel(address)}</Text>
                            <Text style={localStyles.printerDevice}>
                              {resolveAddressDetail(address) || 'Toque para liberar no mapa'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              );
            })}
          </View>
        )}
        <Text style={localStyles.helperText}>
          {visibleFranchiseAddressIds.length > 0
            ? `${visibleFranchiseAddressIds.length} endereco(s) liberado(s) para o mapa.`
            : 'Nenhum endereco liberado ainda.'}
        </Text>
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
