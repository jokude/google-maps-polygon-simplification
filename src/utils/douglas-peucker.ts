import type { Point, Points } from "./types";

const getSqDist = (p1: Point, p2: Point): number => {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return dx * dx + dy * dy;
};

// square distance from a point to a segment
const getSqSegDist = (p: Point, p1: Point, p2: Point): number => {
  let x = p1.x;
  let y = p1.y;
  let dx = p2.x - x;
  let dy = p2.y - y;

  if (dx !== 0 || dy !== 0) {
    const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);

    if (t > 1) {
      x = p2.x;
      y = p2.y;
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = p.x - x;
  dy = p.y - y;

  return dx * dx + dy * dy;
};

// basic distance-based simplification
const simplifyRadialDist = (points: Points, sqTolerance: number): Points => {
  let prevPoint = points[0];
  let newPoints = [prevPoint];
  let point;

  for (let i = 1, len = points.length; i < len; i++) {
    point = points[i];

    if (getSqDist(point, prevPoint) > sqTolerance) {
      newPoints.push(point);
      prevPoint = point;
    }
  }

  if (prevPoint !== point) newPoints.push(point);

  return newPoints;
};

const simplifyDPStep = (
  points: Points,
  first: number,
  last: number,
  sqTolerance: number,
  simplified: Points
): void => {
  let maxSqDist = sqTolerance;
  let index;

  for (let i = first + 1; i < last; i++) {
    const sqDist = getSqSegDist(points[i], points[first], points[last]);

    if (sqDist > maxSqDist) {
      index = i;
      maxSqDist = sqDist;
    }
  }

  if (maxSqDist > sqTolerance) {
    if (index - first > 1)
      simplifyDPStep(points, first, index, sqTolerance, simplified);
    simplified.push(points[index]);
    if (last - index > 1)
      simplifyDPStep(points, index, last, sqTolerance, simplified);
  }
};

// simplification using Ramer-Douglas-Peucker algorithm
const simplifyDouglasPeucker = (
  points: Points,
  sqTolerance: number
): Points => {
  const last = points.length - 1;

  const simplified = [points[0]];
  simplifyDPStep(points, 0, last, sqTolerance, simplified);
  simplified.push(points[last]);

  return simplified;
};

// both algorithms combined for awesome performance
const simplify = (
  points: Points,
  tolerance = 1,
  highestQuality = false
): Points => {
  if (points.length <= 2) return points;

  const sqTolerance = tolerance !== undefined ? tolerance * tolerance : 1;

  points = highestQuality ? points : simplifyRadialDist(points, sqTolerance);
  points = simplifyDouglasPeucker(points, sqTolerance);

  return points;
};

export { simplify };
