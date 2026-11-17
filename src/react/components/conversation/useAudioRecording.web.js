/*
 * @agents Web voice notes: MediaRecorder -> File (audio/webm) ready for uploadAttachment.
 */
import {useCallback, useRef, useState} from 'react';

export default function useAudioRecording() {
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const start = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      throw new Error('Gravação de áudio não suportada neste navegador.');
    }
    const stream = await navigator.mediaDevices.getUserMedia({audio: true});
    streamRef.current = stream;
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = event => event.data?.size && chunksRef.current.push(event.data);
    recorder.start();
    recorderRef.current = recorder;
    setRecording(true);
  }, []);

  const finish = useCallback(
    keep =>
      new Promise(resolve => {
        const recorder = recorderRef.current;
        const release = () => streamRef.current?.getTracks?.().forEach(track => track.stop());
        if (!recorder) {
          setRecording(false);
          resolve(null);
          return;
        }
        recorder.onstop = () => {
          release();
          setRecording(false);
          recorderRef.current = null;
          if (!keep || !chunksRef.current.length) {
            resolve(null);
            return;
          }
          const type = recorder.mimeType || 'audio/webm';
          const blob = new Blob(chunksRef.current, {type});
          resolve(new File([blob], `audio-${Date.now()}.webm`, {type}));
        };
        recorder.stop();
      }),
    [],
  );

  return {recording, start, stop: () => finish(true), cancel: () => finish(false)};
}
