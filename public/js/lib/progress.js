export const MODULES_PER_TRACK = 5;
export const HOURS_PER_MODULE = 2;
export const STEP_IDS = Object.freeze(['workshop', 'quiz', 'firstModule', 'liveSession', 'pathComplete']);

export const EMPTY_PROGRESS = Object.freeze({
  quizTrack: null,
  modulesDone: Object.freeze({}),
  sessionBooked: false,
});

export function modulesDoneIn(progress, track) {
  return (progress.modulesDone && progress.modulesDone[track]) || [];
}

/** The workshop step is always done: the profile is created right after it. */
export function computeSteps(progress) {
  const track = progress.quizTrack;
  const doneCount = track ? modulesDoneIn(progress, track).length : 0;
  const status = {
    workshop: true,
    quiz: Boolean(track),
    firstModule: doneCount >= 1,
    liveSession: Boolean(progress.sessionBooked),
    pathComplete: doneCount >= MODULES_PER_TRACK,
  };
  const steps = STEP_IDS.map((id) => ({ id, done: status[id] }));
  const completed = steps.filter((s) => s.done).length;
  return {
    steps,
    completed,
    remaining: steps.length - completed,
    percent: Math.round((completed / steps.length) * 100),
  };
}

/** Returns a new progress object with the module marked as done. */
export function completeModule(progress, track, moduleId) {
  const list = modulesDoneIn(progress, track);
  if (list.includes(moduleId)) return progress;
  return {
    ...progress,
    modulesDone: { ...progress.modulesDone, [track]: [...list, moduleId] },
  };
}
