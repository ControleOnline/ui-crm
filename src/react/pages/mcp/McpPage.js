/*
 * @agents /ai: employee chats with the company AI (internal data via MCP) and follows the customer
 * conversations the AI is handling now. Employees answer customers in CRM / Support. Logic: useMcpChat.
 */
import React, {useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import useMcpChat from './useMcpChat';
import styles from './McpPage.styles';

const {idOf, isCustomerConversation, conversationChannel, stageLabel, messageRole} = require('./mcpChatUtils');

const PROVIDER_LABELS = {grok: 'Grok', openai: 'Codex / OpenAI', gemini: 'Gemini', claude: 'Claude'};
const CHANNEL_LABELS = {whatsapp: 'WhatsApp', email: 'E-mail', web: 'Site', ai: 'IA'};
const ROLE_LABELS = {ai: 'IA', note: 'Nota interna', customer: 'Cliente', staff: 'Equipe', me: null};

const TaskRow = ({item, selected, onPress}) => {
  const customer = isCustomerConversation(item);
  return (
    <TouchableOpacity onPress={onPress} style={[styles.taskRow, selected && styles.taskRowActive]}>
      <Text numberOfLines={1} style={styles.taskRowText}>
        {item.name || `Conversa #${idOf(item)}`}
      </Text>
      {customer ? (
        <Text style={styles.taskRowMeta}>
          {CHANNEL_LABELS[conversationChannel(item)]} · {stageLabel(item)}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
};

export default function McpPage() {
  const chat = useMcpChat();
  const [draft, setDraft] = useState('');
  const listRef = useRef(null);

  const [internal, tickets, customers] = useMemo(() => {
    const mine = t => idOf(t.client) === Number(chat.currentPeopleId);
    return [
      chat.tasks.filter(t => !isCustomerConversation(t)),
      chat.tasks.filter(t => isCustomerConversation(t) && mine(t)),
      chat.tasks.filter(t => isCustomerConversation(t) && !mine(t)),
    ];
  }, [chat.tasks, chat.currentPeopleId]);
  const noAi = chat.providers.length === 0;
  const ticketComposer = chat.myTicket || (!chat.activeTaskId && noAi);

  const submit = async () => {
    const text = draft;
    setDraft('');
    const ok = await chat.sendMessage(text);
    if (!ok) setDraft(text);
  };

  const renderMessage = ({item}) => {
    const role = messageRole(item, {companyId: chat.companyId, task: chat.activeTask, currentPeopleId: chat.currentPeopleId});
    const right = role === 'me' || role === 'staff';
    return (
      <View style={[styles.bubble, right ? styles.bubbleUser : styles.bubbleAi, role === 'note' && styles.bubbleNote, role === 'customer' && styles.bubbleCustomer]}>
        {ROLE_LABELS[role] ? <Text style={styles.bubbleAuthor}>{ROLE_LABELS[role]}</Text> : null}
        <Text style={styles.bubbleText}>{item?.body || ''}</Text>
        {item?.status && !['done', 'pending'].includes(item.status) ? <Text style={styles.bubbleMeta}>{String(item.status)}</Text> : null}
      </View>
    );
  };

  const typing = chat.aiStatus ? (
    <View style={[styles.bubble, styles.bubbleAi]}>
      <Text style={styles.bubbleMeta}>{chat.aiStatus === 'processing' ? 'IA consultando os dados…' : 'Enviado, aguardando a IA…'}</Text>
    </View>
  ) : null;

  const renderSection = (title, items, empty) => (
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.length === 0 ? <Text style={styles.emptyText}>{empty}</Text> : null}
      {items.map(item => (
        <TaskRow key={String(idOf(item))} item={item} selected={idOf(item) === Number(chat.activeTaskId)} onPress={() => chat.setActiveTaskId(idOf(item))} />
      ))}
    </View>
  );

  const task = chat.activeTask;
  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
      <View style={styles.sidebar}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>IA</Text>
          <TouchableOpacity onPress={chat.startNewChat} style={styles.newBtn}>
            <Text style={styles.newBtnText}>Novo chat</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal style={styles.providerRow} contentContainerStyle={styles.providerRowContent}>
          {noAi ? <Text style={styles.emptyText}>Sem IA própria: suas mensagens abrem um chamado.</Text> : null}
          {chat.providers.map(p => (
            <TouchableOpacity key={p.provider} onPress={() => chat.setProvider(p.provider)} style={[styles.providerChip, p.provider === chat.provider && styles.providerChipActive]}>
              <Text style={[styles.providerChipText, p.provider === chat.provider && styles.providerChipTextActive]}>
                {PROVIDER_LABELS[p.provider] || p.label || p.provider}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {chat.loadingList ? (
          <ActivityIndicator style={styles.spinner} />
        ) : (
          <ScrollView>
            {renderSection('Meus chats', internal, noAi ? 'Sua empresa ainda não tem IA configurada.' : 'Pergunte algo sobre a empresa.')}
            {tickets.length ? renderSection('Meus chamados', tickets, '') : null}
            {renderSection('IA atendendo clientes', customers, 'Nenhuma conversa com a IA agora.')}
          </ScrollView>
        )}
      </View>

      <View style={styles.chatPane}>
        <View style={styles.chatHeader}>
          <View style={styles.chatHeaderText}>
            <Text style={styles.chatTitle}>{task?.name || (chat.activeTaskId ? `Conversa #${chat.activeTaskId}` : 'Novo chat')}</Text>
            <Text style={styles.chatSubtitle}>
              {chat.myTicket
                ? `Chamado ${stageLabel(task)} · ${task?.taskStatus?.status || 'aberto'}${task?.aiAgent ? ' · IA atendendo' : ''}`
                : chat.customerChat
                  ? `${CHANNEL_LABELS[conversationChannel(task)]} · ${stageLabel(task)} · IA atendendo`
                  : ticketComposer
                    ? 'Novo chamado'
                    : PROVIDER_LABELS[chat.provider] || chat.provider || 'Selecione a IA'}
            </Text>
          </View>
          {chat.customerChat ? (
            <View style={styles.actionsRow}>
              {(task?.type === 'ia' ? ['relationship', 'support'] : [task?.type]).map(type => (
                <TouchableOpacity key={type} style={styles.actionBtn} onPress={() => chat.takeOver(type)}>
                  <Text style={styles.actionBtnText}>{`Assumir${task?.type === 'ia' ? ` (${stageLabel({type})})` : ''}`}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>
        {chat.loadingChat ? (
          <ActivityIndicator style={styles.spinner} />
        ) : (
          <FlatList
            ref={listRef}
            data={chat.messages}
            keyExtractor={item => String(item.id || item['@id'])}
            renderItem={renderMessage}
            ListFooterComponent={typing}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => listRef.current?.scrollToEnd?.({animated: true})}
            ListEmptyComponent={<Text style={styles.emptyText}>Pergunte sobre vendas, pedidos, clientes… A IA consulta os dados da empresa.</Text>}
          />
        )}
        {chat.customerChat ? (
          <Text style={styles.composerHint}>A IA está atendendo este cliente. Para responder você mesmo, use “Assumir” ou abra o ticket no CRM / Suporte.</Text>
        ) : (
          <View>
            {ticketComposer && !chat.myTicket ? (
              <View style={styles.ticketTypeRow}>
                {[['support', 'Suporte'], ['relationship', 'Comercial']].map(([value, label]) => (
                  <TouchableOpacity key={value} onPress={() => chat.setTicketType(value)} style={[styles.providerChip, chat.ticketType === value && styles.providerChipActive]}>
                    <Text style={[styles.providerChipText, chat.ticketType === value && styles.providerChipTextActive]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          <View style={styles.composer}>
            <TextInput style={styles.input} value={draft} onChangeText={setDraft} placeholder={chat.myTicket ? 'Escreva no chamado…' : ticketComposer ? 'Descreva o que precisa; abriremos um chamado com a nossa equipe…' : 'Pergunte à IA…'} placeholderTextColor="#8b98a5" multiline editable={!chat.sending} />
            <TouchableOpacity style={[styles.sendBtn, (!draft.trim() || chat.sending) && styles.sendBtnDisabled]} disabled={!draft.trim() || chat.sending} onPress={submit}>
              <Text style={styles.sendBtnText}>{chat.sending ? '…' : ticketComposer && !chat.myTicket ? 'Abrir chamado' : 'Enviar'}</Text>
            </TouchableOpacity>
          </View>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
