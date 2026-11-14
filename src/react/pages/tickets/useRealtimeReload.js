/*
 * @agents Calls `reload(events)` (debounced) whenever new conversation events arrive on the
 * websocket store. Used by funnels and ticket screens; /ai has its own finer-grained handling.
 */
import {useEffect, useRef} from 'react';
import {useStore} from '@store';

const {extractChatEvents} = require('../mcp/mcpChatUtils');

export default function useRealtimeReload(reload, {filter = () => true, delay = 500} = {}) {
  const websocketStore = useStore('websocket');
  const messages = websocketStore?.getters?.messages;
  const cursor = useRef(Array.isArray(messages) ? messages.length : 0);
  const timer = useRef(null);
  const reloadRef = useRef(reload);
  reloadRef.current = reload;

  useEffect(() => {
    const {events, nextIndex} = extractChatEvents(messages, cursor.current);
    cursor.current = nextIndex;
    const relevant = events.filter(filter);
    if (!relevant.length) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => reloadRef.current(relevant), delay);
  }, [messages, filter, delay]);

  useEffect(() => () => clearTimeout(timer.current), []);
}
