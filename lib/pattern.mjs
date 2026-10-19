// The Globriefly brand pattern: the globe mark repeated in a staggered grid.
// Used very faintly on photocards and on a few website sections.
// One source of truth, so the website tiles and the photocards always match.

export const TILE = 140;

// Two marks per tile, offset so the grid reads as staggered.
const MARKS = [
  { x: 34, y: 38 },
  { x: 100, y: 106 },
];

function mark(cx, cy, s = 1) {
  const r = 20 * s;
  return (
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke-width="${3 * s}"/>` +
    `<ellipse cx="${cx}" cy="${cy}" rx="${8 * s}" ry="${r}" fill="none" stroke-width="${2 * s}"/>` +
    `<rect x="${cx - 10 * s}" y="${cy - 4.5 * s}" width="${42 * s}" height="${9 * s}" rx="${2 * s}" stroke="none"/>`
  );
}

function marks(width, height, scale = 1) {
  const t = TILE * scale;
  let out = '';
  for (let ty = -t; ty < height + t; ty += t) {
    for (let tx = -t; tx < width + t; tx += t) {
      for (const m of MARKS) out += mark(tx + m.x * scale, ty + m.y * scale, scale);
    }
  }
  return out;
}

// A single repeating tile, for CSS background-image.
export function patternTile(color, opacity) {
  const body = MARKS.map((m) => mark(m.x, m.y)).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE}" height="${TILE}" viewBox="0 0 ${TILE} ${TILE}"><g stroke="${color}" fill="${color}" opacity="${opacity}">${body}</g></svg>`;
}

// A full-size pattern for a fixed area (used on photocards).
export function patternArea(width, height, color, opacity, scale = 1) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><g stroke="${color}" fill="${color}" opacity="${opacity}">${marks(width, height, scale)}</g></svg>`;
}
