/*
 * @agents Shared conversation (requests screen, Support and CRM): header slot, messages grouped by
 * day with WhatsApp-like bubbles, and the composer. Uploads happen here: `onSend({text, fileId})`.
 * `describe(item)` returns {side: 'left'|'right', kind: 'note'|'ai'|'msg'|'hidden', author}.
 */
import React, {useMemo, useRef} from 'react';
import {ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Text, View} from 'react-native';
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
}) {
  const palette = useChatPalette();
  const listRef = useRef(null);

  const rows = useMemo(() => {
    const out = [];
    let lastDay = '';
    let lastAuthor = '';
    (messages || []).forEach(item => {
      const meta = describe(item);
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
  }, [messages, describe]);

  const send = async ({text, file}) => {
    const fileId = file ? await uploadAttachment(file, uploadCompanyId) : null;
    return onSend({text, fileId});
  };

  const renderRow = ({item: row}) =>
    row.type === 'day' ? (
      <View style={{alignItems: 'center', marginVertical: 8}}>
        <Text style={{backgroundColor: palette.chip, color: palette.chipText, fontSize: 12, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8}}>
          {row.label}
        </Text>
      </View>
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
