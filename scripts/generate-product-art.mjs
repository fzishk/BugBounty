// Generates flat SVG product illustrations into public/images/products.
// Run with: node scripts/generate-product-art.mjs
// Output is committed, so this only needs re-running when the art changes.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images', 'products');
mkdirSync(outDir, { recursive: true });

const PALETTES = [
  { bg: '#EEF2FF', main: '#6366F1', light: '#C7D2FE', accent: '#F59E0B', dark: '#312E81' },
  { bg: '#ECFDF5', main: '#10B981', light: '#A7F3D0', accent: '#F472B6', dark: '#065F46' },
  { bg: '#FFF7ED', main: '#F97316', light: '#FED7AA', accent: '#0EA5E9', dark: '#7C2D12' },
  { bg: '#F0F9FF', main: '#0EA5E9', light: '#BAE6FD', accent: '#84CC16', dark: '#0C4A6E' },
  { bg: '#FDF2F8', main: '#EC4899', light: '#FBCFE8', accent: '#FACC15', dark: '#831843' },
];

const frame = (p, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">` +
  `<rect width="400" height="400" fill="${p.bg}"/>` +
  `<circle cx="330" cy="70" r="46" fill="${p.light}" opacity=".6"/>` +
  `<circle cx="60" cy="340" r="30" fill="${p.light}" opacity=".5"/>` +
  `<ellipse cx="200" cy="318" rx="140" ry="14" fill="${p.dark}" opacity=".08"/>` +
  body +
  `</svg>`;

function keys(x, y, cols, rows, size, gap, p, accentEvery = 0) {
  let out = '';
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const accent = accentEvery && (r * cols + c) % accentEvery === 0;
      out += `<rect x="${x + c * (size + gap)}" y="${y + r * (size + gap)}" width="${size}" height="${size}" rx="4" fill="${accent ? p.accent : '#FFFFFF'}"/>`;
    }
  }
  return out;
}

const keyboards = [
  // 65% board
  (p) =>
    `<rect x="50" y="150" width="300" height="140" rx="16" fill="${p.dark}"/>` +
    keys(64, 164, 10, 4, 22, 6, p, 13) +
    `<rect x="120" y="268" width="150" height="12" rx="4" fill="#FFFFFF"/>` +
    `<path d="M200 150 C200 110 260 110 260 70" stroke="${p.dark}" stroke-width="6" fill="none"/>`,
  // 75% with function row
  (p) =>
    `<rect x="44" y="130" width="312" height="170" rx="16" fill="${p.main}"/>` +
    keys(58, 144, 11, 1, 20, 6, { ...p, accent: p.light }, 1) +
    keys(58, 176, 11, 4, 20, 6, p, 9) +
    `<rect x="110" y="280" width="170" height="10" rx="4" fill="#FFFFFF"/>`,
  // split ortho
  (p) =>
    `<rect x="40" y="160" width="145" height="130" rx="14" fill="${p.dark}" transform="rotate(-6 112 225)"/>` +
    `<rect x="215" y="160" width="145" height="130" rx="14" fill="${p.dark}" transform="rotate(6 288 225)"/>` +
    `<g transform="rotate(-6 112 225)">${keys(54, 174, 5, 4, 20, 6, p, 7)}</g>` +
    `<g transform="rotate(6 288 225)">${keys(229, 174, 5, 4, 20, 6, p, 6)}</g>`,
  // low profile wireless
  (p) =>
    `<rect x="40" y="190" width="320" height="90" rx="12" fill="${p.light}"/>` +
    keys(52, 200, 12, 3, 18, 7, { ...p, accent: p.main }, 11) +
    `<path d="M300 150 a20 20 0 0 1 28 0 M292 140 a32 32 0 0 1 44 0 M284 130 a44 44 0 0 1 60 0" stroke="${p.main}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
  // macro pad
  (p) =>
    `<rect x="110" y="120" width="180" height="180" rx="20" fill="${p.dark}"/>` +
    keys(132, 142, 3, 3, 40, 10, p, 4) +
    `<circle cx="268" cy="104" r="22" fill="${p.accent}"/><circle cx="268" cy="104" r="8" fill="${p.dark}"/>`,
];

function duck(p, body, accessory = '') {
  return (
    `<ellipse cx="200" cy="300" rx="120" ry="16" fill="${p.light}"/>` +
    `<path d="M95 230 Q95 300 200 300 Q300 300 300 240 Q300 200 250 205 L150 205 Q120 205 95 230 Z" fill="${body}"/>` +
    `<path d="M270 215 Q320 190 312 160 Q300 200 260 200 Z" fill="${body}"/>` +
    `<circle cx="170" cy="160" r="58" fill="${body}"/>` +
    `<path d="M112 160 Q78 168 74 180 Q96 192 124 180 Z" fill="#F97316"/>` +
    `<circle cx="160" cy="148" r="9" fill="#1F2937"/><circle cx="163" cy="145" r="3" fill="#FFFFFF"/>` +
    `<path d="M175 240 Q215 225 245 250 Q215 270 175 255 Z" fill="#000000" opacity=".1"/>` +
    accessory
  );
}

const ducks = [
  (p) => duck(p, '#FACC15'),
  (p) =>
    duck(
      p,
      '#22D3EE',
      `<rect x="120" y="132" width="90" height="26" rx="10" fill="${p.dark}"/><rect x="130" y="138" width="70" height="8" rx="4" fill="${p.accent}"/>`,
    ),
  (p) =>
    duck(
      p,
      '#D6A36B',
      `<rect x="250" y="235" width="44" height="50" rx="6" fill="#FFFFFF"/><path d="M294 245 q18 0 18 14 q0 14 -18 14" stroke="#FFFFFF" stroke-width="6" fill="none"/><path d="M262 225 q6 -10 0 -18 M278 225 q6 -10 0 -18" stroke="${p.dark}" stroke-width="3" fill="none"/>`,
    ),
  (p) =>
    duck(
      p,
      '#FDE68A',
      `<path d="M150 210 L190 210 L170 232 Z" fill="${p.main}"/><circle cx="170" cy="214" r="6" fill="${p.dark}"/>`,
    ),
  (p) =>
    duck(
      p,
      '#A78BFA',
      `<path d="M120 120 Q170 60 228 118 Q250 100 262 120 Q236 116 226 128 Z" fill="${p.dark}"/><circle cx="262" cy="120" r="9" fill="${p.accent}"/>`,
    ),
];

const coffee = [
  // bag of beans
  (p) =>
    `<path d="M130 110 L270 110 L292 300 L108 300 Z" fill="${p.dark}"/>` +
    `<rect x="130" y="96" width="140" height="22" rx="4" fill="${p.main}"/>` +
    `<rect x="140" y="170" width="120" height="90" rx="10" fill="#FFFFFF"/>` +
    `<ellipse cx="200" cy="215" rx="22" ry="30" fill="#7C4A21"/><path d="M200 188 Q188 215 200 242" stroke="#FFFFFF" stroke-width="4" fill="none"/>`,
  // espresso cup
  (p) =>
    `<ellipse cx="200" cy="290" rx="110" ry="18" fill="#FFFFFF"/>` +
    `<path d="M120 180 L280 180 L262 285 L138 285 Z" fill="${p.main}"/>` +
    `<path d="M280 200 q44 0 44 34 q0 34 -50 34" stroke="${p.main}" stroke-width="14" fill="none"/>` +
    `<ellipse cx="200" cy="180" rx="80" ry="14" fill="#5B341A"/>` +
    `<path d="M170 150 q14 -20 0 -40 M200 150 q14 -20 0 -40 M230 150 q14 -20 0 -40" stroke="${p.dark}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".5"/>`,
  // cold brew bottle
  (p) =>
    `<rect x="165" y="80" width="70" height="30" rx="6" fill="${p.dark}"/>` +
    `<path d="M160 110 L240 110 L250 150 L250 300 L150 300 L150 150 Z" fill="#3F2A1D"/>` +
    `<rect x="150" y="180" width="100" height="70" fill="${p.light}"/>` +
    `<path d="M175 215 l15 -20 l15 20 l15 -20 l10 13" stroke="${p.dark}" stroke-width="5" fill="none"/>` +
    `<rect x="262" y="230" width="34" height="34" rx="6" fill="#FFFFFF" opacity=".8"/><rect x="290" y="250" width="28" height="28" rx="6" fill="#FFFFFF" opacity=".8"/>`,
  // pour over
  (p) =>
    `<path d="M120 110 L280 110 L230 190 L170 190 Z" fill="${p.main}"/>` +
    `<rect x="160" y="190" width="80" height="12" fill="${p.dark}"/>` +
    `<path d="M150 210 L250 210 L262 300 L138 300 Z" fill="#FFFFFF" stroke="${p.dark}" stroke-width="4"/>` +
    `<path d="M144 260 L256 260 L262 300 L138 300 Z" fill="#5B341A"/>` +
    `<circle cx="200" cy="208" r="5" fill="#5B341A"/>`,
  // mug
  (p) =>
    `<rect x="120" y="140" width="140" height="160" rx="18" fill="${p.main}"/>` +
    `<path d="M260 170 q60 0 60 50 q0 50 -60 50" stroke="${p.main}" stroke-width="18" fill="none"/>` +
    `<text x="190" y="235" font-family="monospace" font-size="34" font-weight="700" fill="#FFFFFF" text-anchor="middle">{ }</text>` +
    `<path d="M160 120 q14 -20 0 -40 M200 120 q14 -20 0 -40" stroke="${p.dark}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".5"/>`,
];

function sticker(p, shape, label, labelSize = 30) {
  return (
    shape +
    `<text x="200" y="${215 + labelSize / 3}" font-family="monospace" font-size="${labelSize}" font-weight="700" fill="#FFFFFF" text-anchor="middle">${label}</text>` +
    `<path d="M300 280 L300 240 Q300 280 260 280 Z" fill="#FFFFFF" opacity=".85"/>`
  );
}

const stickers = [
  (p) =>
    sticker(
      p,
      `<rect x="70" y="120" width="260" height="190" rx="28" fill="${p.main}" stroke="#FFFFFF" stroke-width="10"/>`,
      'WORKS ON MY<tspan x="200" dy="36">MACHINE</tspan>',
      26,
    ),
  (p) =>
    sticker(
      p,
      `<circle cx="200" cy="215" r="110" fill="${p.dark}" stroke="#FFFFFF" stroke-width="10"/>`,
      '"strict"',
      36,
    ),
  (p) =>
    sticker(
      p,
      `<path d="M200 95 L320 165 L320 265 L200 335 L80 265 L80 165 Z" fill="${p.main}" stroke="#FFFFFF" stroke-width="10"/>`,
      'no any',
      40,
    ),
  (p) =>
    sticker(
      p,
      `<rect x="60" y="150" width="280" height="130" rx="65" fill="#DC2626" stroke="#FFFFFF" stroke-width="10"/>`,
      'push -f',
      38,
    ),
  (p) =>
    `<circle cx="200" cy="210" r="115" fill="${p.main}" stroke="#FFFFFF" stroke-width="10"/>` +
    `<circle cx="185" cy="190" r="40" fill="#FACC15"/><ellipse cx="210" cy="250" rx="60" ry="34" fill="#FACC15"/>` +
    `<path d="M148 192 L122 198 L148 206 Z" fill="#F97316"/><circle cx="176" cy="182" r="6" fill="#1F2937"/>`,
];

const ART = { keyboards, ducks, coffee, stickers };

let count = 0;
for (const [category, drawers] of Object.entries(ART)) {
  drawers.forEach((draw, index) => {
    const palette = PALETTES[index % PALETTES.length];
    const file = join(outDir, `${category}-${index + 1}.svg`);
    writeFileSync(file, frame(palette, draw(palette)) + '\n');
    count += 1;
  });
}
console.log(`Wrote ${count} illustrations to ${outDir}`);
