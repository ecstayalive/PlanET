import { parseArgs } from 'node:util';
import { letters, palette, toneAt } from '../assets/brand.mjs';

const { values } = parseArgs({ options: {
  banner: { type: 'boolean' },
  color: { type: 'boolean' },
  'no-color': { type: 'boolean' },
} });
const color = !values['no-color'] && process.env.NO_COLOR === undefined &&
  process.env.TERM !== 'dumb' && (values.color || process.stdout.isTTY);
const reset = color ? '\x1b[0m' : '';
const trueColor = /^(truecolor|24bit)$/i.test(process.env.COLORTERM ?? '');
const indexedColor = /256color/.test(process.env.TERM ?? '');
const width = (letters.reduce((sum, glyph) => sum + glyph.rows[0].length + 1, 0) - 1) * 2;

// Background-colored spaces form solid tiles without depending on block glyphs.
const banner = values.banner && process.env.TERM !== 'dumb' &&
  (!process.stdout.isTTY || process.stdout.columns >= width);
const styles = palette.map(tone => {
  if (!color) return '';
  if (trueColor) {
    const rgb = tone.dark.slice(1).match(/../g).map(hex => parseInt(hex, 16));
    return `\x1b[${banner ? 48 : 38};2;${rgb.join(';')}m`;
  }
  if (indexedColor) return `\x1b[${banner ? 48 : 38};5;${tone.indexed}m`;
  return `\x1b[${tone.ansi + (banner ? 10 : 0)}m`;
});

if (banner) {
  for (let row = 0; row < letters[0].rows.length; row++) {
    let column = 0;
    console.log(letters.map(glyph => {
      const tiles = [...glyph.rows[row]].map(cell => {
        const tone = toneAt((column++ / (width / 2 - 1) + row / 6) / 2);
        return cell === '1' ? `${styles[tone]}${color ? '  ' : '██'}${reset}` : '  ';
      }).join('');
      column++;
      return tiles;
    }).join('  '));
  }
} else {
  console.log(letters.map((glyph, index) =>
    `${styles[toneAt(index / (letters.length - 1))]}${glyph.letter}${reset}`
  ).join(''));
}
