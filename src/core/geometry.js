export function pointKey(p) {
  return `${p.x},${p.y}`;
}

export function distance(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.hypot(dx, dy);
}

export function perimeter(points, isClosed) {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) total += distance(points[i], points[i + 1]);
  if (isClosed && points.length > 2) total += distance(points[points.length - 1], points[0]);
  return total;
}

export function areaShoelace(points, isClosed) {
  if (!isClosed || points.length < 3) return 0;
  let acc = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    acc += a.x * b.y - b.x * a.y;
  }
  return Math.abs(acc / 2);
}

export function hasDuplicatePoints(points) {
  return new Set(points.map(pointKey)).size !== points.length;
}

function orientation(a, b, c) {
  const v = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
  if (Math.abs(v) < 1e-9) return 0;
  return v > 0 ? 1 : 2;
}

function onSegment(a, b, c) {
  return (
    Math.min(a.x, c.x) <= b.x && b.x <= Math.max(a.x, c.x) &&
    Math.min(a.y, c.y) <= b.y && b.y <= Math.max(a.y, c.y)
  );
}

export function segmentsIntersect(p1, q1, p2, q2) {
  const o1 = orientation(p1, q1, p2);
  const o2 = orientation(p1, q1, q2);
  const o3 = orientation(p2, q2, p1);
  const o4 = orientation(p2, q2, q1);

  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSegment(p1, p2, q1)) return true;
  if (o2 === 0 && onSegment(p1, q2, q1)) return true;
  if (o3 === 0 && onSegment(p2, p1, q2)) return true;
  if (o4 === 0 && onSegment(p2, q1, q2)) return true;
  return false;
}

export function hasSelfIntersection(points, isClosed) {
  if (!isClosed || points.length < 4) return false;
  const segments = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    segments.push([a, b, i]);
  }

  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 1; j < segments.length; j++) {
      const [a1, b1, i1] = segments[i];
      const [a2, b2, i2] = segments[j];
      const adjacent = Math.abs(i1 - i2) === 1 || Math.abs(i1 - i2) === segments.length - 1;
      if (adjacent) continue;
      if (segmentsIntersect(a1, b1, a2, b2)) return true;
    }
  }
  return false;
}

export function isDegenerate(points, isClosed) {
  return isClosed && points.length >= 3 && areaShoelace(points, true) < 1e-9;
}

export function segmentLengths(points, isClosed) {
  const lengths = [];
  for (let i = 0; i < points.length - 1; i++) lengths.push(distance(points[i], points[i + 1]));
  if (isClosed && points.length > 2) lengths.push(distance(points[points.length - 1], points[0]));
  return lengths;
}

export function hasDiagonalEdge(points, isClosed) {
  const n = points.length;
  if (n < 2) return false;
  const limit = isClosed ? n : n - 1;
  for (let i = 0; i < limit; i++) {
    const a = points[i];
    const b = points[(i + 1) % n];
    if (a.x !== b.x && a.y !== b.y) return true;
  }
  return false;
}

export function isVerticallySymmetric(points, isClosed) {
  if (!isClosed || points.length < 3) return false;
  const minX = Math.min(...points.map((p) => p.x));
  const maxX = Math.max(...points.map((p) => p.x));
  const axis2X = minX + maxX;
  const set = new Set(points.map(pointKey));
  return points.every((p) => set.has(`${axis2X - p.x},${p.y}`));
}

export function isPointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x; const yi = polygon[i].y;
    const xj = polygon[j].x; const yj = polygon[j].y;
    const intersect = (yi > point.y) !== (yj > point.y)
      && point.x < ((xj - xi) * (point.y - yi)) / ((yj - yi) || 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function isPointOnSegment(p, a, b) {
  const cross = (p.y - a.y) * (b.x - a.x) - (p.x - a.x) * (b.y - a.y);
  if (Math.abs(cross) > 1e-9) return false;
  const dot = (p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y);
  if (dot < 0) return false;
  const lenSq = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  return dot <= lenSq;
}

export function interiorBoundaryCounts(points, isClosed, gridSize) {
  if (!isClosed || points.length < 3) return { interior: 0, boundary: 0 };
  const vertexKeys = new Set(points.map(pointKey));
  let interior = 0;
  let boundary = 0;
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      const p = { x, y };
      if (vertexKeys.has(pointKey(p))) {
        boundary++;
        continue;
      }
      let onEdge = false;
      for (let i = 0; i < points.length; i++) {
        const a = points[i];
        const b = points[(i + 1) % points.length];
        if (isPointOnSegment(p, a, b)) {
          onEdge = true;
          break;
        }
      }
      if (onEdge) {
        boundary++;
      } else if (isPointInPolygon(p, points)) {
        interior++;
      }
    }
  }
  return { interior, boundary };
}
