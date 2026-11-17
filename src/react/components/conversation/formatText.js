/*
 * @agents Pure parser for message text: **bold** / *bold*, _italic_, `code`, ~strike~, links and
 * "- " / "* " bullets. Tested in src/tests/react/components/conversation/formatText.test.js.
 */
const TOKEN = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|_[^_\n]+_|`[^`\n]+`|~[^~\n]+~|https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/g;

const styleOf = token => {
  if (token.startsWith('**')) return {bold: true, text: token.slice(2, -2)};
  if (token.startsWith('*')) return {bold: true, text: token.slice(1, -1)};
  if (token.startsWith('_')) return {italic: true, text: token.slice(1, -1)};
  if (token.startsWith('`')) return {code: true, text: token.slice(1, -1)};
  if (token.startsWith('~')) return {strike: true, text: token.slice(1, -1)};
  return {link: token, text: token};
};

/** @returns {Array<Array<{text: string, bold?: boolean, italic?: boolean, code?: boolean, strike?: boolean, link?: string}>>} one array per line */
const parseRichText = value =>
  String(value ?? '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => {
      const bullet = /^\s*[-*]\s+/.test(line);
      const body = bullet ? line.replace(/^\s*[-*]\s+/, '') : line;
      const parts = bullet ? [{text: '• '}] : [];
      let last = 0;
      body.replace(TOKEN, (match, _g, offset) => {
        if (offset > last) parts.push({text: body.slice(last, offset)});
        parts.push(styleOf(match));
        last = offset + match.length;
        return match;
      });
      if (last < body.length) parts.push({text: body.slice(last)});
      return parts;
    });

/** Day separator label: Hoje, Ontem or dd/mm/yyyy. */
const dayLabel = (date, now = new Date()) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const start = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(now) - start(d)) / 86400000);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Ontem';
  return d.toLocaleDateString('pt-BR');
};

const timeLabel = date => {
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
};

const initialsOf = name =>
  String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0] || '')
    .join('')
    .toUpperCase() || '?';

module.exports = {parseRichText, dayLabel, timeLabel, initialsOf};
