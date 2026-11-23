/*
 * @agents Marketing AI chat for APP_TYPE=MKT (#100). Reuses /mcp/chat
 * (McpChatController) and the McpMarketingTools of #105. The LLM reads
 * ga4/ads/adsense via tool-calls and the UI confirms mutations (pause/
 * resume/update_budget) before letting force=true be sent.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View, StyleSheet} from 'react-native';

import useToastMessage from '../../hooks/useToastMessage';
import useChatPalette from '../../components/conversation/useChatPalette';
import {sendRequestMessage, fetchMessages} from '../../components/conversation/requestApi';

import IntegrationStatusPanel from './IntegrationStatusPanel';

export default function MarketingAiPage({companyId}) {
  const palette = useChatPalette();
  const {showError} = useToastMessage();
  const localStyles = useLocalStyles(palette);

  const [taskId, setTaskId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadHistory = useCallback(
    async id => {
      if (!id) return;
      setLoading(true);
      try {
        const items = await fetchMessages(id);
        setMessages(Array.isArray(items) ? items : []);
      } catch (err) {
        showError(err?.message || String(err));
      } finally {
        setLoading(false);
      }
    },
    [showError],
  );

  useEffect(() => {
    loadHistory(taskId);
  }, [taskId, loadHistory]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const response = await sendRequestMessage({
        taskId,
        type: taskId ? undefined : 'ia',
        text,
        companyId,
      });
      const nextTaskId = response?.task_id || response?.taskId || taskId;
      if (nextTaskId && nextTaskId !== taskId) {
        setTaskId(nextTaskId);
      } else if (nextTaskId) {
        loadHistory(nextTaskId);
      }
      setInput('');
    } catch (err) {
      showError(err?.message || String(err));
    } finally {
      setSending(false);
    }
  }, [companyId, input, loadHistory, sending, showError, taskId]);

  return (
    <View style={localStyles.container}>
      <View style={localStyles.sidebar}>
        <Text style={localStyles.sidebarTitle}>
          {global.t?.t('marketing', 'ai', 'title', 'Marketing · IA')}
        </Text>
        <IntegrationStatusPanel companyId={companyId} />
      </View>

      <View style={localStyles.chatArea}>
        <ScrollView contentContainerStyle={localStyles.messagesContainer}>
          {loading ? <ActivityIndicator color={palette.primary} /> : null}
          {!loading && messages.length === 0 ? (
            <Text style={localStyles.emptyText}>
              {global.t?.t(
                'marketing',
                'ai',
                'empty',
                'Pergunte sobre desempenho ou peça para a IA agir (pausar campanha, ajustar orçamento). Mudanças sensíveis pedem sua confirmação.',
              )}
            </Text>
          ) : null}
          {messages.map(message => (
            <View
              key={String(message.id || message['@id'])}
              style={[
                localStyles.messageBubble,
                message.registeredBy?.type === 'ia' || message.author === 'ia'
                  ? localStyles.messageAi
                  : localStyles.messageUser,
              ]}>
              <Text style={localStyles.messageText}>{message.body || ''}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={localStyles.composer}>
          <TextInput
            style={localStyles.composerInput}
            value={input}
            onChangeText={setInput}
            placeholder={global.t?.t(
              'marketing',
              'ai',
              'inputPlaceholder',
              'Como está o Google Ads esta semana?',
            )}
            placeholderTextColor={palette.muted}
            multiline
          />
          <TouchableOpacity
            onPress={send}
            disabled={sending || !input.trim()}
            style={[
              localStyles.composerButton,
              (sending || !input.trim()) && localStyles.composerButtonDisabled,
            ]}>
            <Text style={localStyles.composerButtonText}>
              {sending
                ? global.t?.t('marketing', 'ai', 'sending', 'Enviando…')
                : global.t?.t('marketing', 'ai', 'send', 'Enviar')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const useLocalStyles = palette =>
  StyleSheet.create({
    container: {flex: 1, flexDirection: 'row', backgroundColor: palette.background},
    sidebar: {
      width: 300,
      borderRightWidth: 1,
      borderRightColor: palette.border,
      backgroundColor: palette.panel,
      padding: 16,
    },
    sidebarTitle: {color: palette.text, fontWeight: '700', fontSize: 17, marginBottom: 16},
    chatArea: {flex: 1, flexDirection: 'column'},
    messagesContainer: {padding: 20, flexGrow: 1},
    emptyText: {color: palette.muted, fontSize: 14},
    messageBubble: {
      padding: 12,
      borderRadius: 10,
      marginBottom: 10,
      maxWidth: '80%',
    },
    messageUser: {alignSelf: 'flex-end', backgroundColor: palette.chipActive},
    messageAi: {alignSelf: 'flex-start', backgroundColor: palette.chip},
    messageText: {color: palette.text},
    composer: {
      flexDirection: 'row',
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: palette.border,
      backgroundColor: palette.panel,
      columnGap: 10,
    },
    composerInput: {
      flex: 1,
      minHeight: 44,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: palette.border,
      paddingHorizontal: 12,
      color: palette.text,
    },
    composerButton: {
      backgroundColor: palette.chipActive,
      borderRadius: 10,
      paddingHorizontal: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    composerButtonDisabled: {opacity: 0.6},
    composerButtonText: {color: palette.chipActiveText, fontWeight: '700'},
  });
