/*
 * @agents /ticket/:taskId — one request opened from Support (or a push notification): the shared
 * analyst workspace (TicketWorkspace).
 */
import React from 'react';
import {useRoute} from '@react-navigation/native';
import TicketWorkspace from './TicketWorkspace';

export default function TicketConversationPage() {
  const route = useRoute();
  return <TicketWorkspace taskId={Number(route?.params?.taskId || 0)} />;
}
