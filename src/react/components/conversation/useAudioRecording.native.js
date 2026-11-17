/*
 * @agents Native voice notes (expo-audio): returns {uri, name, mimeType} for uploadAttachment.
 */
import {useCallback, useState} from 'react';
import {AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder} from 'expo-audio';

export default function useAudioRecording() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recording, setRecording] = useState(false);

  const start = useCallback(async () => {
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission?.granted) throw new Error('Permita o uso do microfone para gravar áudio.');
    await setAudioModeAsync({allowsRecording: true, playsInSilentMode: true});
    await recorder.prepareToRecordAsync();
    recorder.record();
    setRecording(true);
  }, [recorder]);

  const finish = useCallback(
    async keep => {
      await recorder.stop();
      setRecording(false);
      await setAudioModeAsync({allowsRecording: false, playsInSilentMode: true});
      return keep && recorder.uri ? {uri: recorder.uri, name: `audio-${Date.now()}.m4a`, mimeType: 'audio/mp4'} : null;
    },
    [recorder],
  );

  return {recording, start, stop: () => finish(true), cancel: () => finish(false)};
}
