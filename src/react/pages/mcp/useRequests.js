/*
 * @agents State of the requests screen (/support, app-community#1592–#1595): the user's relationship/support
 * requests filtered by status (default "open"), the selected one with its conversation, and the
 * draft type of a new request. Live through websocket events (useRealtimeReload).
 */
import {useCallback, useEffect, useState} from 'react';
import {useStore} from '@store';
import useRealtimeReload from '../tickets/useRealtimeReload';
import {fetchMessages, fetchMyRequests, fetchRequestStatuses, fetchTask, sendRequestMessage} from '../../components/conversation/requestApi';

const {idOf} = require('./mcpChatUtils');

export default function useRequests({onError}) {
  const peopleStore = useStore('people');
  const authStore = useStore('auth');
  const company = peopleStore?.getters?.currentCompany || peopleStore?.getters?.mainCompany;
  const companyId = idOf(company);
  const meId = idOf(authStore?.getters?.user?.people);

  const [statuses, setStatuses] = useState([]);
  const [statusFilter, setStatusFilter] = useState('open');
  const [requests, setRequests] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [draftType, setDraftType] = useState(null);
  const [task, setTask] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);

  // Loaded once the session is ready (a first call before login returned nothing and never retried).
  useEffect(() => {
    if (!meId) return;
    fetchRequestStatuses().then(setStatuses).catch(() => setStatuses([]));
  }, [meId, companyId]);

  const loadList = useCallback(async () => {
    if (!meId) return;
    try {
      setRequests(await fetchMyRequests(meId, statusFilter));
    } catch (e) {
      onError?.(e?.message || 'Não foi possível carregar as solicitações');
    } finally {
      setLoadingList(false);
    }
  }, [meId, statusFilter, onError]);

  const loadChat = useCallback(
    async (id = activeId, {quiet = false} = {}) => {
      if (!id) return;
      if (!quiet) setLoadingChat(true);
      try {
        const [t, m] = await Promise.all([fetchTask(id), fetchMessages(id)]);
        setTask(t);
        setMessages(m);
      } catch (e) {
        onError?.(e?.message || 'Não foi possível carregar a conversa');
      } finally {
        setLoadingChat(false);
      }
    },
    [activeId, onError],
  );

  useEffect(() => {
    setLoadingList(true);
    loadList();
  }, [loadList]);

  useEffect(() => {
    setTask(null);
    setMessages([]);
    if (activeId) loadChat(activeId);
  }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  useRealtimeReload(
    events => {
      loadList();
      if (activeId && events.some(e => Number(e.task_id) === Number(activeId))) loadChat(activeId, {quiet: true});
    },
    {delay: 300},
  );

  const open = id => {
    setDraftType(null);
    setActiveId(id);
  };

  const startNew = type => {
    setActiveId(null);
    setTask(null);
    setMessages([]);
    setDraftType(type);
  };

  /** Opens the draft request on the first message, otherwise continues the selected one. */
  const send = async ({text, fileId}) => {
    const res = await sendRequestMessage({taskId: activeId, type: draftType, text, fileId, companyId});
    const id = Number(res?.task_id || activeId);
    if (!activeId && id) {
      setDraftType(null);
      setActiveId(id);
      // A new request is "open": show it in the list when the filter hides it.
      if (statusFilter !== 'open') setStatusFilter('open');
      else loadList();
    } else {
      await loadChat(id, {quiet: true});
      loadList();
    }
    return true;
  };

  return {
    companyId,
    meId,
    statuses,
    statusFilter,
    setStatusFilter,
    requests,
    loadingList,
    activeId,
    open,
    draftType,
    startNew,
    task,
    messages,
    loadingChat,
    send,
  };
}
