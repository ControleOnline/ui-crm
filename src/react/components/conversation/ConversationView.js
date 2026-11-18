/*
 * @agents Shared conversation (requests screen, Support and CRM): header slot, messages grouped by
 * day with WhatsApp-like bubbles, and the composer. Uploads happen here: `onSend({text, fileId})`.
 * `describe(item)` returns {side: 'left'|'right', kind: 'note'|'ai'|'msg'|'hidden', author}.
 */
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Text, TouchableOpacity, View} from 'react-native';
import Composer from './Composer';
import MessageBubble from './MessageBubble';
import useChatPalette from './useChatPalette';
import {uploadAttachment} from './fileApi';

const {dayLabel} = require('./formatText');

const keyOf = item => String(item?.id || item?.['@id'] || item?.localId);

export default function ConversationView({
  header,
  messages,
  loading,
  describe,
  onSend,
  uploadCompanyId,
  placeholder = 'Mensagem',
  canSend = true,
  disabledText = '',
  composerTop = null,
  emptyText = 'Nenhuma mensagem ainda.',
  footer = null,
  onError,
  pendingKind = 'msg',
}) {
  const palette = useChatPalette();
  const listRef = useRef(null);
  // Optimistic messages: shown at once (🕓), sent one by one in the background, removed when the
  // conversation reloads with them; a failed one stays (⚠) and is re-sent with a tap.
  const [pending, setPending] = useState([]);
  const onSendRef = useRef(onSend);
  const queueRef = useRef(Promise.resolve());
  useEffect(() => {
    onSendRef.current = onSend;
  }, [onSend]);

  const rows = useMemo(() => {
    const out = [];
    let lastDay = '';
    let lastAuthor = '';
    [...(messages || []), ...pending].forEach(item => {
      const meta = item?.localId ? {side: 'right', kind: item.kind, author: 'Você'} : describe(item);
      if (meta.kind === 'hidden') return;
      const day = dayLabel(item?.createdAt);
      if (day && day !== lastDay) {
        out.push({type: 'day', key: `day-${day}-${keyOf(item)}`, label: day});
        lastDay = day;
        lastAuthor = '';
      }
      const authorKey = `${meta.side}|${meta.author}|${meta.kind}`;
      out.push({type: 'msg', key: keyOf(item), item, meta, showAuthor: authorKey !== lastAuthor});
      lastAuthor = authorKey;
    });
    return out;
  }, [messages, pending, describe]);

  const deliver = useCallback(
    entry => {
      queueRef.current = queueRef.current.then(async () => {
        setPending(list => list.map(p => (p.localId === entry.localId ? {...p, status: 'pending'} : p)));
        try {
          const fileId = entry.upload ? await uploadAttachment(entry.upload, uploadCompanyId) : null;
          // kind is captured when the message is written (a note stays a note if the mode changes).
          await onSendRef.current({text: entry.text, fileId, kind: entry.kind});
          setPending(list => list.filter(p => p.localId !== entry.localId));
        } catch (e) {
          setPending(list => list.map(p => (p.localId === entry.localId ? {...p, status: 'error'} : p)));
          onError?.(e?.message || 'Não foi possível enviar');
        }
        // Lets React apply state from this send (e.g. a new request id) before the next one.
        await new Promise(resolve => setTimeout(resolve, 0));
      });
    },
    [uploadCompanyId, onError],
  );

  const send = ({text, file}) => {
    const entry = {
      localId: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text,
      body: [file ? `📎 ${file.name || 'arquivo'}` : '', text].filter(Boolean).join('\n'),
      upload: file || null,
      createdAt: new Date().toISOString(),
      status: 'pending',
      kind: pendingKind,
    };
    setPending(list => [...list, entry]);
    deliver(entry);
    return true;
  };

  const renderRow = ({item: row}) =>
    row.type === 'day' ? (
      <View style={{alignItems: 'center', marginVertical: 8}}>
        <Text style={{backgroundColor: palette.chip, color: palette.chipText, fontSize: 12, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8}}>
          {row.label}
        </Text>
      </View>
    ) : row.item?.localId && row.item.status === 'error' ? (
      <TouchableOpacity onPress={() => deliver(row.item)} accessibilityLabel="Reenviar mensagem">
        <MessageBubble item={row.item} side={row.meta.side} kind={row.meta.kind} author={row.meta.author} showAuthor={row.showAuthor} palette={palette} />
        <Text style={{color: palette.danger, fontSize: 11, textAlign: 'right', paddingHorizontal: 12}}>Não enviada · toque para reenviar</Text>
      </TouchableOpacity>
    ) : (
      <MessageBubble item={row.item} side={row.meta.side} kind={row.meta.kind} author={row.meta.author} showAuthor={row.showAuthor} palette={palette} />
    );

  return (
    <KeyboardAvoidingView style={{flex: 1, minHeight: 0, backgroundColor: palette.background}} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
      {header}
      {loading ? (
        <ActivityIndicator style={{marginTop: 24}} color={palette.primary} />
      ) : (
        <FlatList
          ref={listRef}
          data={rows}
          keyExtractor={row => row.key}
          renderItem={renderRow}
          contentContainerStyle={{paddingVertical: 8, flexGrow: 1}}
          onContentSizeChange={() => listRef.current?.scrollToEnd?.({animated: false})}
          ListEmptyComponent={<Text style={{color: palette.muted, textAlign: 'center', marginTop: 32, paddingHorizontal: 16}}>{emptyText}</Text>}
        />
      )}
      {footer}
      <Composer palette={palette} placeholder={placeholder} disabled={!canSend} disabledText={disabledText} onSend={send} top={composerTop} onError={onError} />
    </KeyboardAvoidingView>
  );
}
