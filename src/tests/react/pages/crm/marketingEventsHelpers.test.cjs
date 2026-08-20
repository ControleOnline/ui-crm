const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const sourcePath = path.join(
  __dirname,
  '../../../../react/pages/crm/marketingEventsHelpers.js',
);
const source = fs.readFileSync(sourcePath, 'utf8');
const transformed = source
  .replace(/export const /g, 'const ')
  .concat(
    '\n;module.exports = { EVENT_LABELS, normalizePeopleIri, extractCollection, buildUtmSummary };',
  );
const mod = {exports: {}};
vm.runInNewContext(transformed, {module: mod, exports: mod.exports});
const {
  normalizePeopleIri,
  extractCollection,
  buildUtmSummary,
  EVENT_LABELS,
} = mod.exports;

test('normalizePeopleIri accepts id, iri and object', () => {
  assert.equal(normalizePeopleIri(42), '/people/42');
  assert.equal(normalizePeopleIri('/people/7'), '/people/7');
  assert.equal(normalizePeopleIri('/peoples/7'), '/people/7');
  assert.equal(normalizePeopleIri({id: 9}), '/people/9');
  assert.equal(normalizePeopleIri({'@id': '/people/3'}), '/people/3');
  assert.equal(normalizePeopleIri(null), '');
});

test('extractCollection supports hydra and plain arrays', () => {
  assert.equal(extractCollection([{id: 1}])[0].id, 1);
  assert.equal(extractCollection({'hydra:member': [{id: 2}]})[0].id, 2);
  assert.equal(extractCollection({member: [{id: 3}]})[0].id, 3);
  assert.equal(extractCollection(null).length, 0);
});

test('buildUtmSummary joins present UTM fields', () => {
  assert.equal(buildUtmSummary({}), null);
  assert.equal(
    buildUtmSummary({utmSource: 'google', utmCampaign: 'spring'}),
    'src=google · cmp=spring',
  );
});

test('EVENT_LABELS covers allowlist', () => {
  assert.ok(EVENT_LABELS.page_view);
  assert.ok(EVENT_LABELS.lead_created);
});
