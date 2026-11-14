/*
 * @agents Pure helpers for CRM / Support funnels and ticket screens.
 * Covered by src/tests/react/pages/tickets/ticketUtils.test.js.
 */
const {idOf, isCustomerConversation} = require('../mcp/mcpChatUtils');

const TRIAGE_COLUMN = 'triage';

const TICKET_TYPES = {
  relationship: {title: 'Funil comercial', label: 'Comercial', empty: 'Nenhuma oportunidade.'},
  support: {title: 'Suporte', label: 'Suporte', empty: 'Nenhum chamado.'},
};

const statusOrder = status => {
  const real = String(status?.realStatus || '').toLowerCase();
  const rank = {open: 0, pending: 1, closed: 2, canceled: 3};
  return [rank[real] ?? 1, idOf(status) || 0];
};

/**
 * Columns: "Triagem IA" (customer conversations still unclassified) + one per status of the context,
 * open stages first and closed/canceled last.
 */
const buildColumns = (statuses, tasks, triage = []) => {
  const sorted = [...(statuses || [])].sort((a, b) => {
    const [ra, ia] = statusOrder(a);
    const [rb, ib] = statusOrder(b);
    return ra - rb || ia - ib;
  });
  const columns = [
    {key: TRIAGE_COLUMN, title: 'Triagem IA', color: '#7c3aed', status: null, tasks: (triage || []).filter(isCustomerConversation)},
  ];
  sorted.forEach(status => {
    columns.push({
      key: String(idOf(status)),
      title: status.status || status.name || `#${idOf(status)}`,
      color: status.color || '#1d9bf0',
      status,
      tasks: [],
    });
  });
  const byStatus = new Map(columns.map(c => [c.key, c]));
  (tasks || []).forEach(task => {
    const column = byStatus.get(String(idOf(task.taskStatus)));
    if (column && column.key !== TRIAGE_COLUMN) column.tasks.push(task);
  });
  return columns;
};

/** Neighbour status column for the arrow buttons (never into/out of triage). */
const neighbourStatus = (columns, task, step) => {
  const stages = columns.filter(c => c.status);
  const index = stages.findIndex(c => c.key === String(idOf(task?.taskStatus)));
  if (index < 0) return null;
  return stages[index + step]?.status || null;
};

const personName = people => {
  if (!people) return '';
  if (typeof people === 'string') return '';
  return people.name || people.alias || '';
};

const timeAgo = (value, now = Date.now()) => {
  const t = new Date(value || 0).getTime();
  if (!t) return '';
  const minutes = Math.max(0, Math.round((now - t) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h`;
  return `${Math.round(hours / 24)} d`;
};

module.exports = {
  TRIAGE_COLUMN,
  TICKET_TYPES,
  buildColumns,
  neighbourStatus,
  personName,
  timeAgo,
};
