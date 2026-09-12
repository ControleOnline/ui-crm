/*
 * Preview map (Leaflet iframe / static image) for selected franchise pins.
 * Outer box = full content width; Leaflet HTML gets explicit px size so the
 * map fills the iframe (srcDoc % height often leaves empty space on the right).
 */
import React, {createElement, useState} from 'react';
import {ActivityIndicator, Image, Platform, Text, View} from 'react-native';
import {
  buildLeafletMapHtml,
  buildOsmStaticMapUrl,
  buildStaticMapUrl,
} from './mapsFranchiseMapHelpers';

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
  const leafletMapHtml =
    mapBoxWidth > 0
      ? buildLeafletMapHtml(mapMarkers, {
          width: mapBoxWidth,
          height: MAP_HEIGHT,
        })
      : '';
  const previewMapUrl = staticMapUrl || osmStaticMapUrl;

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
              height: MAP_HEIGHT,
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
                  height: MAP_HEIGHT,
                  style: {
                    width: mapBoxWidth,
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
          <Text style={localStyles.helperText}>
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
