import test from "node:test";
import assert from "node:assert/strict";
import { challenges } from "../src/data/curriculum.js";
import { evaluateChallenge } from "../src/core/challengeEngine.js";

test("guided area challenge accepts multiple valid solutions", () => {
  const challenge = challenges.find((c) => c.id === "guided-1");
  const a = [{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 2 }, { x: 0, y: 2 }];
  const b = [{ x: 1, y: 1 }, { x: 5, y: 1 }, { x: 4, y: 3 }, { x: 2, y: 4 }, { x: 1, y: 3 }];

  const r1 = evaluateChallenge(challenge, a, true, 8);
  const r2 = evaluateChallenge(challenge, b, true, 8);

  assert.equal(r1.passed, true);
  assert.equal(r2.passed, true);
});

test("diagonal perimeter challenge rejects shape without diagonal", () => {
  const challenge = challenges.find((c) => c.id === "guided-2");
  const rect = [{ x: 1, y: 1 }, { x: 4, y: 1 }, { x: 4, y: 4 }, { x: 1, y: 4 }];
  const result = evaluateChallenge(challenge, rect, true, 8);
  assert.equal(result.passed, false);
});
