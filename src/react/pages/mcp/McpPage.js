/*
 * @agents MCP AI chat (Task type=ia). Keep under 500 lines; API via /mcp/chat*.
 */
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
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
import {useStore} from '@store';
import {api} from '@controleonline/ui-common/src/api';
import useToastMessage from '../../hooks/useToastMessage';
import styles from './McpPage.styles';

const PROVIDER_LABELS = {
  grok: 'Grok',
  openai: 'Codex / OpenAI',
  gemini: 'Gemini',
  claude: 'Claude',
};

export default function McpPage() {
  const {showError, showSuccess} = useToastMessage();
  const peopleStore = useStore('people');
  const company =
    peopleStore?.getters?.currentCompany ||
    peopleStore?.getters?.defaultCompany ||
    null;
  const companyId = company?.id || company?.['@id']?.split('/').pop() || null;

  const [providers, setProviders] = useState([]);
  const [provider, setProvider] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  const companyQuery = useMemo(
    () => (companyId ? {company_id: Number(companyId)} : {}),
    [companyId],
  );

  const loadProviders = useCallback(async () => {
    try {
      const res = await api.fetch('/mcp/chat/providers', {params: companyQuery});
      const list = res?.providers || res?.member || res || [];
      const arr = Array.isArray(list) ? list : [];
      setProviders(arr);
      const enabled = arr.find(p => p.enabled || p.has_key);
      setProvider(prev => prev || enabled?.provider || enabled?.id || enabled?.name || null);
    } catch (e) {
      showError(e?.message || 'Falha ao carregar providers de IA');
    }
  }, [companyQuery, showError]);

  const loadTasks = useCallback(async () => {
    setLoadingList(true);
    try {
      const params = {
        type: 'ia',
        order: {alterDate: 'desc'},
        itemsPerPage: 50,
      };
      if (companyId) {
        params.provider = `/people/${companyId}`;
      }
      const res = await api.fetch('/tasks', {params});
      const items = res?.member || res?.['hydra:member'] || res || [];
      setTasks(Array.isArray(items) ? items : []);
    } catch (e) {
      showError(e?.message || 'Falha ao listar chats');
    } finally {
      setLoadingList(false);
    }
  }, [companyId, showError]);

  const loadMessages = useCallback(
    async taskId => {
      if (!taskId) {
        setMessages([]);
        return;
      }
      setLoadingChat(true);
      try {
        const res = await api.fetch('/task_interations', {
          params: {
            'task.id': taskId,
            type: 'comment',
            order: {id: 'asc'},
            itemsPerPage: 100,
          },
        });
        const items = res?.member || res?.['hydra:member'] || res || [];
        setMessages(Array.isArray(items) ? items : []);
      } catch (e) {
        showError(e?.message || 'Falha ao carregar mensagens');
      } finally {
        setLoadingChat(false);
      }
    },
    [showError],
  );

  useEffect(() => {
    loadProviders();
    loadTasks();
  }, [loadProviders, loadTasks]);

  useEffect(() => {
    loadMessages(activeTaskId);
  }, [activeTaskId, loadMessages]);

  const selectTask = task => {
    const id = task?.id || task?.['@id']?.split('/').pop();
    setActiveTaskId(id ? Number(id) : null);
  };

  const startNewChat = () => {
    setActiveTaskId(null);
    setMessages([]);
    setDraft('');
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    if (!provider) {
      showError('Selecione um provider de IA configurado na empresa');
      return;
    }
    setSending(true);
    try {
      const body = {
        message: text,
        provider,
        ...(activeTaskId ? {task_id: activeTaskId} : {}),
        ...(companyId ? {company_id: Number(companyId)} : {}),
      };
      const res = await api.post('/mcp/chat', body);
      const newTaskId = res?.task?.id;
      setDraft('');
      if (newTaskId && newTaskId !== activeTaskId) {
        setActiveTaskId(Number(newTaskId));
        await loadTasks();
      } else {
        await loadMessages(activeTaskId || newTaskId);
      }
      if (res?.reply) {
        // optimistic refresh
        await loadMessages(newTaskId || activeTaskId);
      }
    } catch (e) {
      showError(e?.message || e?.error || 'Falha ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const activeTask = tasks.find(
    t => String(t.id) === String(activeTaskId) || t['@id']?.endsWith(`/${activeTaskId}`),
  );

  const renderMessage = ({item}) => {
    const body = item?.body || '';
    const byId =
      item?.registeredBy?.id ||
      item?.registeredBy?.['@id']?.split('/').pop() ||
      item?.registered_by_id;
    const isUser = companyId && String(byId) !== String(companyId);
    return (
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAi]}>
        <Text style={styles.bubbleText}>{body}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}>
      <View style={styles.sidebar}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Chats IA</Text>
          <TouchableOpacity onPress={startNewChat} style={styles.newBtn}>
            <Text style={styles.newBtnText}>Novo</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          style={styles.providerRow}
          contentContainerStyle={styles.providerRowContent}>
          {(providers.length ? providers : Object.keys(PROVIDER_LABELS).map(k => ({provider: k, enabled: false}))).map(
            p => {
              const key = p.provider || p.id || p.name;
              const selected = key === provider;
              const disabled = p.enabled === false && !p.has_key;
              return (
                <TouchableOpacity
                  key={String(key)}
                  disabled={disabled}
                  onPress={() => setProvider(key)}
                  style={[
                    styles.providerChip,
                    selected && styles.providerChipActive,
                    disabled && styles.providerChipDisabled,
                  ]}>
                  <Text
                    style={[
                      styles.providerChipText,
                      selected && styles.providerChipTextActive,
                    ]}>
                    {PROVIDER_LABELS[key] || p.label || key}
                  </Text>
                </TouchableOpacity>
              );
            },
          )}
        </ScrollView>
        {loadingList ? (
          <ActivityIndicator style={{marginTop: 16}} />
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={item => String(item.id || item['@id'])}
            renderItem={({item}) => {
              const id = item.id || item['@id']?.split('/').pop();
              const selected = String(id) === String(activeTaskId);
              return (
                <TouchableOpacity
                  onPress={() => selectTask(item)}
                  style={[styles.taskRow, selected && styles.taskRowActive]}>
                  <Text numberOfLines={1} style={styles.taskNameText}>
                    {item.name || `Chat #${id}`}
                  </Text>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhum chat ainda. Envie uma mensagem.</Text>
            }
          />
        )}
      </View>

      <View style={styles.chatPane}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatTitle}>
            {activeTask?.name || (activeTaskId ? `Chat #${activeTaskId}` : 'Novo chat')}
          </Text>
          <Text style={styles.chatSubtitle}>
            {PROVIDER_LABELS[provider] || provider || 'Selecione a IA'}
          </Text>
        </View>
        {loadingChat ? (
          <ActivityIndicator style={{marginTop: 24}} />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={item => String(item.id || item['@id'])}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => listRef.current?.scrollToEnd?.({animated: true})}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                Pergunte algo. A conversa vira uma Task type=ia.
              </Text>
            }
          />
        )}
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Mensagem para a IA…"
            multiline
            editable={!sending}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!draft.trim() || sending) && styles.sendBtnDisabled]}
            disabled={!draft.trim() || sending}
            onPress={sendMessage}>
            <Text style={styles.sendBtnText}>{sending ? '…' : 'Enviar'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
