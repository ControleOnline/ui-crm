const {test} = require('node:test');
const assert = require('node:assert/strict');

const {buildColumns, neighbourStatus, personName, timeAgo} = require('../../../../react/pages/tickets/ticketUtils');

const statuses = [
  {'@id': '/statuses/30', status: 'ganho', realStatus: 'closed'},
  {'@id': '/statuses/10', status: 'novo', realStatus: 'open'},
  {'@id': '/statuses/20', status: 'proposta', realStatus: 'pending'},
];
const tasks = [
  {id: 1, taskStatus: '/statuses/10'},
  {id: 2, taskStatus: {'@id': '/statuses/20'}},
  {id: 3, taskStatus: '/statuses/99'},
];
const triage = [
  {id: 7, type: 'ia', announce: '["5511999998888","conn:1"]'},
  {id: 8, type: 'ia', announce: '{"channel":"mcp"}'},
];

test('columns: triage first, open stages, closed last; tasks placed by status', () => {
  const columns = buildColumns(statuses, tasks, triage);
  assert.deepEqual(columns.map(c => c.title), ['Triagem IA', 'novo', 'proposta', 'ganho']);
  assert.deepEqual(columns[0].tasks.map(t => t.id), [7], 'internal /ai chats never show in triage');
  assert.deepEqual(columns[1].tasks.map(t => t.id), [1]);
  assert.deepEqual(columns[2].tasks.map(t => t.id), [2]);
});

test('neighbourStatus moves between stages only', () => {
  const columns = buildColumns(statuses, tasks, triage);
  assert.equal(neighbourStatus(columns, tasks[0], 1)['@id'], '/statuses/20');
  assert.equal(neighbourStatus(columns, tasks[0], -1), null);
  assert.equal(neighbourStatus(columns, triage[0], 1), null);
});

test('personName and timeAgo', () => {
  assert.equal(personName({name: 'Maria'}), 'Maria');
  assert.equal(personName('/people/1'), '');
  const now = new Date('2026-11-14T12:00:00Z').getTime();
  assert.equal(timeAgo('2026-11-14T11:30:00Z', now), '30 min');
  assert.equal(timeAgo('2026-11-14T02:00:00Z', now), '10 h');
  assert.equal(timeAgo('2026-11-10T12:00:00Z', now), '4 d');
});
