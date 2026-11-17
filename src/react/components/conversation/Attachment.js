/*
 * @agents Attachment inside a bubble: image preview, voice note player or file chip (web download).
 * Files are private, so they are loaded with the API token (fileApi.fileSource).
 */
import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Image, Linking, Platform, Text, TouchableOpacity, View} from 'react-native';
import AudioPlayer from './AudioPlayer';
import {fetchFileMeta, fileIdOf, fileSource, kindOf} from './fileApi';

export default function Attachment({file, color}) {
  const id = fileIdOf(file);
  const [state, setState] = useState({loading: true});

  useEffect(() => {
    let alive = true;
    if (!id) return undefined;
    Promise.all([fetchFileMeta(id), fileSource(id).catch(() => null)]).then(([meta, source]) => {
      if (alive) setState({loading: false, meta, source, kind: kindOf(meta, source?.type)});
    });
    return () => {
      alive = false;
    };
  }, [id]);

  if (!id) return null;
  if (state.loading) return <ActivityIndicator color={color} style={{marginVertical: 6}} />;

  const name = state.meta?.fileName || 'Arquivo';
  if (state.kind === 'image' && state.source) {
    return (
      <TouchableOpacity onPress={() => Platform.OS === 'web' && window.open(state.source.uri, '_blank')}>
        <Image source={state.source} style={{width: 240, height: 180, borderRadius: 8, marginBottom: 4}} resizeMode="cover" />
      </TouchableOpacity>
    );
  }
  if (state.kind === 'audio' && state.source) {
    return <AudioPlayer source={state.source} color={color} />;
  }

  const open = () => {
    if (!state.source?.uri) return;
    if (Platform.OS === 'web') {
      const a = document.createElement('a');
      a.href = state.source.uri;
      a.download = name;
      a.click();
    } else {
      Linking.openURL(state.source.uri);
    }
  };
  return (
    <TouchableOpacity onPress={open}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6}}>
        <Text style={{fontSize: 22, color}}>📄</Text>
        <Text style={{color, textDecorationLine: 'underline', maxWidth: 220}} numberOfLines={1}>
          {name}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
