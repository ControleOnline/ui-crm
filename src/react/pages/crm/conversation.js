/*
 * @agents CRM conversation of an opportunity (relationship request): the same analyst workspace as
 * Support (TicketWorkspace — status, category, responsible, context, AI, WhatsApp-like chat), plus the
 * client's marketing events. Only salesmen/sales assistants (or the AI) may reply (app-community#1600).
 */
import React, {useEffect} from 'react';
import {useNavigation, useRoute} from '@react-navigation/native';
import useToastMessage from '../../hooks/useToastMessage';
import MarketingEventsSection from './components/MarketingEventsSection';
import TicketWorkspace from '../tickets/TicketWorkspace';

const {idOf} = require('../mcp/mcpChatUtils');

const peopleRefOf = value => {
  const id = idOf(value);
  return id ? `/people/${id}` : '';
};

export default function CrmConversation() {
  const route = useRoute();
  const navigation = useNavigation();
  const {showError} = useToastMessage();
  const opportunity = route.params?.opportunity || null;
  const taskId = idOf(opportunity) || Number(route.params?.taskId || 0);

  useEffect(() => {
    if (!taskId) {
      showError(global.t?.t('users', 'error', 'opportunityNotFound', 'Oportunidade nao encontrada para abrir a conversa.'));
      navigation.goBack();
    }
  }, [taskId, navigation, showError]);

  if (!taskId) return null;
  const client = opportunity?.client;
  return (
    <TicketWorkspace
      taskId={taskId}
      extra={client ? <MarketingEventsSection peopleRef={peopleRefOf(client)} peopleName={client?.name || client?.alias || 'Cliente'} /> : null}
    />
  );
}
