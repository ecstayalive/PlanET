// One restrained palette and silhouette for the terminal and brand previews.
export const palette = [
  { tone: 'Teal', light: '#397d80', dark: '#81b4ae', ansi: 36, indexed: 109 },
  { tone: 'Sage', light: '#6e907f', dark: '#a4bba4', ansi: 32, indexed: 151 },
  { tone: 'Warm gold', light: '#a48b64', dark: '#d0b991', ansi: 33, indexed: 180 },
];

export function toneAt(position) {
  return Math.min(palette.length - 1, Math.floor(Math.max(0, position) * palette.length));
}

export const letters = [
  { letter: 'P',
    rows: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'] },
  { letter: 'l',
    rows: ['110', '010', '010', '010', '010', '010', '111'] },
  { letter: 'a',
    rows: ['00000', '00000', '01110', '00001', '01111', '10001', '01111'] },
  { letter: 'n',
    rows: ['00000', '00000', '10110', '11001', '10001', '10001', '10001'] },
  { letter: 'E',
    rows: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'] },
  { letter: 'T',
    rows: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'] },
];
