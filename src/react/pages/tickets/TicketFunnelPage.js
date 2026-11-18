/*
 * @agents Kanban funnel for customer tickets (type relationship = CRM, support = Suporte).
 * First column "Triagem IA" = customer conversations the AI has not classified yet.
 * Cards: move stage, put the AI on the ticket, open the conversation. Live via websocket events.
 */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useStore} from '@store';
import useToastMessage from '../../hooks/useToastMessage';
import AssignAiModal from './AssignAiModal';
import useRealtimeReload from './useRealtimeReload';
import {assignAi, fetchStatuses, fetchTickets, fetchTriage, moveTicket} from './ticketApi';
import useTicketStyles from './tickets.styles';

const {idOf, conversationChannel} = require('../mcp/mcpChatUtils');
const {TICKET_TYPES, buildColumns, neighbourStatus, personName, timeAgo} = require('./ticketUtils');

const CHANNEL_LABELS = {whatsapp: 'WhatsApp', email: 'E-mail', web: 'Site'};

const TicketCard = ({task, columns, onMove, onAssign, onOpen}) => {
  const {styles} = useTicketStyles();
  const previous = neighbourStatus(columns, task, -1);
  const next = neighbourStatus(columns, task, 1);
  const channel = conversationChannel(task);
  return (
    <TouchableOpacity style={styles.card} onPress={() => onOpen(task)}>
      <Text style={styles.cardTitle} numberOfLines={2}>{task.name || `#${idOf(task)}`}</Text>
      <Text style={styles.cardMeta} numberOfLines={1}>
        {[personName(task.client), timeAgo(task.alterDate)].filter(Boolean).join(' · ')}
      </Text>
      <View style={styles.badges}>
        {task.aiAgent ? <View style={[styles.badge, styles.badgeAi]}><Text style={[styles.badgeText, styles.badgeAiText]}>IA atendendo</Text></View> : null}
        {CHANNEL_LABELS[channel] ? <View style={styles.badge}><Text style={styles.badgeText}>{CHANNEL_LABELS[channel]}</Text></View> : null}
      </View>
      <View style={styles.cardActions}>
        {previous ? <TouchableOpacity style={styles.iconBtn} onPress={() => onMove(task, previous)}><Text style={styles.iconBtnText}>◀</Text></TouchableOpacity> : null}
        {next ? <TouchableOpacity style={styles.iconBtn} onPress={() => onMove(task, next)}><Text style={styles.iconBtnText}>▶</Text></TouchableOpacity> : null}
        {!task.aiAgent ? <TouchableOpacity style={styles.iconBtn} onPress={() => onAssign(task)}><Text style={styles.iconBtnText}>Atribuir IA</Text></TouchableOpacity> : null}
      </View>
    </TouchableOpacity>
  );
};

export default function TicketFunnelPage({type = 'relationship'}) {
  const navigation = useNavigation();
  const {styles, palette} = useTicketStyles();
  const {showError, showSuccess} = useToastMessage();
  const peopleStore = useStore('people');
  const companyId = idOf(peopleStore?.getters?.currentCompany || peopleStore?.getters?.mainCompany);
  const meta = TICKET_TYPES[type] || TICKET_TYPES.relationship;

  const [statuses, setStatuses] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [triage, setTriage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [assigning, setAssigning] = useState(null);

  const load = useCallback(async () => {
    if (!companyId) return;
    try {
      const [s, t, tr] = await Promise.all([fetchStatuses(type), fetchTickets(type, companyId), fetchTriage(companyId)]);
      setStatuses(s);
      setTickets(t);
      setTriage(tr);
    } catch (e) {
      showError(e?.message || 'Falha ao carregar o funil');
    } finally {
      setLoading(false);
    }
  }, [companyId, type, showError]);

  useEffect(() => {
    load();
  }, [load]);
  useRealtimeReload(load);

  const columns = useMemo(() => {
    const q = search.trim().toLowerCase();
    const match = t => !q || `${t.name || ''} ${personName(t.client)}`.toLowerCase().includes(q);
    return buildColumns(statuses, tickets.filter(match), triage.filter(match));
  }, [statuses, tickets, triage, search]);

  const move = async (task, status) => {
    setTickets(prev => prev.map(t => (idOf(t) === idOf(task) ? {...t, taskStatus: status} : t)));
    try {
      await moveTicket(task, status);
    } catch (e) {
      showError(e?.message || 'Não foi possível mover');
      load();
    }
  };

  const confirmAssign = async instructions => {
    try {
      await assignAi(idOf(assigning), companyId, instructions);
      showSuccess('IA atribuída. Ela fará o primeiro contato com o cliente.');
      setAssigning(null);
      load();
    } catch (e) {
      showError(e?.message || 'Não foi possível atribuir a IA');
    }
  };

  // CRM opens its own conversation (workspace + marketing events); Support opens the ticket page.
  const open = task =>
    type === 'relationship'
      ? navigation.navigate('CrmConversation', {taskId: idOf(task), opportunity: task})
      : navigation.navigate('TicketConversation', {taskId: idOf(task)});

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{meta.title}</Text>
          <Text style={styles.subtitle}>{`${tickets.length} tickets · ${triage.length} em triagem pela IA`}</Text>
        </View>
        <TextInput style={styles.search} value={search} onChangeText={setSearch} placeholder="Buscar cliente ou título" placeholderTextColor={palette.placeholder} />
      </View>
      {loading ? (
        <ActivityIndicator style={styles.spinner} />
      ) : (
        <ScrollView horizontal style={styles.board} contentContainerStyle={styles.boardContent}>
          {columns.map(column => (
            <View key={column.key} style={[styles.column, column.color ? {borderTopColor: column.color} : null]}>
              <View style={styles.columnHeader}>
                <Text style={styles.columnTitle}>{column.title}</Text>
                <Text style={styles.columnCount}>{column.tasks.length}</Text>
              </View>
              <ScrollView style={styles.columnBody}>
                {column.tasks.length === 0 ? <Text style={styles.emptyText}>{meta.empty}</Text> : null}
                {column.tasks.map(task => (
                  <TicketCard key={String(idOf(task))} task={task} columns={columns} onMove={move} onAssign={setAssigning} onOpen={open} />
                ))}
              </ScrollView>
            </View>
          ))}
        </ScrollView>
      )}
      <AssignAiModal visible={Boolean(assigning)} ticketName={assigning?.name} onCancel={() => setAssigning(null)} onConfirm={confirmAssign} />
    </View>
  );
}

export const CrmFunnelPage = () => <TicketFunnelPage type="relationship" />;
export const SupportFunnelPage = () => <TicketFunnelPage type="support" />;
