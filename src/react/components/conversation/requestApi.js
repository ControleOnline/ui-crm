/*
 * @agents API of requests (relationship/support) shared by the customer screen (/support), the analyst screen (/ai) and CRM.
 */
import {api} from '@controleonline/ui-common/src/api';

const {idOf} = require('../../pages/mcp/mcpChatUtils');

export const REQUEST_TYPES = [
  {value: 'support', label: 'Suporte', hint: 'Dúvidas, problemas ou erros no sistema'},
  {value: 'relationship', label: 'Comercial', hint: 'Planos, contratação, propostas e financeiro'},
];
export const typeLabel = type => REQUEST_TYPES.find(t => t.value === type)?.label || type || '';

export const toItems = res => {
  const items = res?.member || res?.['hydra:member'] || res || [];
  return Array.isArray(items) ? items : [];
};

export const personName = p => (p && typeof p === 'object' ? p.alias || p.name || '' : '');

/** Status names of both contexts, open first (filter of the requests list). */
export const fetchRequestStatuses = async () => {
  const lists = await Promise.all(REQUEST_TYPES.map(t => api.fetch('/statuses', {params: {context: t.value, itemsPerPage: 100}}).then(toItems).catch(() => [])));
  const rank = {open: 0, pending: 1, closed: 2, canceled: 3};
  const byName = new Map();
  lists.flat().forEach(s => {
    if (s?.status && !byName.has(s.status)) byName.set(s.status, s);
  });
  return [...byName.values()].sort((a, b) => (rank[a.realStatus] ?? 1) - (rank[b.realStatus] ?? 1));
};

export const fetchStatuses = async type => toItems(await api.fetch('/statuses', {params: {context: type, itemsPerPage: 100}}));
export const fetchCategories = async (type, companyId) =>
  toItems(await api.fetch('/categories', {params: {context: type, ...(companyId ? {company: `/people/${companyId}`} : {}), itemsPerPage: 200}}));

export const fetchMyRequests = async (peopleId, statusName) =>
  toItems(
    await api.fetch('/tasks', {
      params: {
        client: `/people/${peopleId}`,
        type: REQUEST_TYPES.map(t => t.value),
        ...(statusName ? {'taskStatus.status': statusName} : {}),
        'order[alterDate]': 'desc',
        itemsPerPage: 100,
      },
    }),
  );

export const fetchTask = taskId => api.fetch(`/tasks/${taskId}`);

export const fetchMessages = async taskId =>
  toItems(await api.fetch('/task_interations', {params: {'task.id': taskId, type: 'comment', 'order[id]': 'asc', itemsPerPage: 500}}));

/** Customer side: opens (type) or continues (taskId) a request through /mcp/chat. */
export const sendRequestMessage = ({taskId, type, text, fileId, companyId}) =>
  api.post('/mcp/chat', {
    ...(taskId ? {task_id: taskId} : {type}),
    message: text || '',
    ...(fileId ? {file_id: fileId} : {}),
    ...(companyId ? {company_id: companyId} : {}),
  });

/** Company side: public reply (goes to the customer) or internal note. */
export const postInteraction = (taskId, {text, fileId, visibility}) =>
  api.post('/task_interations', {
    task: `/tasks/${taskId}`,
    // Plain text label: the API column is not utf8mb4 (no emoji).
    body: text || (fileId ? 'Anexo' : ''),
    type: 'comment',
    visibility,
    ...(fileId ? {file: `/files/${fileId}`} : {}),
  });

export const updateTask = (task, patch) => api.put(`/tasks/${idOf(task)}`, patch);

export const fetchResponders = (type, companyId) => api.fetch('/tickets/responders', {params: {type, company_id: companyId}});

export const fetchCompanyAis = async companyId => {
  try {
    const res = await api.fetch('/mcp/chat/providers', {params: {company_id: companyId}});
    return Array.isArray(res?.providers) ? res.providers : [];
  } catch (e) {
    return [];
  }
};

export const assignAi = (taskId, companyId, instructions) => api.post('/mcp/chat/assign', {task_id: taskId, company_id: companyId, instructions});
export const takeOver = (taskId, companyId, type) => api.post('/mcp/chat/handoff', {task_id: taskId, company_id: companyId, type});

export const fetchTicketSettings = companyId => api.fetch('/tickets/settings', {params: {company_id: companyId}});
export const saveTicketSettings = (companyId, settings) => api.put('/tickets/settings', {company_id: companyId, ...settings});
