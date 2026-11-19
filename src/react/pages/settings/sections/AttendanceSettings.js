/*
 * @agents One kind of request (support / relationship): who attends first (AI by default, or a person),
 * the AI's name (the AI is a person of the company, e.g. "Tião IA") and the welcome message sent in
 * its name. Saved with PUT /tickets/settings {attendance: {[type]: {first, ai_name, welcome}}}.
 */
import React, {useEffect, useState} from 'react';
import {Text, TextInput, TouchableOpacity, View} from 'react-native';

const FIRST = [
  {value: 'ai', label: 'IA primeiro (encaminha para uma pessoa quando precisar)'},
  {value: 'human', label: 'Pessoa primeiro'},
];

export default function AttendanceSettings({type, value, onSave, palette, styles, Choice}) {
  const [name, setName] = useState(value?.ai_name || '');
  const [welcome, setWelcome] = useState(value?.welcome || '');
  useEffect(() => {
    setName(value?.ai_name || '');
    setWelcome(value?.welcome || '');
  }, [value?.ai_name, value?.welcome]);

  const input = {
    borderWidth: 1,
    borderColor: palette.inputBorder || palette.cardBorder,
    backgroundColor: palette.inputBackground || palette.cardBackground,
    color: palette.inputText || palette.textPrimary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  };

  return (
    <View style={{marginBottom: 12}}>
      <Text style={styles.sectionTitle}>Primeiro atendimento</Text>
      {FIRST.map(o => (
        <Choice key={o.value} palette={palette} active={(value?.first || 'ai') === o.value} label={o.label} onPress={() => onSave({[type]: {first: o.value}})} />
      ))}
      <Text style={[styles.sectionTitle, {marginTop: 8}]}>Nome da IA</Text>
      <TextInput style={input} value={name} onChangeText={setName} maxLength={60} placeholder="Ex.: Tião IA" placeholderTextColor={palette.inputPlaceholderText || palette.textMuted} />
      <Text style={styles.sectionTitle}>Mensagem de boas-vindas</Text>
      <TextInput
        style={[input, {minHeight: 70, textAlignVertical: 'top'}]}
        value={welcome}
        onChangeText={setWelcome}
        multiline
        placeholder="Enviada em nome da IA quando a solicitação começa (vazio = sem mensagem)"
        placeholderTextColor={palette.inputPlaceholderText || palette.textMuted}
      />
      <TouchableOpacity
        onPress={() => onSave({[type]: {ai_name: name, welcome}})}
        style={{alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, backgroundColor: palette.primary}}>
        <Text style={{color: palette.buttonText || palette.cardBackground, fontWeight: '700'}}>Salvar nome e boas-vindas</Text>
      </TouchableOpacity>
    </View>
  );
}
