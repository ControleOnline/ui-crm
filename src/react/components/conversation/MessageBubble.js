/*
 * @agents One message, WhatsApp-like: avatar + name for others, own messages on the right with
 * time and delivery ticks, internal notes highlighted. Text uses RichText; files use Attachment.
 */
import React from 'react';
import {Text, View} from 'react-native';
import Attachment from './Attachment';
import RichText from './RichText';

const {initialsOf, timeLabel} = require('./formatText');

const TICKS = {pending: '🕓', processing: '🕓', done: '✓✓', error: '⚠'};

export default function MessageBubble({item, side, kind, author, showAuthor, palette}) {
  const mine = side === 'right';
  const note = kind === 'note';
  const bg = note ? palette.noteBubble : mine ? palette.mineBubble : palette.otherBubble;
  const fg = mine && !note ? palette.mineText : palette.otherText;
  const body = String(item?.body || '');
  // "Anexo" / "Anexo: name" only describes the file shown above it.
  const isFileLabel = item?.file && /^Anexo(:|$)/.test(body);

  return (
    <View style={{flexDirection: 'row', justifyContent: mine ? 'flex-end' : 'flex-start', marginVertical: 2, paddingHorizontal: 8}}>
      {!mine ? (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            marginRight: 6,
            marginTop: 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: showAuthor ? palette.chipActive : 'transparent',
          }}>
          {showAuthor ? <Text style={{color: palette.chipActiveText, fontWeight: '700', fontSize: 12}}>{initialsOf(author)}</Text> : null}
        </View>
      ) : null}
      <View
        style={{
          maxWidth: '78%',
          minWidth: 80,
          backgroundColor: bg,
          borderRadius: 12,
          borderTopLeftRadius: !mine && showAuthor ? 2 : 12,
          borderTopRightRadius: mine && showAuthor ? 2 : 12,
          borderWidth: note ? 1 : 0,
          borderColor: palette.noteBorder,
          paddingHorizontal: 10,
          paddingTop: 6,
          paddingBottom: 4,
        }}>
        {showAuthor && (!mine || note) ? (
          <Text style={{color: note ? palette.noteBorder : palette.chipActive, fontWeight: '700', fontSize: 12, marginBottom: 2}}>
            {note ? `${author} · nota interna` : author}
          </Text>
        ) : null}
        {item?.file ? <Attachment file={item.file} color={fg} /> : null}
        {body && !isFileLabel ? <RichText value={body} style={{color: fg, fontSize: 15, lineHeight: 20}} linkColor={fg} /> : null}
        <View style={{flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 2}}>
          <Text style={{color: fg, opacity: 0.7, fontSize: 11}}>{timeLabel(item?.createdAt)}</Text>
          {mine && !note ? <Text style={{color: item?.status === 'error' ? palette.danger : fg, opacity: 0.8, fontSize: 11}}>{TICKS[item?.status] || '✓'}</Text> : null}
        </View>
      </View>
    </View>
  );
}
