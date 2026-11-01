const {describe, it} = require('node:test');
const assert = require('node:assert/strict');

describe('mapsSectionHelpers', () => {
  it('parses coordinates and builds a static map URL', async () => {
    const mod = await import(
      '../../../../../react/pages/settings/sections/mapsSectionHelpers.js'
    );
    const {parseCoord, resolveAddressCoords, buildStaticMapUrl, PRIMARY_ENTRY_LABELS} =
      mod;

    assert.equal(parseCoord(''), null);
    assert.equal(parseCoord(undefined), null);
    assert.equal(parseCoord('0'), null);
    assert.equal(parseCoord('-23.5614'), -23.5614);

    assert.equal(resolveAddressCoords({latitude: 0, longitude: 0}), null);
    assert.deepEqual(resolveAddressCoords({latitude: -23.56, longitude: -46.65}), {
      lat: -23.56,
      lng: -46.65,
    });
    assert.deepEqual(resolveAddressCoords({lat: -10.1, lon: -20.2}), {
      lat: -10.1,
      lng: -20.2,
    });

    assert.equal(buildStaticMapUrl({apiKey: '', markers: [{lat: 1, lng: 2}]}), null);
    const url = buildStaticMapUrl({
      apiKey: 'abc',
      markers: [{lat: -23.56, lng: -46.65}],
    });
    assert.ok(String(url).includes('maps.googleapis.com'));
    assert.ok(String(url).includes('abc'));

    assert.equal(typeof PRIMARY_ENTRY_LABELS, 'object');
    assert.ok(Object.keys(PRIMARY_ENTRY_LABELS).length >= 2);
  });
});
