export function createRuntimeState(challengeCount) {
  return {
    gridSize: 8,
    pathPoints: [],
    isClosed: false,
    currentChallengeIdx: 0,
    historyStack: [],
    redoStack: [],
    selectedVertexIndex: null,
    editMode: false,
    teacherMode: false,
    assignmentFilter: "all",
    playbackFrames: [],
    playbackHandle: null,
    challengeCount,
  };
}

export function snapshotShape(state) {
  return {
    pathPoints: state.pathPoints.map((p) => ({ ...p })),
    isClosed: state.isClosed,
    selectedVertexIndex: state.selectedVertexIndex,
  };
}

export function pushHistory(state) {
  state.historyStack.push(snapshotShape(state));
  if (state.historyStack.length > 200) state.historyStack.shift();
  state.redoStack = [];
}

export function restoreShape(state, snap) {
  state.pathPoints = snap.pathPoints.map((p) => ({ ...p }));
  state.isClosed = snap.isClosed;
  state.selectedVertexIndex = snap.selectedVertexIndex ?? null;
}

export function canUndo(state) {
  return state.historyStack.length > 0;
}

export function canRedo(state) {
  return state.redoStack.length > 0;
}

export function undo(state) {
  if (!canUndo(state)) return false;
  const current = snapshotShape(state);
  const prev = state.historyStack.pop();
  state.redoStack.push(current);
  restoreShape(state, prev);
  return true;
}

export function redo(state) {
  if (!canRedo(state)) return false;
  const current = snapshotShape(state);
  const next = state.redoStack.pop();
  state.historyStack.push(current);
  restoreShape(state, next);
  return true;
}
