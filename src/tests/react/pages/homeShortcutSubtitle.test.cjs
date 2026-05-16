const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const homePath = path.join(__dirname, '../../../react/pages/home/index.js');
const stylesPath = path.join(__dirname, '../../../react/pages/home/index.styles.js');

const homeSource = fs.readFileSync(homePath, 'utf8');
const stylesSource = fs.readFileSync(stylesPath, 'utf8');

test('prospects shortcut subtitle uses the compact subtitle style', () => {
  assert.match(
    homeSource,
    /styles\.shortcutSubCompact\]\}>\s*\{global\.t\?\.t\('people', 'title', 'viewProspects'\)\}/,
  );
});

test('commissions shortcut subtitle uses the compact subtitle style', () => {
  assert.match(
    homeSource,
    /styles\.shortcutSubCompact\]\}>\s*\{global\.t\?\.t\('people', 'title', 'financialReport'\)\}/,
  );
});

test('compact subtitle style keeps the subtitle smaller and centered', () => {
  assert.match(stylesSource, /shortcutSubCompact:\s*\{[\s\S]*fontSize:\s*10/);
  assert.match(stylesSource, /shortcutSubCompact:\s*\{[\s\S]*lineHeight:\s*13/);
  assert.match(stylesSource, /shortcutSubCompact:\s*\{[\s\S]*textAlign:\s*'center'/);
});
