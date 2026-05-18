import { challenges } from "./data/curriculum.js";
import { evaluateChallenge } from "./core/challengeEngine.js";
import { hasDuplicatePoints } from "./core/geometry.js";
import { createRuntimeState, pushHistory, redo, undo } from "./core/state.js";
import { exportData, importData, loadData, saveData } from "./core/persistence.js";
import { renderBoard, updateStatusBadge } from "./ui/render.js";

const state = createRuntimeState(challenges.length);
const storage = loadData();
const ui = mapUi();

wireControls();
rerender();

if (!storage.firstRunDone) ui.onboardingDialog.showModal();

function mapUi() {
  return {
    svg: byId("geoboard"),
    challengeTitle: byId("challenge-title"),
    challengeDesc: byId("challenge-desc"),
    challengeLevel: byId("challenge-level"),
    challengeIndex: byId("challenge-index"),
    challengeStatus: byId("challenge-status"),
    guidedPrompt: byId("guided-prompt"),
    reflectionQuestion: byId("reflection-question"),
    hintsList: byId("hints-list"),
    misconceptionsList: byId("misconceptions-list"),
    areaVal: byId("area-val"),
    perimeterVal: byId("perimeter-val"),
    verticesVal: byId("vertices-val"),
    pickVal: byId("pick-val"),
    stepFeedback: byId("step-feedback"),
    encouragementSummary: byId("encouragement-summary"),
    reflectionHistory: byId("reflection-history"),
    onboardingDialog: byId("onboarding-dialog"),
    editModeBtn: byId("edit-mode-btn"),
  };
}

function byId(id) {
  return document.getElementById(id);
}

function getCurrentChallenge() {
  return challenges[state.currentChallengeIdx];
}

function wireControls() {
  byId("prev-challenge-btn").addEventListener("click", () => {
    state.currentChallengeIdx = (state.currentChallengeIdx - 1 + challenges.length) % challenges.length;
    resetBoard();
    rerender();
  });

  byId("next-challenge-btn").addEventListener("click", () => {
    state.currentChallengeIdx = (state.currentChallengeIdx + 1) % challenges.length;
    resetBoard();
    rerender();
  });

  byId("undo-btn").addEventListener("click", () => {
    undo(state);
    rerender();
  });

  byId("redo-btn").addEventListener("click", () => {
    redo(state);
    rerender();
  });

  byId("close-btn").addEventListener("click", () => {
    if (state.pathPoints.length > 2) {
      pushHistory(state);
      state.isClosed = true;
      finalizeAttempt();
      rerender();
    }
  });

  byId("edit-mode-btn").addEventListener("click", () => {
    state.editMode = !state.editMode;
    state.selectedVertexIndex = null;
    ui.editModeBtn.setAttribute("aria-pressed", String(state.editMode));
    ui.editModeBtn.textContent = state.editMode ? "Edit Mode · ON" : "Edit Mode";
    rerender();
  });

  byId("reset-btn").addEventListener("click", () => {
    resetBoard();
    rerender();
  });

  byId("share-btn").addEventListener("click", async () => {
    const summary = buildReflectionSummary();
    try {
      await navigator.clipboard.writeText(summary);
      alert("Reflection copied to clipboard.");
    } catch {
      prompt("Copy your reflection:", summary);
    }
  });

  byId("print-btn").addEventListener("click", () => window.print());
  byId("playback-btn").addEventListener("click", () => playback());

  byId("export-btn").addEventListener("click", () => {
    const payload = {
      ...storage,
      lastSession: {
        challengeId: getCurrentChallenge().id,
        snapshots: state.playbackFrames,
      },
    };
    const blob = new Blob([exportData(payload)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "geomente-session.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  byId("import-input").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const imported = importData(text);
      Object.assign(storage, imported);
      if (Array.isArray(storage.lastSession?.snapshots)) {
        state.playbackFrames = storage.lastSession.snapshots;
      }
      saveData(storage);
      rerender();
      alert("Session import successful.");
    } catch (err) {
      alert(`Import failed: ${err.message}`);
    }
    e.target.value = "";
  });

  byId("start-learning-btn").addEventListener("click", () => {
    storage.firstRunDone = true;
    saveData(storage);
    ui.onboardingDialog.close();
  });

  document.addEventListener("keydown", (e) => {
    const cmd = e.metaKey || e.ctrlKey;
    if (cmd && e.key.toLowerCase() === "z") {
      e.preventDefault();
      undo(state);
      rerender();
      return;
    }
    if (cmd && e.key.toLowerCase() === "y") {
      e.preventDefault();
      redo(state);
      rerender();
      return;
    }
    if (e.key === "Enter" && state.pathPoints.length > 2 && !state.isClosed) {
      pushHistory(state);
      state.isClosed = true;
      finalizeAttempt();
      rerender();
      return;
    }
    if (e.key.toLowerCase() === "r") {
      resetBoard();
      rerender();
      return;
    }
    if (e.key.toLowerCase() === "e") {
      state.editMode = !state.editMode;
      ui.editModeBtn.setAttribute("aria-pressed", String(state.editMode));
      ui.editModeBtn.textContent = state.editMode ? "Edit Mode · ON" : "Edit Mode";
      rerender();
    }
  });
}

function onPinInteract(event) {
  const target = event.currentTarget ?? event.target;
  const x = Number(target.dataset.gridX);
  const y = Number(target.dataset.gridY);
  if (!Number.isInteger(x) || !Number.isInteger(y)) return;

  const p = { x, y };
  if (state.isClosed && !state.editMode) return;

  if (state.editMode) {
    const idx = state.pathPoints.findIndex((q) => q.x === x && q.y === y);
    if (state.selectedVertexIndex === null) {
      state.selectedVertexIndex = idx >= 0 ? idx : null;
      rerender();
      return;
    }
    if (idx >= 0 && idx !== state.selectedVertexIndex) {
      state.selectedVertexIndex = idx;
      rerender();
      return;
    }
    pushHistory(state);
    const next = state.pathPoints.map((v, i) => (i === state.selectedVertexIndex ? p : v));
    if (hasDuplicatePoints(next)) {
      state.selectedVertexIndex = null;
      rerender();
      return;
    }
    state.pathPoints = next;
    state.selectedVertexIndex = null;
    if (state.isClosed) finalizeAttempt();
    rerender();
    return;
  }

  const isSameAsStart = state.pathPoints.length > 2
    && state.pathPoints[0].x === x
    && state.pathPoints[0].y === y;

  if (isSameAsStart) {
    pushHistory(state);
    state.isClosed = true;
    finalizeAttempt();
    rerender();
    return;
  }

  if (state.pathPoints.some((q) => q.x === x && q.y === y)) return;

  pushHistory(state);
  state.pathPoints.push(p);
  state.playbackFrames.push({ pathPoints: state.pathPoints.map((t) => ({ ...t })), isClosed: false });
  rerender();
}

function resetBoard() {
  state.pathPoints = [];
  state.isClosed = false;
  state.selectedVertexIndex = null;
  state.historyStack = [];
  state.redoStack = [];
  state.playbackFrames = [];
}

function finalizeAttempt() {
  const challenge = getCurrentChallenge();
  const result = evaluateChallenge(challenge, state.pathPoints, state.isClosed, state.gridSize);

  const reflection = {
    challengeId: challenge.id,
    timestamp: Date.now(),
    message: result.passed
      ? "Objective reached. Nice mathematical reasoning!"
      : "Good attempt. Use feedback and try another strategy.",
  };
  storage.reflections.push(reflection);
  storage.lastSession = {
    challengeId: challenge.id,
    notes: reflection.message,
    snapshots: state.playbackFrames,
  };
  saveData(storage);
}

function evaluateCurrent() {
  const challenge = getCurrentChallenge();
  return evaluateChallenge(challenge, state.pathPoints, state.isClosed, state.gridSize);
}

function rerender() {
  renderBoard(ui.svg, state, { onPinInteract });
  const challenge = getCurrentChallenge();
  const result = evaluateCurrent();

  ui.challengeTitle.textContent = challenge.title;
  ui.challengeDesc.textContent = challenge.description;
  ui.challengeLevel.textContent = `Level: ${challenge.level.toUpperCase()} · Concept: ${challenge.concept.join(", ")} · Difficulty: ${challenge.difficulty}`;
  ui.challengeIndex.textContent = `${state.currentChallengeIdx + 1} / ${challenges.length}`;
  ui.guidedPrompt.textContent = challenge.guidedPrompt;
  ui.reflectionQuestion.textContent = challenge.reflectionQuestion;

  ui.hintsList.innerHTML = challenge.hints.map((h) => `<li>${escapeHtml(h)}</li>`).join("");
  ui.misconceptionsList.innerHTML = challenge.misconceptions.map((m) => `<li>${escapeHtml(m)}</li>`).join("");

  ui.areaVal.textContent = result.area.toFixed(2);
  ui.perimeterVal.textContent = result.perimeter.toFixed(2);
  ui.verticesVal.textContent = String(state.pathPoints.length);
  ui.pickVal.textContent = `${result.pickCounts.interior} / ${result.pickCounts.boundary}`;

  ui.stepFeedback.innerHTML = result.feedback.map((msg) => `<li>${escapeHtml(msg)}</li>`).join("");

  const status = state.isClosed ? (result.passed ? "objective-met" : "revise") : "active";
  updateStatusBadge(ui.challengeStatus, status);

  ui.encouragementSummary.textContent = result.passed
    ? "Great thinking! Try finding a second, different solution for the same objective."
    : "You are building understanding—adjust one decision and observe what changes.";

  const recent = storage.reflections.slice(-8).reverse();
  ui.reflectionHistory.replaceChildren();
  if (recent.length) {
    recent.forEach((r) => {
      const li = document.createElement("li");
      li.textContent = `${new Date(r.timestamp).toLocaleString()} · ${r.challengeId} · ${r.message}`;
      ui.reflectionHistory.appendChild(li);
    });
  } else {
    const li = document.createElement("li");
    li.textContent = "No reflections yet. Complete a shape to generate one.";
    ui.reflectionHistory.appendChild(li);
  }
}

function buildReflectionSummary() {
  const challenge = getCurrentChallenge();
  const result = evaluateCurrent();
  return [
    `GeoMente Reflection`,
    `Challenge: ${challenge.title} (${challenge.id})`,
    `State: ${state.isClosed ? (result.passed ? "Objective met" : "In revision") : "Exploring"}`,
    `Area: ${result.area.toFixed(2)}`,
    `Perimeter: ${result.perimeter.toFixed(2)}`,
    `Prompt: ${challenge.guidedPrompt}`,
    `Reflection question: ${challenge.reflectionQuestion}`,
  ].join("\n");
}

function playback() {
  if (!state.playbackFrames.length) return;
  if (state.playbackHandle) {
    clearInterval(state.playbackHandle);
    state.playbackHandle = null;
    return;
  }

  const frames = state.playbackFrames.slice();
  let i = 0;
  const currentSnapshot = {
    pathPoints: state.pathPoints.map((p) => ({ ...p })),
    isClosed: state.isClosed,
  };

  state.playbackHandle = setInterval(() => {
    if (i >= frames.length) {
      clearInterval(state.playbackHandle);
      state.playbackHandle = null;
      state.pathPoints = currentSnapshot.pathPoints;
      state.isClosed = currentSnapshot.isClosed;
      rerender();
      return;
    }
    state.pathPoints = frames[i].pathPoints.map((p) => ({ ...p }));
    state.isClosed = frames[i].isClosed;
    i += 1;
    rerender();
  }, 500);
}

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
