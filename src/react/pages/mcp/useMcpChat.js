/*
 * @agents Data + realtime logic for /ai. Replies arrive by websocket (store "websocket",
 * events mcp_chat_reply / conversation_message); a single fallback reload covers a lost event.
 */
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useStore} from '@store';
import {api} from '@controleonline/ui-common/src/api';
import useToastMessage from '../../hooks/useToastMessage';

const {
  idOf,
  isCustomerConversation,
  extractChatEvents,
  mergeConversations,
} = require('./mcpChatUtils');

const REPLY_FALLBACK_MS = 90000;
const LIST_DEBOUNCE_MS = 400;
const TICKET_REFRESH_MS = 20000;
const toItems = res => {
  const items = res?.member || res?.['hydra:member'] || res || [];
  return Array.isArray(items) ? items : [];
};

export default function useMcpChat() {
  const {showError} = useToastMessage();
  const peopleStore = useStore('people');
  const websocketStore = useStore('websocket');
  const authStore = useStore('auth');
  const wsMessages = websocketStore?.getters?.messages;
  const currentPeopleId = idOf(authStore?.getters?.user?.people);
  const company = peopleStore?.getters?.currentCompany || peopleStore?.getters?.mainCompany || null;
  const companyId = idOf(company);

  const [providers, setProviders] = useState([]);
  const [provider, setProvider] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [pending, setPending] = useState({}); // taskId -> 'pending' | 'processing'
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);

  const activeRef = useRef(null);
  activeRef.current = activeTaskId;
  // Start after whatever is already in the store: old replies must not replay.
  const wsCursor = useRef(Array.isArray(wsMessages) ? wsMessages.length : 0);
  const listTimer = useRef(null);
  const fallbackTimers = useRef({});

  const activeTask = useMemo(
    () => tasks.find(t => idOf(t) === Number(activeTaskId)) || null,
    [tasks, activeTaskId],
  );
  // A ticket I opened with the platform (my company has no AI): I talk in it from here.
  const myTicket = Boolean(activeTask) && isCustomerConversation(activeTask) && idOf(activeTask.client) === Number(currentPeopleId);
  // Someone else's customer conversation handled by our AI: read-only here.
  const customerChat = isCustomerConversation(activeTask) && !myTicket;
  const [ticketType, setTicketType] = useState('support');

  const loadProviders = useCallback(async () => {
    try {
      const res = await api.fetch('/mcp/chat/providers', {params: companyId ? {company_id: companyId} : {}});
      const list = Array.isArray(res?.providers) ? res.providers : [];
      setProviders(list);
      // The company's chosen AI (General settings → IA); otherwise the first connected one.
      setProvider(prev => prev || res?.default || list.find(p => p.default)?.provider || list[0]?.provider || null);
    } catch (e) {
      showError(e?.message || 'Falha ao carregar providers de IA');
    }
  }, [companyId, showError]);

  const loadTasks = useCallback(async () => {
    if (!companyId) return;
    const base = {provider: `/people/${companyId}`, 'order[alterDate]': 'desc', itemsPerPage: 50};
    try {
      // The user's conversations: chats with the company AI + tickets with the platform team.
      const [internal, tickets] = await Promise.all([
        api.fetch('/tasks', {params: {...base, type: 'ia', ...(currentPeopleId ? {registeredBy: `/people/${currentPeopleId}`} : {})}}),
        currentPeopleId
          ? api.fetch('/tasks', {params: {client: `/people/${currentPeopleId}`, announce: 'via:ai', 'order[alterDate]': 'desc', itemsPerPage: 50}})
          : Promise.resolve([]),
      ]);
      setTasks(mergeConversations([toItems(internal), toItems(tickets)], currentPeopleId));
    } catch (e) {
      showError(e?.message || 'Falha ao listar conversas');
    } finally {
      setLoadingList(false);
    }
  }, [companyId, currentPeopleId, showError]);

  const scheduleTasksReload = useCallback(() => {
    clearTimeout(listTimer.current);
    listTimer.current = setTimeout(loadTasks, LIST_DEBOUNCE_MS);
  }, [loadTasks]);

  const loadMessages = useCallback(
    async (taskId, {silent = false} = {}) => {
      if (!taskId) {
        setMessages([]);
        return;
      }
      if (!silent) setLoadingChat(true);
      try {
        const res = await api.fetch('/task_interations', {
          params: {'task.id': taskId, type: 'comment', 'order[id]': 'asc', itemsPerPage: 200},
        });
        // Ignore a late response for a chat the user already left.
        if (Number(activeRef.current) === Number(taskId)) setMessages(toItems(res));
      } catch (e) {
        showError(e?.message || 'Falha ao carregar mensagens');
      } finally {
        if (!silent) setLoadingChat(false);
      }
    },
    [showError],
  );

  useEffect(() => {
    loadProviders();
    loadTasks();
  }, [loadProviders, loadTasks]);

  useEffect(() => {
    loadMessages(activeTaskId);
  }, [activeTaskId, loadMessages]);

  // Platform staff replies to my ticket are not pushed to my devices: refresh while it is open.
  useEffect(() => {
    if (!myTicket || !activeTaskId) return undefined;
    const timer = setInterval(() => loadMessages(activeTaskId, {silent: true}), TICKET_REFRESH_MS);
    return () => clearInterval(timer);
  }, [myTicket, activeTaskId, loadMessages]);

  useEffect(
    () => () => {
      clearTimeout(listTimer.current);
      Object.values(fallbackTimers.current).forEach(clearTimeout);
    },
    [],
  );

  const settle = useCallback(taskId => {
    clearTimeout(fallbackTimers.current[taskId]);
    delete fallbackTimers.current[taskId];
    setPending(prev => {
      const next = {...prev};
      delete next[taskId];
      return next;
    });
  }, []);

  // Realtime: consume every new event since the last cursor (several can arrive in one batch).
  useEffect(() => {
    const {events, nextIndex} = extractChatEvents(wsMessages, wsCursor.current);
    wsCursor.current = nextIndex;
    if (!events.length) return;

    let reloadActive = false;
    events.forEach(evt => {
      if (companyId && evt.companyId && Number(evt.companyId) !== Number(companyId)) return;
      const taskId = Number(evt.task_id || 0);
      if (!taskId) return;
      if (evt.status === 'processing') {
        setPending(prev => ({...prev, [taskId]: 'processing'}));
      } else if (evt.event === 'mcp_chat_reply') {
        settle(taskId);
        if (evt.status === 'error') showError(evt.body || 'A IA não conseguiu responder.');
      }
      if (taskId === Number(activeRef.current) && evt.status !== 'processing') reloadActive = true;
    });
    if (reloadActive) loadMessages(activeRef.current, {silent: true});
    scheduleTasksReload();
  }, [wsMessages, companyId, loadMessages, scheduleTasksReload, settle, showError]);

  const armFallback = useCallback(
    taskId => {
      clearTimeout(fallbackTimers.current[taskId]);
      fallbackTimers.current[taskId] = setTimeout(() => {
        settle(taskId);
        if (Number(activeRef.current) === Number(taskId)) loadMessages(taskId, {silent: true});
      }, REPLY_FALLBACK_MS);
    },
    [loadMessages, settle],
  );

  const sendMessage = useCallback(
    async text => {
      const body = String(text || '').trim();
      if (!body || sending) return false;
      if (customerChat) {
        // Employees answer customers in CRM / Support; /ai only follows the AI here.
        showError('Responda o cliente pelo CRM ou Suporte.');
        return false;
      }
      // No AI for my company (or I'm in my ticket): the message goes to a ticket with the platform.
      const ticketMode = myTicket || (!activeTaskId && !provider);
      if (!ticketMode && !provider) {
        showError('Nenhuma IA configurada para a empresa. Configure em Configurador → IA.');
        return false;
      }
      setSending(true);
      setMessages(prev => [...prev, {id: `local-${Date.now()}`, body, status: 'pending'}]);
      try {
        const res = await api.post('/mcp/chat', {
          message: body,
          ...(ticketMode ? {type: ticketType} : {provider}),
          ...(activeTaskId ? {task_id: activeTaskId} : {}),
          ...(companyId ? {company_id: companyId} : {}),
        });
        const taskId = Number(res?.task_id || 0);
        if (taskId && res?.mode === 'ticket' && !res?.async) {
          // Humans of the platform answer later; no AI reply to wait for.
          if (taskId !== Number(activeTaskId)) setActiveTaskId(taskId);
          else loadMessages(taskId, {silent: true});
          scheduleTasksReload();
        } else if (taskId) {
          setPending(prev => ({...prev, [taskId]: prev[taskId] || 'pending'}));
          armFallback(taskId);
          if (taskId !== Number(activeTaskId)) setActiveTaskId(taskId);
          else loadMessages(taskId, {silent: true});
          scheduleTasksReload();
        }
        return true;
      } catch (e) {
        showError(e?.message || e?.error || 'Falha ao enviar mensagem');
        setMessages(prev => prev.filter(m => !String(m.id).startsWith('local-')));
        return false;
      } finally {
        setSending(false);
      }
    },
    [activeTaskId, armFallback, companyId, customerChat, loadMessages, myTicket, provider, scheduleTasksReload, sending, showError, ticketType],
  );

  const takeOver = useCallback(
    async type => {
      if (!activeTaskId) return;
      try {
        await api.post('/mcp/chat/handoff', {task_id: activeTaskId, type, ...(companyId ? {company_id: companyId} : {})});
        await Promise.all([loadTasks(), loadMessages(activeTaskId, {silent: true})]);
      } catch (e) {
        showError(e?.message || 'Falha ao transferir a conversa');
      }
    },
    [activeTaskId, companyId, loadMessages, loadTasks, showError],
  );

  return {
    companyId,
    currentPeopleId,
    providers,
    provider,
    setProvider,
    tasks,
    activeTask,
    activeTaskId,
    setActiveTaskId,
    customerChat,
    myTicket,
    hasAi: providers.length > 0,
    ticketType,
    setTicketType,
    messages,
    loadingList,
    loadingChat,
    sending,
    aiStatus: activeTaskId ? pending[activeTaskId] || null : null,
    sendMessage,
    takeOver,
    startNewChat: () => {
      setActiveTaskId(null);
      setMessages([]);
    },
  };
}
