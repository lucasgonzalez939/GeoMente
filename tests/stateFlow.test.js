import test from "node:test";
import assert from "node:assert/strict";
import { canRedo, canUndo, createRuntimeState, pushHistory, redo, undo } from "../src/core/state.js";

test("undo and redo restore shape snapshots", () => {
  const state = createRuntimeState(5);
  state.pathPoints.push({ x: 0, y: 0 });
  pushHistory(state);
  state.pathPoints.push({ x: 1, y: 0 });

  assert.equal(canUndo(state), true);
  undo(state);
  assert.equal(state.pathPoints.length, 1);

  assert.equal(canRedo(state), true);
  redo(state);
  assert.equal(state.pathPoints.length, 2);
});
