// Writes the pattern tiles used by the website into public/patterns/.
// Run after changing lib/pattern.mjs:  node scripts/build-patterns.mjs
import fs from 'node:fs';
import path from 'node:path';
import { patternTile } from '../lib/pattern.mjs';

const out = path.join(process.cwd(), 'public', 'patterns');
fs.mkdirSync(out, { recursive: true });
const tiles = {
  'pattern-light.svg': patternTile('#0E1116', 0.045), // on white / mist sections
  'pattern-dark.svg': patternTile('#FFFFFF', 0.06), // on ink sections (footer, dark bands)
  'pattern-color.svg': patternTile('#FFFFFF', 0.1), // on coloured sections (newsletter, photocards)
  'pattern-red.svg': patternTile('#C8102E', 0.06), // on the light red "live" band
};
for (const [name, svg] of Object.entries(tiles)) fs.writeFileSync(path.join(out, name), svg);
console.log('patterns written to public/patterns/');
