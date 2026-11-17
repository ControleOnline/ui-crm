/*
 * @agents Native playback of a voice note (expo-audio) with play/pause.
 */
import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {useAudioPlayer, useAudioPlayerStatus} from 'expo-audio';

export default function AudioPlayer({source, color}) {
  const player = useAudioPlayer(source?.uri ? source : null);
  const status = useAudioPlayerStatus(player);
  const playing = Boolean(status?.playing);
  const secs = Math.round(status?.duration || 0);
  return (
    <TouchableOpacity onPress={() => {
        if (playing) {
          player.pause();
          return;
        }
        if (status?.didJustFinish) player.seekTo(0);
        player.play();
      }}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4}}>
        <Text style={{color, fontSize: 20}}>{playing ? '❚❚' : '▶'}</Text>
        <Text style={{color}}>{`Áudio${secs ? ` · ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}` : ''}`}</Text>
      </View>
    </TouchableOpacity>
  );
}
