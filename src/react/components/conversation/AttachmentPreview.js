/*
 * @agents WhatsApp-like attachment preview: opens right after a file is picked, shows the image (or the
 * file name), takes an optional caption and sends with ➤ (Enter on web) or discards with ✕.
 */
import React, {useEffect, useMemo, useState} from 'react';
import {Image, Modal, Platform, Text, TextInput, TouchableOpacity, View} from 'react-native';

const mimeOf = file => String(file?.type || file?.mimeType || '').toLowerCase();

export default function AttachmentPreview({file, palette, onCancel, onSend}) {
  const [caption, setCaption] = useState('');
  const isImage = mimeOf(file).startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(String(file?.name || ''));

  // Web files need an object URL for the preview; native pickers already give a uri.
  const uri = useMemo(() => {
    if (!file || !isImage) return null;
    if (file.uri) return file.uri;
    if (Platform.OS === 'web' && typeof URL !== 'undefined' && file instanceof Blob) return URL.createObjectURL(file);
    return null;
  }, [file, isImage]);
  useEffect(() => () => {
    if (uri && Platform.OS === 'web' && uri.startsWith('blob:')) URL.revokeObjectURL(uri);
  }, [uri]);
  useEffect(() => setCaption(''), [file]);

  if (!file) return null;
  const send = () => onSend({text: caption.trim(), file});
  const onKeyPress = event => {
    const e = event?.nativeEvent || {};
    if (Platform.OS === 'web' && e.key === 'Enter' && !e.shiftKey) {
      event.preventDefault?.();
      send();
    }
    if (Platform.OS === 'web' && e.key === 'Escape') onCancel();
  };

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onCancel}>
      <View style={{flex: 1, backgroundColor: palette.overlay, alignItems: 'center', justifyContent: 'center', padding: 16}}>
        <View style={{width: '100%', maxWidth: 520, borderRadius: 14, overflow: 'hidden', backgroundColor: palette.panel}}>
          <View style={{flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: palette.border}}>
            <TouchableOpacity onPress={onCancel} accessibilityLabel="Descartar anexo" style={{padding: 4, marginRight: 8}}>
              <Text style={{color: palette.muted, fontSize: 18, fontWeight: '700'}}>✕</Text>
            </TouchableOpacity>
            <Text style={{color: palette.text, fontWeight: '700', flex: 1}} numberOfLines={1}>
              {file.name || 'Anexo'}
            </Text>
          </View>
          <View style={{alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: palette.background, minHeight: 160}}>
            {uri ? (
              <Image source={{uri}} style={{width: '100%', height: 300}} resizeMode="contain" />
            ) : (
              <View style={{alignItems: 'center'}}>
                <Text style={{fontSize: 48}}>📄</Text>
                <Text style={{color: palette.text, marginTop: 8, textAlign: 'center'}} numberOfLines={2}>
                  {file.name || 'Arquivo'}
                </Text>
              </View>
            )}
          </View>
          <View style={{flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 10}}>
            <TextInput
              style={{
                flex: 1,
                minHeight: 40,
                maxHeight: 120,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: palette.inputBorder,
                backgroundColor: palette.input,
                color: palette.inputText,
                paddingHorizontal: 14,
                paddingVertical: 9,
                fontSize: 15,
              }}
              value={caption}
              onChangeText={setCaption}
              onKeyPress={onKeyPress}
              placeholder="Adicione uma legenda (opcional)"
              placeholderTextColor={palette.placeholder}
              multiline
              autoFocus
            />
            <TouchableOpacity
              onPress={send}
              accessibilityLabel="Enviar anexo"
              style={{width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.chipActive}}>
              <Text style={{color: palette.chipActiveText, fontSize: 18}}>➤</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
