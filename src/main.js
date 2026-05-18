import { challenges, curriculum } from "./data/curriculum.js";
import { evaluateChallenge } from "./core/challengeEngine.js";
import { hasDuplicatePoints, pointKey } from "./core/geometry.js";
import { createRuntimeState, pushHistory, redo, undo } from "./core/state.js";
import { defaultData, exportData, importData, loadData, saveData } from "./core/persistence.js";
import { renderBoard, updateStatusBadge } from "./ui/render.js";

const state = createRuntimeState(challenges.length);
const storage = loadData();
const ui = mapUi();

initializeProfiles();
wireControls();
rerender();

if (!storage.firstRunDone) {
  ui.onboardingDialog.showModal();
}

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
    progressSummary: byId("progress-summary"),
    streakSummary: byId("streak-summary"),
    historyList: byId("history-list"),
    profileSelect: byId("profile-select"),
    profileName: byId("profile-name"),
    teacherPanel: byId("teacher-panel"),
    assignmentSelect: byId("assignment-select"),
    teacherModeBtn: byId("teacher-mode-btn"),
    editModeBtn: byId("edit-mode-btn"),
    onboardingDialog: byId("onboarding-dialog"),
  };
}

function byId(id) {
  return document.getElementById(id);
}

function currentChallengePool() {
  if (state.assignmentFilter === "all") return challenges;
  return challenges.filter((c) => c.level === state.assignmentFilter);
}

function getCurrentChallenge() {
  const pool = currentChallengePool();
  if (state.currentChallengeIdx >= pool.length) state.currentChallengeIdx = 0;
  return pool[state.currentChallengeIdx];
}

function currentProfile() {
  return storage.profiles[storage.activeProfile];
}

function initializeProfiles() {
  ui.profileSelect.innerHTML = "";
  Object.keys(storage.profiles).forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    ui.profileSelect.appendChild(opt);
  });
  ui.profileSelect.value = storage.activeProfile;
}

function wireControls() {
  byId("prev-challenge-btn").addEventListener("click", () => {
    const pool = currentChallengePool();
    state.currentChallengeIdx = (state.currentChallengeIdx - 1 + pool.length) % pool.length;
    resetBoard(false);
    rerender();
  });

  byId("next-challenge-btn").addEventListener("click", () => {
    const pool = currentChallengePool();
    state.currentChallengeIdx = (state.currentChallengeIdx + 1) % pool.length;
    resetBoard(false);
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
      finalizeAttempt("manual-close");
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
    resetBoard(true);
    rerender();
  });

  byId("create-profile-btn").addEventListener("click", () => {
    const name = ui.profileName.value.trim();
    if (!name || storage.profiles[name]) return;
    storage.profiles[name] = defaultData().profiles.Student;
    storage.activeProfile = name;
    ui.profileName.value = "";
    initializeProfiles();
    saveData(storage);
    rerender();
  });

  ui.profileSelect.addEventListener("change", () => {
    storage.activeProfile = ui.profileSelect.value;
    saveData(storage);
    rerender();
  });

  ui.teacherModeBtn.addEventListener("click", () => {
    state.teacherMode = !state.teacherMode;
    ui.teacherPanel.classList.toggle("hidden", !state.teacherMode);
    ui.teacherModeBtn.setAttribute("aria-pressed", String(state.teacherMode));
  });

  ui.assignmentSelect.addEventListener("change", () => {
    state.assignmentFilter = ui.assignmentSelect.value;
    state.currentChallengeIdx = 0;
    resetBoard(false);
    rerender();
  });

  byId("share-btn").addEventListener("click", async () => {
    const summary = buildResultSummary();
    try {
      await navigator.clipboard.writeText(summary);
      alert("Result copied to clipboard.");
    } catch {
      prompt("Copy your result:", summary);
    }
  });

  byId("print-btn").addEventListener("click", () => window.print());

  byId("playback-btn").addEventListener("click", () => playback());

  byId("export-btn").addEventListener("click", () => {
    const blob = new Blob([exportData(storage)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "geomente-data.json";
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
      initializeProfiles();
      saveData(storage);
      rerender();
      alert("Import successful.");
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
      finalizeAttempt("keyboard-close");
      rerender();
      return;
    }
    if (e.key.toLowerCase() === "r") {
      resetBoard(true);
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
    if (state.isClosed) finalizeAttempt("edit");
    rerender();
    return;
  }

  const isSameAsStart = state.pathPoints.length > 2
    && state.pathPoints[0].x === x
    && state.pathPoints[0].y === y;

  if (isSameAsStart) {
    pushHistory(state);
    state.isClosed = true;
    finalizeAttempt("tap-close");
    rerender();
    return;
  }

  if (state.pathPoints.some((q) => q.x === x && q.y === y)) return;

  pushHistory(state);
  state.pathPoints.push(p);
  state.playbackFrames.push({ pathPoints: state.pathPoints.map((t) => ({ ...t })), isClosed: false });
  rerender();
}

function resetBoard(countAttempt) {
  if (countAttempt) {
    currentProfile().attempts.push({
      challengeId: getCurrentChallenge().id,
      timestamp: Date.now(),
      result: "reset",
      points: state.pathPoints.length,
    });
  }
  state.pathPoints = [];
  state.isClosed = false;
  state.selectedVertexIndex = null;
  state.historyStack = [];
  state.redoStack = [];
  state.playbackFrames = [];
  saveData(storage);
}

function finalizeAttempt(source) {
  const challenge = getCurrentChallenge();
  const result = evaluateChallenge(challenge, state.pathPoints, state.isClosed, state.gridSize);
  const profile = currentProfile();

  const attempt = {
    challengeId: challenge.id,
    timestamp: Date.now(),
    source,
    passed: result.passed,
    area: Number(result.area.toFixed(2)),
    perimeter: Number(result.perimeter.toFixed(2)),
    points: state.pathPoints.map((p) => ({ ...p })),
  };
  profile.attempts.push(attempt);

  if (result.passed) {
    profile.progress[challenge.id] = "completed";
    profile.completedHistory.push({ id: challenge.id, at: Date.now() });
    profile.streak += 1;
    profile.bestStreak = Math.max(profile.bestStreak, profile.streak);
    const passCount = profile.attempts.filter((a) => a.challengeId === challenge.id && a.passed).length;
    if (passCount >= 2) profile.progress[challenge.id] = "mastered";
  } else {
    profile.streak = 0;
  }

  state.playbackFrames.push({ pathPoints: state.pathPoints.map((t) => ({ ...t })), isClosed: state.isClosed });
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
  const profile = currentProfile();

  ui.challengeTitle.textContent = challenge.title;
  ui.challengeDesc.textContent = challenge.description;
  ui.challengeLevel.textContent = `Level: ${challenge.level.toUpperCase()} · Concept: ${challenge.concept.join(", ")} · Difficulty: ${challenge.difficulty}`;
  ui.challengeIndex.textContent = `${state.currentChallengeIdx + 1} / ${currentChallengePool().length}`;
  ui.guidedPrompt.textContent = challenge.guidedPrompt;
  ui.reflectionQuestion.textContent = challenge.reflectionQuestion;

  ui.hintsList.innerHTML = challenge.hints.map((h) => `<li>${escapeHtml(h)}</li>`).join("");
  ui.misconceptionsList.innerHTML = challenge.misconceptions.map((m) => `<li>${escapeHtml(m)}</li>`).join("");

  ui.areaVal.textContent = result.area.toFixed(2);
  ui.perimeterVal.textContent = result.perimeter.toFixed(2);
  ui.verticesVal.textContent = String(state.pathPoints.length);
  ui.pickVal.textContent = `${result.pickCounts.interior} / ${result.pickCounts.boundary}`;

  ui.stepFeedback.innerHTML = result.feedback.map((msg) => `<li>${escapeHtml(msg)}</li>`).join("");

  const status = profile.progress[challenge.id] || (state.isClosed ? (result.passed ? "completed" : "retry") : "active");
  updateStatusBadge(ui.challengeStatus, status);

  const completed = Object.values(profile.progress).filter((s) => s === "completed" || s === "mastered").length;
  ui.progressSummary.textContent = `Completed challenges: ${completed}/${challenges.length}.`;
  ui.streakSummary.textContent = `Current streak: ${profile.streak} · Best streak: ${profile.bestStreak}.`;

  const lastAttempts = profile.attempts.slice(-10).reverse();
  ui.historyList.innerHTML = lastAttempts.length
    ? lastAttempts.map((a) => `<li>${new Date(a.timestamp).toLocaleString()} · ${a.challengeId} · ${a.passed ? "PASS" : a.result || "TRY"}</li>`).join("")
    : "<li>No attempts yet.</li>";
}

function buildResultSummary() {
  const challenge = getCurrentChallenge();
  const result = evaluateCurrent();
  const profile = currentProfile();
  const unique = new Set(state.pathPoints.map(pointKey)).size;
  return [
    `GeoMente Result`,
    `Profile: ${storage.activeProfile}`,
    `Challenge: ${challenge.title} (${challenge.id})`,
    `Status: ${result.passed ? "PASS" : "IN PROGRESS"}`,
    `Area: ${result.area.toFixed(2)}`,
    `Perimeter: ${result.perimeter.toFixed(2)}`,
    `Vertices: ${state.pathPoints.length} (unique: ${unique})`,
    `Interior/Boundary: ${result.pickCounts.interior}/${result.pickCounts.boundary}`,
    `Streak: ${profile.streak}`,
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
