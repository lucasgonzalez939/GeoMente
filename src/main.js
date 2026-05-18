import { challenges } from "./data/curriculum.js";
import { evaluateChallenge } from "./core/challengeEngine.js";
import { hasDuplicatePoints } from "./core/geometry.js";
import {
  formatChallengeLevel,
  formatHistoryTimestamp,
  localizeChallenge,
  normalizeLocale,
  t,
} from "./core/i18n.js";
import { createRuntimeState, pushHistory, redo, undo } from "./core/state.js";
import { exportData, importData, loadData, saveData } from "./core/persistence.js";
import { renderBoard, updateStatusBadge } from "./ui/render.js";

const state = createRuntimeState(challenges.length);
const storage = loadData();
let locale = normalizeLocale(storage.language);
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
    langToggleBtn: byId("lang-toggle-btn"),
    appSubtitle: byId("app-subtitle"),
    boardHeading: byId("board-heading"),
    boardToolbar: document.querySelector(".board-toolbar"),
    kbdHelp: byId("kbd-help"),
    objectiveHeading: byId("objective-heading"),
    guidedPromptLabel: byId("guided-prompt-label"),
    reflectionLabel: byId("reflection-label"),
    hintsSummary: byId("hints-summary"),
    misconceptionsSummary: byId("misconceptions-summary"),
    prevChallengeBtn: byId("prev-challenge-btn"),
    nextChallengeBtn: byId("next-challenge-btn"),
    feedbackHeading: byId("feedback-heading"),
    metricAreaLabel: byId("metric-area-label"),
    metricPerimeterLabel: byId("metric-perimeter-label"),
    metricVerticesLabel: byId("metric-vertices-label"),
    metricInteriorBoundaryLabel: byId("metric-interior-boundary-label"),
    encourageHeading: byId("encourage-heading"),
    shareBtn: byId("share-btn"),
    printBtn: byId("print-btn"),
    playbackBtn: byId("playback-btn"),
    exportBtn: byId("export-btn"),
    importSessionLabel: byId("import-session-label"),
    onboardingTitle: byId("onboarding-title"),
    onboardingDesc: byId("onboarding-desc"),
    onboardingTip1: byId("onboarding-tip-1"),
    onboardingTip2: byId("onboarding-tip-2"),
    onboardingTip3: byId("onboarding-tip-3"),
    startLearningBtn: byId("start-learning-btn"),
    learningPanel: document.querySelector(".sidebar"),
  };
}

function byId(id) {
  return document.getElementById(id);
}

function getCurrentChallenge() {
  return localizeChallenge(challenges[state.currentChallengeIdx], locale);
}

function wireControls() {
  ui.langToggleBtn.addEventListener("click", () => {
    locale = locale === "en" ? "es" : "en";
    storage.language = locale;
    saveData(storage);
    rerender();
  });

  ui.prevChallengeBtn.addEventListener("click", () => {
    state.currentChallengeIdx = (state.currentChallengeIdx - 1 + challenges.length) % challenges.length;
    resetBoard();
    rerender();
  });

  ui.nextChallengeBtn.addEventListener("click", () => {
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

  ui.editModeBtn.addEventListener("click", () => {
    state.editMode = !state.editMode;
    state.selectedVertexIndex = null;
    syncEditModeButton();
    rerender();
  });

  byId("reset-btn").addEventListener("click", () => {
    resetBoard();
    rerender();
  });

  ui.shareBtn.addEventListener("click", async () => {
    const summary = buildReflectionSummary();
    try {
      await navigator.clipboard.writeText(summary);
      alert(t(locale, "clipboard.copied"));
    } catch {
      prompt(t(locale, "clipboard.prompt"), summary);
    }
  });

  ui.printBtn.addEventListener("click", () => window.print());
  ui.playbackBtn.addEventListener("click", () => playback());

  ui.exportBtn.addEventListener("click", () => {
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
      locale = normalizeLocale(storage.language);
      storage.language = locale;
      if (Array.isArray(storage.lastSession?.snapshots)) {
        state.playbackFrames = storage.lastSession.snapshots;
      }
      saveData(storage);
      rerender();
      alert(t(locale, "import.success"));
    } catch (err) {
      alert(t(locale, "import.failed", { message: err.message }));
    }
    e.target.value = "";
  });

  ui.startLearningBtn.addEventListener("click", () => {
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
      syncEditModeButton();
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
  state.playbackFrames.push({ pathPoints: state.pathPoints.map((pt) => ({ ...pt })), isClosed: false });
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
  const result = evaluateChallenge(challenge, state.pathPoints, state.isClosed, state.gridSize, locale);

  const reflection = {
    challengeId: challenge.id,
    timestamp: Date.now(),
    message: result.passed ? t(locale, "reflection.success") : t(locale, "reflection.retry"),
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
  return evaluateChallenge(challenge, state.pathPoints, state.isClosed, state.gridSize, locale);
}

function syncEditModeButton() {
  ui.editModeBtn.setAttribute("aria-pressed", String(state.editMode));
  ui.editModeBtn.textContent = state.editMode ? t(locale, "action.editModeOn") : t(locale, "action.editMode");
}

function applyStaticTranslations() {
  document.documentElement.lang = locale;
  document.title = t(locale, "app.title");
  ui.appSubtitle.textContent = t(locale, "app.subtitle");
  ui.langToggleBtn.textContent = locale === "en" ? t(locale, "lang.switch.toSpanish") : t(locale, "lang.switch.toEnglish");
  ui.langToggleBtn.setAttribute(
    "aria-label",
    locale === "en" ? t(locale, "lang.switchLabel.toSpanish") : t(locale, "lang.switchLabel.toEnglish"),
  );
  ui.boardHeading.textContent = t(locale, "board.heading");
  ui.boardToolbar.setAttribute("aria-label", t(locale, "board.actions"));
  ui.svg.setAttribute("aria-label", t(locale, "board.aria"));
  ui.kbdHelp.textContent = t(locale, "board.keyboardHelp");
  byId("undo-btn").textContent = t(locale, "action.undo");
  byId("redo-btn").textContent = t(locale, "action.redo");
  byId("close-btn").textContent = t(locale, "action.closeShape");
  byId("reset-btn").textContent = t(locale, "action.reset");
  ui.learningPanel.setAttribute("aria-label", t(locale, "panel.learning"));
  ui.objectiveHeading.textContent = t(locale, "objective.heading");
  ui.guidedPromptLabel.textContent = t(locale, "objective.guidedPrompt");
  ui.reflectionLabel.textContent = t(locale, "objective.reflection");
  ui.hintsSummary.textContent = t(locale, "objective.hints");
  ui.misconceptionsSummary.textContent = t(locale, "objective.misconceptions");
  ui.prevChallengeBtn.textContent = t(locale, "action.prev");
  ui.nextChallengeBtn.textContent = t(locale, "action.next");
  ui.feedbackHeading.textContent = t(locale, "feedback.heading");
  ui.metricAreaLabel.textContent = t(locale, "metric.area");
  ui.metricPerimeterLabel.textContent = t(locale, "metric.perimeter");
  ui.metricVerticesLabel.textContent = t(locale, "metric.vertices");
  ui.metricInteriorBoundaryLabel.textContent = t(locale, "metric.interiorBoundary");
  ui.encourageHeading.textContent = t(locale, "encouragement.heading");
  ui.shareBtn.textContent = t(locale, "action.shareReflection");
  ui.printBtn.textContent = t(locale, "action.print");
  ui.playbackBtn.textContent = t(locale, "action.playback");
  ui.exportBtn.textContent = t(locale, "action.exportSession");
  ui.importSessionLabel.textContent = t(locale, "action.importSession");
  ui.onboardingTitle.textContent = t(locale, "onboarding.title");
  ui.onboardingDesc.textContent = t(locale, "onboarding.body");
  ui.onboardingTip1.textContent = t(locale, "onboarding.tip1");
  ui.onboardingTip2.textContent = t(locale, "onboarding.tip2");
  ui.onboardingTip3.textContent = t(locale, "onboarding.tip3");
  ui.startLearningBtn.textContent = t(locale, "onboarding.start");
  syncEditModeButton();
}

function rerender() {
  applyStaticTranslations();
  renderBoard(ui.svg, state, { onPinInteract }, locale);
  const challenge = getCurrentChallenge();
  const result = evaluateCurrent();

  ui.challengeTitle.textContent = challenge.title;
  ui.challengeDesc.textContent = challenge.description;
  ui.challengeLevel.textContent = formatChallengeLevel(challenge, locale);
  ui.challengeIndex.textContent = `${state.currentChallengeIdx + 1} / ${challenges.length}`;
  ui.guidedPrompt.textContent = challenge.guidedPrompt;
  ui.reflectionQuestion.textContent = challenge.reflectionQuestion;

  ui.hintsList.innerHTML = challenge.hints.map((hint) => `<li>${escapeHtml(hint)}</li>`).join("");
  ui.misconceptionsList.innerHTML = challenge.misconceptions.map((item) => `<li>${escapeHtml(item)}</li>`).join("");

  ui.areaVal.textContent = result.area.toFixed(2);
  ui.perimeterVal.textContent = result.perimeter.toFixed(2);
  ui.verticesVal.textContent = String(state.pathPoints.length);
  ui.pickVal.textContent = `${result.pickCounts.interior} / ${result.pickCounts.boundary}`;

  ui.stepFeedback.innerHTML = result.feedback.map((msg) => `<li>${escapeHtml(msg)}</li>`).join("");

  const status = state.isClosed ? (result.passed ? "objective-met" : "revise") : "active";
  updateStatusBadge(ui.challengeStatus, status, locale);

  ui.encouragementSummary.textContent = result.passed
    ? t(locale, "encouragement.success")
    : t(locale, "encouragement.retry");

  const recent = storage.reflections.slice(-8).reverse();
  ui.reflectionHistory.replaceChildren();
  if (recent.length) {
    recent.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = `${formatHistoryTimestamp(item.timestamp, locale)} · ${item.challengeId} · ${item.message}`;
      ui.reflectionHistory.appendChild(li);
    });
  } else {
    const li = document.createElement("li");
    li.textContent = t(locale, "history.empty");
    ui.reflectionHistory.appendChild(li);
  }
}

function buildReflectionSummary() {
  const challenge = getCurrentChallenge();
  const result = evaluateCurrent();
  const stateLabel = state.isClosed
    ? (result.passed ? t(locale, "summary.state.objectiveMet") : t(locale, "summary.state.revision"))
    : t(locale, "summary.state.exploring");
  return [
    t(locale, "summary.title"),
    t(locale, "summary.challenge", { title: challenge.title, id: challenge.id }),
    t(locale, "summary.state", { state: stateLabel }),
    t(locale, "summary.area", { value: result.area.toFixed(2) }),
    t(locale, "summary.perimeter", { value: result.perimeter.toFixed(2) }),
    t(locale, "summary.prompt", { value: challenge.guidedPrompt }),
    t(locale, "summary.reflectionQuestion", { value: challenge.reflectionQuestion }),
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
