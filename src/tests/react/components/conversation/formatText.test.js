const {test} = require('node:test');
const assert = require('node:assert/strict');

const {parseRichText, dayLabel, initialsOf} = require('../../../../react/components/conversation/formatText');

test('parseRichText keeps plain text and splits lines', () => {
  assert.deepEqual(parseRichText('oi\ntudo bem?'), [[{text: 'oi'}], [{text: 'tudo bem?'}]]);
});

test('parseRichText renders WhatsApp/markdown emphasis instead of raw markers', () => {
  const [line] = parseRichText('A empresa teve **0** pedidos e _nenhum_ `erro` ~antigo~');
  assert.deepEqual(line, [
    {text: 'A empresa teve '},
    {bold: true, text: '0'},
    {text: ' pedidos e '},
    {italic: true, text: 'nenhum'},
    {text: ' '},
    {code: true, text: 'erro'},
    {text: ' '},
    {strike: true, text: 'antigo'},
  ]);
});

test('parseRichText turns bullets and links into parts', () => {
  const [line] = parseRichText('- veja https://www.controleonline.com/ajuda.');
  assert.deepEqual(line, [{text: '• '}, {text: 'veja '}, {link: 'https://www.controleonline.com/ajuda', text: 'https://www.controleonline.com/ajuda'}, {text: '.'}]);
});

test('dayLabel says Hoje / Ontem / date', () => {
  const now = new Date(2026, 10, 17, 12);
  assert.equal(dayLabel(new Date(2026, 10, 17, 8), now), 'Hoje');
  assert.equal(dayLabel(new Date(2026, 10, 16, 23), now), 'Ontem');
  assert.equal(dayLabel(new Date(2026, 10, 1), now), new Date(2026, 10, 1).toLocaleDateString('pt-BR'));
  assert.equal(dayLabel('invalid', now), '');
});

test('initialsOf uses up to two words', () => {
  assert.equal(initialsOf('Luiz Kim Dias'), 'LK');
  assert.equal(initialsOf(''), '?');
});
