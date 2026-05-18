const STORAGE_KEY = "geomente.v1";

export function defaultData() {
  return {
    schemaVersion: 1,
    activeProfile: "Student",
    profiles: {
      Student: {
        progress: {},
        completedHistory: [],
        attempts: [],
        streak: 0,
        bestStreak: 0,
      },
    },
    firstRunDone: false,
  };
}

export function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultData();
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.schemaVersion !== 1) return defaultData();
    return parsed;
  } catch {
    return defaultData();
  }
}

export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function exportData(data) {
  return JSON.stringify(data, null, 2);
}

export function importData(jsonText) {
  const parsed = JSON.parse(jsonText);
  if (!parsed || parsed.schemaVersion !== 1 || typeof parsed.profiles !== "object") {
    throw new Error("Invalid import format.");
  }
  return parsed;
}
