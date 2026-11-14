/*
 * @agents Modal to put the company AI on a CRM/support ticket, with optional instructions.
 */
import React, {useState} from 'react';
import {ActivityIndicator, Modal, Text, TextInput, TouchableOpacity, View} from 'react-native';
import styles from './tickets.styles';

export default function AssignAiModal({visible, ticketName, onCancel, onConfirm}) {
  const [instructions, setInstructions] = useState('');
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm(instructions.trim());
      setInstructions('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Atribuir à IA</Text>
          <Text style={styles.modalText}>
            {`A IA vai falar com o cliente de "${ticketName || 'ticket'}" pelo WhatsApp ou e-mail do cadastro, `}
            atualizar a etapa e devolver para a equipe quando precisar de uma pessoa.
          </Text>
          <TextInput
            style={[styles.input, styles.modalInput]}
            value={instructions}
            onChangeText={setInstructions}
            placeholder="Instruções (opcional): o que perguntar, qual oferta apresentar…"
            placeholderTextColor="#8b98a5"
            multiline
          />
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.ghostBtn} onPress={onCancel} disabled={busy}>
              <Text style={styles.ghostBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={confirm} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Atribuir</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
