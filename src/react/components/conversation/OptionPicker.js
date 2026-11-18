/*
 * @agents Compact themed select: shows "Label: value"; opens a modal list. Read-only when no onChange.
 */
import React, {useState} from 'react';
import {Modal, Pressable, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import useChatPalette from './useChatPalette';

export default function OptionPicker({label, value, options, onChange, placeholder = '—', disabled}) {
  const palette = useChatPalette();
  const [open, setOpen] = useState(false);
  const current = options?.find(o => String(o.value) === String(value));
  const editable = Boolean(onChange) && !disabled;

  return (
    <>
      <TouchableOpacity
        disabled={!editable}
        onPress={() => setOpen(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: palette.border,
          backgroundColor: palette.chip,
          marginRight: 6,
          marginBottom: 6,
        }}>
        <Text style={{color: palette.muted, fontSize: 12}}>{label}:</Text>
        <Text style={{color: palette.text, fontSize: 12, fontWeight: '600'}} numberOfLines={1}>
          {current?.label || placeholder}
        </Text>
        {editable ? <Text style={{color: palette.muted, fontSize: 10}}>▾</Text> : null}
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={{flex: 1, backgroundColor: palette.overlay, justifyContent: 'center', padding: 24}} onPress={() => setOpen(false)}>
          <Pressable style={{backgroundColor: palette.panel, borderRadius: 12, maxHeight: '75%', paddingVertical: 8, borderWidth: 1, borderColor: palette.border}}>
            <Text style={{color: palette.text, fontWeight: '700', fontSize: 16, paddingHorizontal: 16, paddingVertical: 8}}>{label}</Text>
            <ScrollView>
              {(options || []).map(option => (
                <TouchableOpacity
                  key={String(option.value)}
                  onPress={() => {
                    setOpen(false);
                    if (String(option.value) !== String(value)) onChange(option.value, option);
                  }}
                  style={{paddingHorizontal: 16, paddingVertical: 12, backgroundColor: String(option.value) === String(value) ? palette.chip : 'transparent'}}>
                  <Text style={{color: palette.text}}>{option.label}</Text>
                  {option.hint ? <Text style={{color: palette.muted, fontSize: 12}}>{option.hint}</Text> : null}
                </TouchableOpacity>
              ))}
              {!options?.length ? <Text style={{color: palette.muted, padding: 16}}>Nenhuma opção disponível.</Text> : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
