import test from "node:test";
import assert from "node:assert/strict";
import {
  areaShoelace,
  hasSelfIntersection,
  interiorBoundaryCounts,
  perimeter,
} from "../src/core/geometry.js";

test("area and perimeter are computed for closed triangle", () => {
  const points = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 3 }];
  assert.equal(areaShoelace(points, true), 6);
  assert.equal(perimeter(points, true).toFixed(2), "12.00");
});

test("self intersection is detected for bow tie", () => {
  const points = [{ x: 1, y: 1 }, { x: 4, y: 4 }, { x: 1, y: 4 }, { x: 4, y: 1 }];
  assert.equal(hasSelfIntersection(points, true), true);
});

test("interior and boundary counts return expected rectangle values", () => {
  const rect = [{ x: 1, y: 1 }, { x: 4, y: 1 }, { x: 4, y: 3 }, { x: 1, y: 3 }];
  const counts = interiorBoundaryCounts(rect, true, 8);
  assert.equal(counts.interior, 2);
  assert.equal(counts.boundary, 10);
});
