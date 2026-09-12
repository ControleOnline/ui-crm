/*
 * Preview map (Leaflet iframe / static image) for selected franchise pins.
 * Full-bleed horizontal: map edges stick to the window content laterals.
 * Important: negative margin alone only shifts the box — width must grow by 2*bleed.
 */
import React, {createElement, useState} from 'react';
import {ActivityIndicator, Image, Platform, Text, View} from 'react-native';
import {
  buildLeafletMapHtml,
  buildOsmStaticMapUrl,
  buildStaticMapUrl,
} from './mapsFranchiseMapHelpers';

/** GeneralSettings.styles sectionCard.padding */
const SECTION_CARD_PADDING = 18;
/** ui-orders Settings.scrollContent.paddingHorizontal */
const PAGE_CONTENT_PADDING = 20;
const MAP_SIDE_BLEED = SECTION_CARD_PADDING + PAGE_CONTENT_PADDING;
const MAP_HEIGHT = 360;

const FranchiseMapPreview = ({
  isLoading,
  mapMarkers,
  webGoogleMapsApiKey,
  localStyles,
  themePalette,
  visibleFranchiseCompanyIds = [],
}) => {
  const [mapBoxWidth, setMapBoxWidth] = useState(0);

  const staticMapUrl = buildStaticMapUrl({
    apiKey: webGoogleMapsApiKey,
    markers: mapMarkers,
    size: '1280x480',
  });
  const osmStaticMapUrl = buildOsmStaticMapUrl(mapMarkers, '1280x480');
  const leafletMapHtml = buildLeafletMapHtml(mapMarkers);
  const previewMapUrl = staticMapUrl || osmStaticMapUrl;

  // Grow width by 2*bleed AND pull left — margin alone only translates the box.
  const bleedStyle =
    Platform.OS === 'web'
      ? {
          alignSelf: 'stretch',
          width: `calc(100% + ${MAP_SIDE_BLEED * 2}px)`,
          marginLeft: -MAP_SIDE_BLEED,
          marginRight: -MAP_SIDE_BLEED,
          maxWidth: 'none',
        }
      : {
          alignSelf: 'stretch',
          width: '100%',
          marginHorizontal: -MAP_SIDE_BLEED,
        };

  return (
    <View
      style={[localStyles.fieldBlock, {alignSelf: 'stretch', width: '100%'}]}
      testID="maps-franchise-map">
      <Text style={localStyles.fieldLabel}>Mapa das franquias</Text>
      <Text style={localStyles.helperText}>
        Pins das franquias marcadas acima (com latitude/longitude).
      </Text>
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={themePalette.loadingSpinner || themePalette.primary}
          style={localStyles.sectionLoader}
        />
      ) : mapMarkers.length === 0 ? (
        <View style={localStyles.emptyBox}>
          <Text style={localStyles.emptyTitle}>Nenhum pin para exibir</Text>
          <Text style={localStyles.emptyText}>
            Marque franquias com latitude/longitude na lista acima para
            aparecerem no mapa.
          </Text>
        </View>
      ) : (
        <View style={bleedStyle}>
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
              height: MAP_HEIGHT,
              borderRadius: 0,
              overflow: 'hidden',
              backgroundColor: themePalette.inputBackground || '#eee',
            }}>
            {Platform.OS === 'web' && leafletMapHtml && mapBoxWidth > 0
              ? createElement('iframe', {
                  key: `franchise-map-${mapBoxWidth}-${mapMarkers.length}`,
                  title: 'Mapa das franquias',
                  srcDoc: leafletMapHtml,
                  width: '100%',
                  height: MAP_HEIGHT,
                  style: {
                    width: '100%',
                    height: MAP_HEIGHT,
                    border: 'none',
                    display: 'block',
                    margin: 0,
                    padding: 0,
                    maxWidth: '100%',
                  },
                })
              : previewMapUrl
                ? (
                    <Image
                      source={{uri: previewMapUrl}}
                      style={{width: '100%', height: MAP_HEIGHT}}
                      resizeMode="cover"
                      accessibilityLabel="Mapa das franquias com pins"
                    />
                  )
                : null}
          </View>
          <Text
            style={[
              localStyles.helperText,
              {
                paddingHorizontal: MAP_SIDE_BLEED,
                marginTop: 8,
              },
            ]}>
            {mapMarkers.length} pin(s) no mapa
            {visibleFranchiseCompanyIds.length > 0
              ? ` · ${visibleFranchiseCompanyIds.length} franquia(s) selecionada(s)`
              : ''}
          </Text>
        </View>
      )}
    </View>
  );
};

export default FranchiseMapPreview;
