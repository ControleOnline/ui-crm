/*
 * @agents Web playback of a voice note (native <audio> controls, themed container).
 */
import React from 'react';

export default function AudioPlayer({source}) {
  if (!source?.uri) return null;
  return React.createElement('audio', {src: source.uri, controls: true, preload: 'metadata', style: {width: 240, maxWidth: '100%'}});
}
