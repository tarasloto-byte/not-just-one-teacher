// Demo-only persistence in localStorage. No data ever leaves the device.
import { EMPTY_PROGRESS } from './lib/progress.js';
import { TRACK_ORDER } from './lib/quiz.js';

const STORAGE_KEY = 'njot-demo-v1';

function readState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

let state = readState();

function commit(next) {
  state = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage blocked (e.g. private mode): the demo keeps working in memory.
  }
}

export function getProfile() {
  return state.profile ?? null;
}

export function setProfile(profile) {
  commit({ ...state, profile });
}

export function getProgress() {
  const progress = { ...EMPTY_PROGRESS, ...(state.progress ?? {}) };
  // Guard against hand-edited storage: only known routes are accepted.
  return TRACK_ORDER.includes(progress.quizTrack) ? progress : { ...progress, quizTrack: null };
}

export function setProgress(progress) {
  commit({ ...state, progress });
}

export function updateProgress(update) {
  setProgress(update(getProgress()));
}

export function resetAll() {
  commit({});
}
