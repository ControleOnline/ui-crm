const {test} = require('node:test');
const assert = require('node:assert/strict');

const {
  idOf,
  isCustomerConversation,
  customerPhone,
  extractChatEvents,
  mergeConversations,
  messageRole,
  stageLabel,
  conversationChannel,
} = require('../../../../react/pages/mcp/mcpChatUtils');

const webTask = {id: 1, type: 'ia', announce: '{"channel":"mcp","ai_provider":"claude"}', registeredBy: '/people/10', alterDate: '2026-11-14T10:00:00'};
const otherUserTask = {id: 2, type: 'ia', announce: '{"channel":"mcp"}', registeredBy: '/people/11', alterDate: '2026-11-14T12:00:00'};
const whatsTask = {id: 3, type: 'relationship', announce: '["5511999998888","conn:4"]', client: '/people/50', registeredBy: '/people/50', alterDate: '2026-11-14T11:00:00'};

test('idOf reads numbers, IRIs and entities', () => {
  assert.equal(idOf('/people/42'), 42);
  assert.equal(idOf({'@id': '/tasks/7'}), 7);
  assert.equal(idOf({id: '9'}), 9);
  assert.equal(idOf(null), null);
});

test('internal chats vs customer conversations and their channel', () => {
  assert.equal(conversationChannel(webTask), 'ai');
  assert.equal(conversationChannel(whatsTask), 'whatsapp');
  assert.equal(conversationChannel({type: 'support', announce: '["ana@x.com","conn:9"]'}), 'email');
  assert.equal(isCustomerConversation(webTask), false);
  assert.equal(isCustomerConversation(whatsTask), true);
  assert.equal(customerPhone(whatsTask), '5511999998888');
  assert.equal(stageLabel(whatsTask), 'Comercial');
});

test('extractChatEvents only returns new chat events and flattens batches', () => {
  const store = [
    {event: 'order_update'},
    [{event: 'mcp_chat_reply', task_id: 1, status: 'processing'}, {event: 'mcp_chat_reply', task_id: 1, status: 'done'}],
  ];
  const first = extractChatEvents(store, 0);
  assert.deepEqual(first.events.map(e => e.status), ['processing', 'done']);
  assert.equal(first.nextIndex, 2);

  store.push({event: 'conversation_message', task_id: 3});
  const second = extractChatEvents(store, first.nextIndex);
  assert.deepEqual(second.events.map(e => e.task_id), [3]);

  // store reset (shorter than our cursor) is re-read from the start
  assert.equal(extractChatEvents([{event: 'mcp_chat_reply'}], 5).events.length, 1);
});

test('mergeConversations hides other people internal chats, keeps customer ones, sorts by activity', () => {
  const merged = mergeConversations([[webTask, otherUserTask], [whatsTask, webTask]], 10);
  assert.deepEqual(merged.map(t => t.id), [3, 1]);
});

test('messageRole distinguishes ai, notes, customer and staff', () => {
  const ctx = {companyId: 99, task: whatsTask, currentPeopleId: 10};
  assert.equal(messageRole({registeredBy: '/people/99', visibility: 'public'}, ctx), 'ai');
  assert.equal(messageRole({registeredBy: '/people/99', visibility: 'private'}, ctx), 'note');
  assert.equal(messageRole({registeredBy: '/people/50'}, ctx), 'customer');
  assert.equal(messageRole({registeredBy: '/people/10'}, ctx), 'staff');

  const webCtx = {companyId: 99, task: webTask, currentPeopleId: 10};
  assert.equal(messageRole({registeredBy: '/people/99', visibility: 'private'}, webCtx), 'ai');
  assert.equal(messageRole({registeredBy: '/people/10'}, webCtx), 'me');
  assert.equal(messageRole({id: 'local-1'}, webCtx), 'me');
});
