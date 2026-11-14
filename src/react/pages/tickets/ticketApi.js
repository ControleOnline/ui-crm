/*
 * @agents API calls shared by funnels and ticket screens.
 */
import {api} from '@controleonline/ui-common/src/api';

const {idOf} = require('../mcp/mcpChatUtils');

export const toItems = res => {
  const items = res?.member || res?.['hydra:member'] || res || [];
  return Array.isArray(items) ? items : [];
};

export const fetchStatuses = async type => toItems(await api.fetch('/statuses', {params: {context: type, itemsPerPage: 100}}));

export const fetchTickets = async (type, companyId) =>
  toItems(await api.fetch('/tasks', {params: {type, provider: `/people/${companyId}`, 'order[alterDate]': 'desc', itemsPerPage: 300}}));

// Customer conversations the AI is still triaging (internal /ai chats are filtered out by the caller).
export const fetchTriage = async companyId =>
  toItems(await api.fetch('/tasks', {params: {type: 'ia', provider: `/people/${companyId}`, 'exists[aiAgent]': true, itemsPerPage: 100}}));

export const fetchTicket = taskId => api.fetch(`/tasks/${taskId}`);

export const fetchTicketMessages = async taskId =>
  toItems(await api.fetch('/task_interations', {params: {'task.id': taskId, type: 'comment', 'order[id]': 'asc', itemsPerPage: 300}}));

export const moveTicket = (task, status) =>
  api.put(`/tasks/${idOf(task)}`, {taskStatus: status?.['@id'] || `/statuses/${idOf(status)}`});

/** public = goes to the customer through the ticket's connection; private = internal note. */
export const postTicketMessage = (taskId, body, visibility) =>
  api.post('/task_interations', {task: `/tasks/${taskId}`, body, type: 'comment', visibility});

export const assignAi = (taskId, companyId, instructions) =>
  api.post('/mcp/chat/assign', {task_id: taskId, company_id: companyId, instructions});

export const takeOverTicket = (taskId, companyId, type) =>
  api.post('/mcp/chat/handoff', {task_id: taskId, company_id: companyId, type});
