import type { Direction, Expedition, FieldSite } from "./schema";
export type Point = { x: number; y: number };
export const vectors: Record<Direction, Point> = {
  north: { x: 0, y: -1 },
  east: { x: 1, y: 0 },
  south: { x: 0, y: 1 },
  west: { x: -1, y: 0 },
};
export const cellKey = (p: Point) => `${p.x},${p.y}`;
export const distance = (a: Point, b: Point) =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
export function passable(site: FieldSite, e: Expedition, p: Point) {
  return (
    site.grid[p.y]?.[p.x] === "." &&
    !site.objects.some(
      (o) =>
        o.kind === "door" &&
        distance(o.position, p) === 0 &&
        !e.openDoors.includes(o.id),
    )
  );
}
export function lineVisible(
  site: FieldSite,
  e: Expedition,
  a: Point,
  b: Point,
) {
  let x = a.x,
    y = a.y;
  const dx = Math.abs(b.x - x),
    dy = Math.abs(b.y - y),
    sx = x < b.x ? 1 : -1,
    sy = y < b.y ? 1 : -1;
  let err = dx - dy;
  for (let n = 0; n < 70; n++) {
    if (x === b.x && y === b.y) return true;
    const d = err * 2;
    if (d > -dy) {
      err -= dy;
      x += sx;
    }
    if (d < dx) {
      err += dx;
      y += sy;
    }
    if (x === b.x && y === b.y) return true;
    if (!passable(site, e, { x, y })) return false;
  }
  return false;
}
export function ambientLight(site: FieldSite, e: Expedition, p: Point) {
  return site.lights.some(
    (l) => distance(l, p) <= 2 && lineVisible(site, e, l, p),
  );
}
export function protectedByLight(site: FieldSite, e: Expedition) {
  return ambientLight(site, e, e.position) || (e.torch && e.battery > 0);
}
export function visibleCells(site: FieldSite, e: Expedition) {
  const v = vectors[e.facing];
  const cells: Point[] = [];
  site.grid.forEach((row, y) =>
    [...row].forEach((_, x) => {
      const p = { x, y },
        dx = x - e.position.x,
        dy = y - e.position.y,
        d = distance(p, e.position),
        ahead = dx * v.x + dy * v.y,
        side = Math.abs(dx * v.y - dy * v.x);
      if (
        (d <= 2 ||
          (e.torch &&
            e.battery > 0 &&
            d <= 7 &&
            ahead >= 0 &&
            side <= ahead + 1) ||
          (d <= 6 && ambientLight(site, e, p))) &&
        lineVisible(site, e, e.position, p)
      )
        cells.push(p);
    }),
  );
  return cells;
}
/** One deterministic shortest-path step; closed doors and walls block the shadow too. */
export function shadowStep(site: FieldSite, e: Expedition) {
  const queue = [e.shadow],
    seen = new Set([cellKey(e.shadow)]),
    first = new Map<string, Point>();
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i]!;
    if (distance(p, e.position) === 0) return first.get(cellKey(p)) ?? e.shadow;
    for (const dir of ["north", "east", "south", "west"] as const) {
      const v = vectors[dir],
        next = { x: p.x + v.x, y: p.y + v.y },
        key = cellKey(next);
      if (seen.has(key) || !passable(site, e, next)) continue;
      seen.add(key);
      queue.push(next);
      first.set(key, first.get(cellKey(p)) ?? next);
    }
  }
  return e.shadow;
}
