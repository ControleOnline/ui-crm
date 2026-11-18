/*
 * @agents Message input, WhatsApp-like: Enter sends (Shift+Enter breaks the line), 📎 picks a file and opens
 * a preview with caption (AttachmentPreview),
 * 🎤 records a voice note (sent when recording stops). Sending never blocks typing: the input is cleared
 * at once and `onSend({text, file})` queues the message (ConversationView shows it as pending).
 */
import React, {useState} from 'react';
import {ActivityIndicator, Platform, Text, TextInput, TouchableOpacity, View} from 'react-native';
import AttachmentPreview from './AttachmentPreview';
import useAudioRecording from './useAudioRecording';
import {selectFile} from './fileApi';

export default function Composer({palette, placeholder, disabled, disabledText, onSend, top, onError}) {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const sending = false;
  const audio = useAudioRecording();

  const send = (payload = {text, file: null}) => {
    const message = {text: String(payload.text || '').trim(), file: payload.file || null};
    if (!message.text && !message.file) return;
    if (message.file) setFile(null);
    else setText('');
    Promise.resolve()
      .then(() => onSend(message))
      .catch(e => onError?.(e?.message || 'Não foi possível enviar'));
  };

  const attach = async () => {
    try {
      const picked = await selectFile('*/*');
      if (picked) setFile(picked);
    } catch (e) {
      onError?.(e?.message || 'Não foi possível anexar');
    }
  };

  const toggleRecording = async () => {
    try {
      if (!audio.recording) {
        await audio.start();
        return;
      }
      const voice = await audio.stop();
      if (voice) send({text: '', file: voice});
    } catch (e) {
      onError?.(e?.message || 'Não foi possível gravar');
    }
  };

  const onKeyPress = event => {
    const e = event?.nativeEvent || {};
    if (Platform.OS === 'web' && e.key === 'Enter' && !e.shiftKey) {
      event.preventDefault?.();
      send();
    }
  };

  if (disabled) {
    return (
      <View style={{padding: 12, borderTopWidth: 1, borderTopColor: palette.border, backgroundColor: palette.panel}}>
        <Text style={{color: palette.muted, textAlign: 'center'}}>{disabledText}</Text>
      </View>
    );
  }

  const iconBtn = {width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center'};
  const hasContent = Boolean(text.trim());
  return (
    <View style={{borderTopWidth: 1, borderTopColor: palette.border, backgroundColor: palette.panel, paddingHorizontal: 8, paddingVertical: 6}}>
      {top}
      <AttachmentPreview file={file} palette={palette} onCancel={() => setFile(null)} onSend={send} />
      <View style={{flexDirection: 'row', alignItems: 'flex-end', gap: 6}}>
        <TouchableOpacity style={iconBtn} onPress={attach} disabled={sending || audio.recording} accessibilityLabel="Anexar arquivo">
          <Text style={{fontSize: 20, color: palette.muted}}>📎</Text>
        </TouchableOpacity>
        {audio.recording ? (
          <View style={{flex: 1, minHeight: 40, borderRadius: 20, justifyContent: 'center', paddingHorizontal: 14, backgroundColor: palette.input}}>
            <Text style={{color: palette.danger}}>● Gravando… toque em ■ para enviar</Text>
          </View>
        ) : (
          <TextInput
            style={{
              flex: 1,
              minHeight: 40,
              maxHeight: 140,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: palette.inputBorder,
              backgroundColor: palette.input,
              color: palette.inputText,
              paddingHorizontal: 14,
              paddingVertical: 9,
              fontSize: 15,
            }}
            value={text}
            onChangeText={setText}
            onKeyPress={onKeyPress}
            placeholder={placeholder}
            placeholderTextColor={palette.placeholder}
            multiline
            editable={!sending}
          />
        )}
        {audio.recording ? (
          <TouchableOpacity style={[iconBtn, {backgroundColor: palette.chip}]} onPress={() => audio.cancel()} accessibilityLabel="Cancelar gravação">
            <Text style={{color: palette.danger, fontWeight: '700'}}>✕</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[iconBtn, {backgroundColor: palette.chipActive}]}
          onPress={hasContent && !audio.recording ? () => send() : toggleRecording}
          disabled={sending}
          accessibilityLabel={hasContent ? 'Enviar' : audio.recording ? 'Parar e enviar áudio' : 'Gravar áudio'}>
          {sending ? (
            <ActivityIndicator color={palette.chipActiveText} />
          ) : (
            <Text style={{color: palette.chipActiveText, fontSize: 18}}>{hasContent && !audio.recording ? '➤' : audio.recording ? '■' : '🎤'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
