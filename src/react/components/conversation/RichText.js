/*
 * @agents Renders a message body with WhatsApp-like formatting (see formatText.js).
 */
import React from 'react';
import {Linking, Platform, Text} from 'react-native';

const {parseRichText} = require('./formatText');

export default function RichText({value, style, linkColor}) {
  const lines = parseRichText(value);
  return (
    <Text style={style} selectable>
      {lines.map((parts, li) => (
        <Text key={li}>
          {parts.map((p, pi) => (
            <Text
              key={pi}
              onPress={p.link ? () => Linking.openURL(p.link) : undefined}
              style={[
                p.bold && {fontWeight: '700'},
                p.italic && {fontStyle: 'italic'},
                p.strike && {textDecorationLine: 'line-through'},
                p.code && {fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'},
                p.link && {color: linkColor, textDecorationLine: 'underline'},
              ]}>
              {p.text}
            </Text>
          ))}
          {li < lines.length - 1 ? '\n' : null}
        </Text>
      ))}
    </Text>
  );
}
