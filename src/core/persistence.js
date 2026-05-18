const STORAGE_KEY = "geomente.v1";

export function defaultData() {
  return {
    schemaVersion: 1,
    firstRunDone: false,
    reflections: [],
    lastSession: {
      challengeId: null,
      notes: "",
      snapshots: [],
    },
  };
}

export function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultData();
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.schemaVersion !== 1) return defaultData();
    return { ...defaultData(), ...parsed };
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
  if (!parsed || parsed.schemaVersion !== 1) throw new Error("Invalid import format.");
  return { ...defaultData(), ...parsed };
}
