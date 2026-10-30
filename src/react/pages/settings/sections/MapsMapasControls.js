/*
 * @agents Mapas controls: API keys, shop home toggles, primary entry, address categories (#360).
 */
import React from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {SHOP_HOME_OPTION_FRANCHISE_LOCATOR} from '@controleonline/ui-common/src/react/utils/shopConfig';

const MapsMapasControls = ({
  androidGoogleMapsApiKey,
  franchiseAddressCategories,
  franchiseAddressCategoryIds,
  franchiseLocatorEnabled,
  isLoadingCategories,
  localStyles,
  primaryEntry,
  primaryEntryOptions,
  salesPageEnabled,
  saveMapsSettings,
  selectPrimaryEntry,
  setAndroidGoogleMapsApiKey,
  setWebGoogleMapsApiKey,
  themePalette,
  toggleFranchiseAddressCategory,
  toggleFranchiseLocator,
  toggleSalesPage,
  webGoogleMapsApiKey,
}) => (
  <>
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
            testID="maps-primary-entry-options"
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
  </>
);

export default MapsMapasControls;
