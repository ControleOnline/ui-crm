/*
 * @agents Pure helpers for the /ai chat (no React). Covered by src/tests/react/pages/mcp/mcpChatUtils.test.js.
 */
const CHAT_EVENTS = ['mcp_chat_reply', 'conversation_message'];

const STAGE_LABELS = {
  ia: 'IA',
  relationship: 'Comercial',
  support: 'Suporte',
};

const idOf = entity => {
  if (entity === null || entity === undefined) return null;
  if (typeof entity === 'number') return entity;
  if (typeof entity === 'string') {
    const tail = entity.split('/').pop();
    return /^\d+$/.test(tail) ? Number(tail) : null;
  }
  if (entity.id !== undefined && entity.id !== null) return Number(entity.id);
  return idOf(entity['@id']);
};

const parseAnnounce = task => {
  const raw = task?.announce;
  if (Array.isArray(raw) || (raw && typeof raw === 'object')) return raw;
  try {
    return JSON.parse(raw || '{}') || {};
  } catch (e) {
    return {};
  }
};

// Internal chat of an employee: type ia with announce {"channel":"mcp"}. Everything else is a customer conversation.
const isInternalChat = task => {
  const announce = parseAnnounce(task);
  return task?.type === 'ia' && !Array.isArray(announce) && announce?.channel === 'mcp';
};
const isCustomerConversation = task => Boolean(task) && !isInternalChat(task);

// Channel of a customer conversation from its destinations (phone -> WhatsApp, address -> e-mail).
const conversationChannel = task => {
  if (!isCustomerConversation(task)) return 'ai';
  const announce = parseAnnounce(task);
  const list = Array.isArray(announce) ? announce.map(String) : [];
  if (list.some(v => /^\d{10,15}$/.test(v))) return 'whatsapp';
  if (list.some(v => /@/.test(v))) return 'email';
  return 'web';
};

const customerPhone = task => {
  const announce = parseAnnounce(task);
  if (!Array.isArray(announce)) return '';
  return announce.find(v => /^\d{10,}$/.test(String(v))) || '';
};

const stageLabel = task => STAGE_LABELS[task?.type] || task?.type || '';

/**
 * Websocket store keeps appending; consume only what arrived after `fromIndex`.
 * Items can be single events or arrays of events.
 */
const extractChatEvents = (messages, fromIndex = 0) => {
  const list = Array.isArray(messages) ? messages : [];
  const start = fromIndex > list.length ? 0 : fromIndex; // store was reset
  const events = [];
  list.slice(start).forEach(item => {
    (Array.isArray(item) ? item : [item]).forEach(evt => {
      if (evt && typeof evt === 'object' && CHAT_EVENTS.includes(String(evt.event || ''))) {
        events.push(evt);
      }
    });
  });
  return {events, nextIndex: list.length};
};

/**
 * Internal chats are private to their author; customer conversations are shared by the team.
 */
const mergeConversations = (lists, currentPeopleId) => {
  const byId = new Map();
  lists.flat().forEach(task => {
    const id = idOf(task);
    if (!id || byId.has(id)) return;
    const mine = currentPeopleId && idOf(task.registeredBy) === Number(currentPeopleId);
    if (!isCustomerConversation(task) && currentPeopleId && !mine) return;
    byId.set(id, task);
  });
  const time = t => new Date(t?.alterDate || t?.createdAt || 0).getTime() || 0;
  return [...byId.values()].sort((a, b) => time(b) - time(a) || idOf(b) - idOf(a));
};

/**
 * Bubble side/role. ai = the company (AI replies), note = private attendant note on a
 * customer conversation, customer = the WhatsApp contact, me/staff = people of the company.
 */
const messageRole = (item, {companyId, task, currentPeopleId}) => {
  const by = idOf(item?.registeredBy);
  const customerChat = isCustomerConversation(task);
  if (by && companyId && by === Number(companyId)) {
    return customerChat && item?.visibility === 'private' ? 'note' : 'ai';
  }
  if (customerChat) {
    // In my own ticket (I am the client) my messages are mine.
    if (by && currentPeopleId && by === Number(currentPeopleId)) return 'me';
    return by && by === idOf(task?.client) ? 'customer' : 'staff';
  }
  if (!by && String(item?.id || '').startsWith('local-')) return 'me';
  return by && currentPeopleId && by !== Number(currentPeopleId) ? 'staff' : 'me';
};

module.exports = {
  isInternalChat,
  conversationChannel,
  STAGE_LABELS,
  idOf,
  parseAnnounce,
  isCustomerConversation,
  customerPhone,
  stageLabel,
  extractChatEvents,
  mergeConversations,
  messageRole,
};
