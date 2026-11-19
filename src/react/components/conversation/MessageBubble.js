/*
 * @agents One message, WhatsApp group-like: requests are group conversations, so every other participant
 * (customer, team member, the AI person) has an avatar (photo or initials) beside the bubble with the
 * name below it, when the speaker changes. My own messages: no avatar, ticks. Internal notes highlighted.
 */
import React from 'react';
import {Text, View} from 'react-native';
import Attachment from './Attachment';
import PeopleAvatar from './PeopleAvatar';
import {fileIdOf} from './fileApi';
import RichText from './RichText';

const {timeLabel} = require('./formatText');

const TICKS = {pending: '🕓', processing: '🕓', done: '✓✓', error: '⚠'};

export default function MessageBubble({item, side, kind, author, showAuthor, palette}) {
  const mine = side === 'right';
  // "Você" (describe) or a message still being sent: my own, no avatar.
  const self = author === 'Você' || Boolean(item?.localId);
  const note = kind === 'note';
  const bg = note ? palette.noteBubble : mine ? palette.mineBubble : palette.otherBubble;
  const fg = mine && !note ? palette.mineText : palette.otherText;
  const body = String(item?.body || '');
  // "Anexo" / "Anexo: name" only describes the file shown above it.
  const isFileLabel = item?.file && /^Anexo(:|$)/.test(body);

  return (
    <View style={{flexDirection: mine ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 4, marginVertical: 2, paddingHorizontal: 8}}>
      {!self ? (showAuthor ? <PeopleAvatar peopleId={fileIdOf(item?.registeredBy)} name={author} palette={palette} /> : <View style={{width: 56}} />) : null}
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
        {showAuthor && note ? (
          <Text style={{color: palette.noteBorder, fontWeight: '700', fontSize: 12, marginBottom: 2}}>nota interna</Text>
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
