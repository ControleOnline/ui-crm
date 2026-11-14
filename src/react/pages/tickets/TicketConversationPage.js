/*
 * @agents One customer ticket (ia triage, CRM or support): the full conversation, employee reply to the
 * customer (public -> goes out through the ticket's WhatsApp/e-mail connection), internal notes (private),
 * put the AI on the ticket or take it over. Live via websocket events.
 */
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {useRoute} from '@react-navigation/native';
import {useStore} from '@store';
import useToastMessage from '../../hooks/useToastMessage';
import AssignAiModal from './AssignAiModal';
import useRealtimeReload from './useRealtimeReload';
import {assignAi, fetchTicket, fetchTicketMessages, postTicketMessage, takeOverTicket} from './ticketApi';
import styles from './tickets.styles';

const {idOf, conversationChannel, messageRole, stageLabel} = require('../mcp/mcpChatUtils');
const {personName} = require('./ticketUtils');

const CHANNEL_LABELS = {whatsapp: 'WhatsApp', email: 'E-mail', web: 'Site'};
const ROLE_STYLE = {customer: 'bubbleLeft', ai: 'bubbleAi', note: 'bubbleNote', staff: 'bubbleRight', me: 'bubbleRight'};

export default function TicketConversationPage() {
  const route = useRoute();
  const taskId = Number(route?.params?.taskId || 0);
  const {showError} = useToastMessage();
  const peopleStore = useStore('people');
  const authStore = useStore('auth');
  const companyId = idOf(peopleStore?.getters?.currentCompany || peopleStore?.getters?.mainCompany);
  const currentPeopleId = idOf(authStore?.getters?.user?.people);

  const [task, setTask] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [mode, setMode] = useState('public');
  const [sending, setSending] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const listRef = useRef(null);

  const load = useCallback(async () => {
    if (!taskId) return;
    try {
      const [t, m] = await Promise.all([fetchTicket(taskId), fetchTicketMessages(taskId)]);
      setTask(t);
      setMessages(m);
    } catch (e) {
      showError(e?.message || 'Falha ao carregar o ticket');
    } finally {
      setLoading(false);
    }
  }, [taskId, showError]);

  useEffect(() => {
    load();
  }, [load]);
  const isThisTask = useCallback(evt => Number(evt.task_id) === taskId, [taskId]);
  useRealtimeReload(load, {filter: isThisTask, delay: 200});

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await postTicketMessage(taskId, body, mode);
      setDraft('');
      await load();
    } catch (e) {
      showError(e?.message || 'Não foi possível enviar');
    } finally {
      setSending(false);
    }
  };

  const takeOver = async type => {
    try {
      await takeOverTicket(taskId, companyId, type);
      await load();
    } catch (e) {
      showError(e?.message || 'Não foi possível assumir');
    }
  };

  const confirmAssign = async instructions => {
    try {
      await assignAi(taskId, companyId, instructions);
      setAssignOpen(false);
      await load();
    } catch (e) {
      showError(e?.message || 'Não foi possível atribuir a IA');
    }
  };

  if (loading) return <ActivityIndicator style={styles.spinner} />;
  if (!task) return <Text style={styles.emptyText}>Ticket não encontrado.</Text>;

  const channel = CHANNEL_LABELS[conversationChannel(task)];
  const renderMessage = ({item}) => {
    const role = messageRole(item, {companyId, task, currentPeopleId});
    const author = role === 'ai' ? 'IA' : role === 'note' ? 'Nota interna' : personName(item.registeredBy);
    const isNote = item.visibility === 'private' && role !== 'ai';
    return (
      <View style={[styles.bubble, styles[isNote ? 'bubbleNote' : ROLE_STYLE[role]]]}>
        {author ? <Text style={styles.bubbleAuthor}>{isNote && role !== 'note' ? `${author} · interno` : author}</Text> : null}
        <Text style={styles.bubbleText}>{item.body}</Text>
        {item.createdAt ? <Text style={styles.bubbleMeta}>{new Date(item.createdAt).toLocaleString('pt-BR')}</Text> : null}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>{task.name || `Ticket #${taskId}`}</Text>
          <Text style={styles.subtitle}>
            {[personName(task.client), stageLabel(task), task.taskStatus?.status, channel].filter(Boolean).join(' · ')}
          </Text>
        </View>
      </View>
      <View style={styles.aiBar}>
        <Text style={styles.aiBarText}>
          {task.aiAgent ? 'A IA está atendendo este cliente.' : 'Atendimento humano. Você pode colocar a IA para conduzir.'}
        </Text>
        {task.aiAgent
          ? (task.type === 'ia' ? ['relationship', 'support'] : [task.type]).map(type => (
              <TouchableOpacity key={type} style={styles.ghostBtn} onPress={() => takeOver(type)}>
                <Text style={styles.ghostBtnText}>{task.type === 'ia' ? `Assumir (${stageLabel({type})})` : 'Assumir'}</Text>
              </TouchableOpacity>
            ))
          : (
              <TouchableOpacity style={styles.ghostBtn} onPress={() => setAssignOpen(true)}>
                <Text style={styles.ghostBtnText}>Atribuir IA</Text>
              </TouchableOpacity>
            )}
      </View>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => String(item.id || item['@id'])}
        renderItem={renderMessage}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => listRef.current?.scrollToEnd?.({animated: true})}
        ListEmptyComponent={<Text style={styles.emptyText}>Sem mensagens ainda.</Text>}
      />
      <View style={styles.composer}>
        <View style={styles.modeRow}>
          <TouchableOpacity style={[styles.modeChip, mode === 'public' && styles.modeChipActive]} onPress={() => setMode('public')}>
            <Text style={styles.modeChipText}>{`Responder cliente${channel ? ` (${channel})` : ''}`}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modeChip, mode === 'private' && styles.modeChipNote]} onPress={() => setMode('private')}>
            <Text style={styles.modeChipText}>Nota interna</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.composerRow}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder={mode === 'public' ? 'Mensagem para o cliente (a IA sai da conversa)…' : 'Nota visível só para a equipe…'}
            placeholderTextColor="#8b98a5"
            multiline
          />
          <TouchableOpacity style={styles.primaryBtn} onPress={send} disabled={sending || !draft.trim()}>
            {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Enviar</Text>}
          </TouchableOpacity>
        </View>
      </View>
      <AssignAiModal visible={assignOpen} ticketName={task.name} onCancel={() => setAssignOpen(false)} onConfirm={confirmAssign} />
    </KeyboardAvoidingView>
  );
}
