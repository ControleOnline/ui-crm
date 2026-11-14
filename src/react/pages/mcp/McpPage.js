/*
 * @agents /ai — customer-facing help chat.
 * Left: the user's latest conversations (AI chats and tickets with the platform team).
 * New conversation: "IA" when the user's company has its own AI (it solves with MCP tools and, if it
 * cannot, turns the chat into a Support/Commercial ticket); otherwise choose Suporte or Comercial
 * and a ticket is opened for the platform team. Logic: useMcpChat.
 */
import React, {useRef, useState} from 'react';
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

const {idOf, isCustomerConversation, stageLabel, messageRole} = require('./mcpChatUtils');

const ROLE_LABELS = {ai: 'IA', note: null, customer: null, staff: 'Equipe', me: null};

const conversationLabel = task =>
  isCustomerConversation(task)
    ? `${stageLabel(task)} · ${task?.taskStatus?.status || 'aberto'}`
    : 'IA';

export default function McpPage() {
  const chat = useMcpChat();
  const [draft, setDraft] = useState('');
  const listRef = useRef(null);
  const task = chat.activeTask;
  const isNew = !chat.activeTaskId;

  const submit = async () => {
    const text = draft;
    setDraft('');
    const ok = await chat.sendMessage(text);
    if (!ok) setDraft(text);
  };

  const renderMessage = ({item}) => {
    const role = messageRole(item, {companyId: chat.companyId, task, currentPeopleId: chat.currentPeopleId});
    if (role === 'note') return null; // internal notes of the team never show here
    const right = role === 'me' || role === 'customer';
    return (
      <View style={[styles.bubble, right ? styles.bubbleUser : styles.bubbleAi]}>
        {ROLE_LABELS[role] ? <Text style={styles.bubbleAuthor}>{ROLE_LABELS[role]}</Text> : null}
        <Text style={styles.bubbleText}>{item?.body || ''}</Text>
        {item?.status === 'error' ? <Text style={styles.bubbleMeta}>não enviado</Text> : null}
      </View>
    );
  };

  const typing = chat.aiStatus ? (
    <View style={[styles.bubble, styles.bubbleAi]}>
      <Text style={styles.bubbleMeta}>{chat.aiStatus === 'processing' ? 'IA analisando…' : 'Enviado, aguardando a IA…'}</Text>
    </View>
  ) : null;

  const options = chat.hasAi ? [['ai', 'IA']] : [['support', 'Suporte'], ['relationship', 'Comercial']];
  const selected = chat.hasAi ? 'ai' : chat.ticketType;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
      <View style={styles.sidebar}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Atendimento</Text>
          <TouchableOpacity onPress={chat.startNewChat} style={styles.newBtn}>
            <Text style={styles.newBtnText}>Novo</Text>
          </TouchableOpacity>
        </View>
        {chat.loadingList ? (
          <ActivityIndicator style={styles.spinner} />
        ) : (
          <ScrollView>
            {chat.tasks.length === 0 ? <Text style={styles.emptyText}>Nenhum chamado ainda.</Text> : null}
            {chat.tasks.map(item => {
              const id = idOf(item);
              return (
                <TouchableOpacity key={String(id)} onPress={() => chat.setActiveTaskId(id)} style={[styles.taskRow, id === Number(chat.activeTaskId) && styles.taskRowActive]}>
                  <Text numberOfLines={1} style={styles.taskRowText}>{item.name || `Chamado #${id}`}</Text>
                  <Text style={styles.taskRowMeta}>{conversationLabel(item)}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      <View style={styles.chatPane}>
        <View style={styles.chatHeader}>
          <View style={styles.chatHeaderText}>
            <Text style={styles.chatTitle}>{isNew ? 'Como podemos ajudar?' : task?.name || `Chamado #${chat.activeTaskId}`}</Text>
            {!isNew && task ? <Text style={styles.chatSubtitle}>{conversationLabel(task)}</Text> : null}
          </View>
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
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {chat.hasAi ? 'Como podemos ajudar? Descreva o que precisa.' : 'Escolha Suporte ou Comercial e descreva o que precisa.'}
              </Text>
            }
          />
        )}
        {isNew ? (
          <View style={styles.ticketTypeRow}>
            {options.map(([value, label]) => (
              <TouchableOpacity
                key={value}
                disabled={chat.hasAi}
                onPress={() => chat.setTicketType(value)}
                style={[styles.providerChip, selected === value && styles.providerChipActive]}>
                <Text style={[styles.providerChipText, selected === value && styles.providerChipTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder={isNew ? 'Descreva o que precisa…' : 'Escreva uma mensagem…'}
            placeholderTextColor="#8b98a5"
            multiline
            editable={!chat.sending}
          />
          <TouchableOpacity style={[styles.sendBtn, (!draft.trim() || chat.sending) && styles.sendBtnDisabled]} disabled={!draft.trim() || chat.sending} onPress={submit}>
            <Text style={styles.sendBtnText}>{chat.sending ? '…' : 'Enviar'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
