/*
 * @agents Analyst workspace of one request (/ai analyst screen and CRM), app-community#1599/#1600:
 * WhatsApp-like conversation + actions: status, category, responsible (only the context's responders:
 * CRM = salesmen/assistants, Support = Manager list), context relationship <-> support, due date,
 * reply to the customer or internal note, and call the company's AI (only when one is connected).
 * Who may reply mirrors the backend rule (TicketRulesService): non-responders see a notice.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import useToastMessage from '../../hooks/useToastMessage';
import ConversationView from '../../components/conversation/ConversationView';
import OptionPicker from '../../components/conversation/OptionPicker';
import useChatPalette from '../../components/conversation/useChatPalette';
import {
  assignAi,
  fetchCategories,
  fetchCompanyAis,
  fetchMessages,
  fetchResponders,
  fetchStatuses,
  fetchTask,
  personName,
  postInteraction,
  REQUEST_TYPES,
  takeOver,
  updateTask,
} from '../../components/conversation/requestApi';
import AssignAiModal from './AssignAiModal';
import useRealtimeReload from './useRealtimeReload';
import {useStore} from '@store';

const {idOf, messageRole, conversationChannel} = require('../mcp/mcpChatUtils');

const CHANNELS = {whatsapp: 'WhatsApp', email: 'E-mail', web: 'App'};
const DUE_OPTIONS = [
  {value: '', label: 'Sem previsão'},
  {value: '0', label: 'Hoje'},
  {value: '1', label: 'Amanhã'},
  {value: '3', label: 'Em 3 dias'},
  {value: '7', label: 'Em 7 dias'},
];

export default function TicketWorkspace({taskId, extra = null}) {
  const palette = useChatPalette();
  const {showError, showSuccess} = useToastMessage();
  const onError = useCallback(message => showError(message), [showError]);
  const authStore = useStore('auth');
  const meId = idOf(authStore?.getters?.user?.people);

  const [task, setTask] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState({statuses: [], categories: [], responders: [], canReply: false, ais: []});
  const [mode, setMode] = useState('public');
  const [assignOpen, setAssignOpen] = useState(false);

  const providerId = idOf(task?.provider);
  const type = task?.type;

  const load = useCallback(
    async ({quiet = false} = {}) => {
      if (!taskId) return;
      if (!quiet) setLoading(true);
      try {
        const [t, m] = await Promise.all([fetchTask(taskId), fetchMessages(taskId)]);
        setTask(t);
        setMessages(m);
      } catch (e) {
        onError(e?.message || 'Falha ao carregar a solicitação');
      } finally {
        setLoading(false);
      }
    },
    [taskId, onError],
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!type || !providerId) return;
    Promise.all([
      fetchStatuses(type).catch(() => []),
      fetchCategories(type, providerId).catch(() => []),
      fetchResponders(type, providerId).catch(() => ({responders: [], can_reply: false})),
      fetchCompanyAis(providerId),
    ]).then(([statuses, categories, responders, ais]) =>
      setOptions({statuses, categories, responders: responders?.responders || [], canReply: Boolean(responders?.can_reply), ais}),
    );
  }, [type, providerId]);

  useRealtimeReload(() => load({quiet: true}), {filter: useCallback(evt => Number(evt.task_id) === Number(taskId), [taskId]), delay: 200});

  const save = async (patch, message) => {
    try {
      await updateTask(task, patch);
      if (message) showSuccess(message);
      await load({quiet: true});
    } catch (e) {
      onError(e?.message || 'Não foi possível salvar');
    }
  };

  const changeContext = async newType => {
    const statuses = await fetchStatuses(newType).catch(() => []);
    const same = statuses.find(s => s.realStatus === task?.taskStatus?.realStatus) || statuses[0];
    // The responsible person and category belong to the old context: cleared for the new one.
    await save({type: newType, ...(same ? {taskStatus: same['@id'] || `/statuses/${idOf(same)}`} : {}), taskFor: null, category: null}, 'Contexto alterado');
  };

  const changeDue = value => {
    if (value === '') return save({dueDate: null});
    const d = new Date();
    d.setDate(d.getDate() + Number(value));
    d.setHours(18, 0, 0, 0);
    return save({dueDate: d.toISOString()});
  };

  const describe = useCallback(
    item => {
      const role = messageRole(item, {companyId: providerId, task, currentPeopleId: meId});
      if (role === 'customer') return {side: 'left', kind: 'msg', author: personName(item?.registeredBy) || 'Cliente'};
      if (role === 'ai') return {side: 'right', kind: 'ai', author: 'IA'};
      if (role === 'note' || item?.visibility === 'private') return {side: 'right', kind: 'note', author: personName(item?.registeredBy) || 'Equipe'};
      return {side: 'right', kind: 'msg', author: role === 'me' ? 'Você' : personName(item?.registeredBy) || 'Equipe'};
    },
    [providerId, task, meId],
  );

  const send = async ({text, fileId}) => {
    await postInteraction(taskId, {text, fileId, visibility: mode});
    await load({quiet: true});
    return true;
  };

  if (!task && !loading) return <Text style={{color: palette.muted, padding: 24}}>Solicitação não encontrada.</Text>;

  const channel = CHANNELS[conversationChannel(task)] || '';
  const btn = active => ({
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 6,
    marginBottom: 6,
    backgroundColor: active ? palette.chipActive : palette.chip,
  });

  const header = task ? (
    <View style={{borderBottomWidth: 1, borderBottomColor: palette.border, backgroundColor: palette.panel, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4}}>
      <Text style={{color: palette.text, fontWeight: '700', fontSize: 16}} numberOfLines={1}>
        {task.name || `Solicitação #${taskId}`}
      </Text>
      <Text style={{color: palette.muted, fontSize: 12, marginBottom: 8}} numberOfLines={1}>
        {[personName(task.client), channel, `#${taskId}`].filter(Boolean).join(' · ')}
      </Text>
      <View style={{flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center'}}>
        <OptionPicker label="Contexto" value={task.type} options={REQUEST_TYPES} onChange={changeContext} />
        <OptionPicker
          label="Status"
          value={idOf(task.taskStatus)}
          options={options.statuses.map(s => ({value: idOf(s), label: s.status, hint: s.realStatus}))}
          onChange={(_, o) => save({taskStatus: `/statuses/${o.value}`}, 'Status alterado')}
        />
        <OptionPicker
          label="Categoria"
          value={idOf(task.category) || ''}
          options={[{value: '', label: 'Sem categoria'}, ...options.categories.map(c => ({value: idOf(c), label: c.name}))]}
          onChange={value => save({category: value ? `/categories/${value}` : null}, 'Categoria alterada')}
        />
        <OptionPicker
          label="Responsável"
          value={idOf(task.taskFor) || ''}
          options={[{value: '', label: 'Sem responsável'}, ...options.responders.map(p => ({value: p.id, label: p.alias || p.name}))]}
          onChange={value => save({taskFor: value ? `/people/${value}` : null}, 'Responsável alterado')}
        />
        <OptionPicker
          label="Previsão"
          value=""
          options={DUE_OPTIONS}
          placeholder={task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : 'Sem previsão'}
          onChange={changeDue}
        />
        {task.aiAgent ? (
          <TouchableOpacity style={btn(true)} onPress={() => takeOver(taskId, providerId, task.type).then(() => load({quiet: true})).catch(e => onError(e?.message))}>
            <Text style={{color: palette.chipActiveText, fontSize: 12, fontWeight: '700'}}>IA atendendo · Assumir</Text>
          </TouchableOpacity>
        ) : options.ais.length ? (
          <TouchableOpacity style={btn(false)} onPress={() => setAssignOpen(true)}>
            <Text style={{color: palette.chipText, fontSize: 12, fontWeight: '700'}}>Acionar IA</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  ) : null;

  const modeChips = (
    <View style={{flexDirection: 'row', marginBottom: 6}}>
      {[
        ['public', `Responder cliente${channel ? ` (${channel})` : ''}`],
        ['private', 'Nota interna'],
      ].map(([value, label]) => (
        <TouchableOpacity key={value} style={btn(mode === value)} onPress={() => setMode(value)}>
          <Text style={{color: mode === value ? palette.chipActiveText : palette.chipText, fontSize: 12}}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={{flex: 1, minHeight: 0}}>
      <ConversationView
        header={header}
        messages={messages}
        loading={loading}
        describe={describe}
        onSend={send}
        uploadCompanyId={providerId}
        placeholder={mode === 'public' ? 'Mensagem para o cliente' : 'Nota visível só para a equipe'}
        canSend={options.canReply}
        disabledText={
          task?.type === 'relationship'
            ? 'Somente vendedores e assistentes de vendas respondem chamados comerciais.'
            : 'Somente quem atende suporte (Configurador → Atendimento) responde estes chamados.'
        }
        composerTop={modeChips}
        footer={extra}
        onError={onError}
      />
      <AssignAiModal
        visible={assignOpen}
        ticketName={task?.name}
        onCancel={() => setAssignOpen(false)}
        onConfirm={instructions =>
          assignAi(taskId, providerId, instructions)
            .then(() => {
              setAssignOpen(false);
              return load({quiet: true});
            })
            .catch(e => onError(e?.message || 'Não foi possível acionar a IA'))
        }
      />
    </View>
  );
}
