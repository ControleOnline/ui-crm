/*
 * @agents Preview map for selected franchise pins on Mapas (#360).
 */
import React, {createElement} from 'react';
import {ActivityIndicator, Image, Platform, Text, View} from 'react-native';

const MapsFranchisePreview = ({
  isLoadingFranchiseDirectory,
  leafletMapHtml,
  localStyles,
  mapBoxWidth,
  mapMarkers,
  previewMapUrl,
  setMapBoxWidth,
  themePalette,
  visibleFranchiseCompanyIds,
}) => (
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

);

export default MapsFranchisePreview;
