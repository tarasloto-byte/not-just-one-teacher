export const TRACK_ORDER = Object.freeze(['programming', 'design', 'data', 'ai']);

/**
 * answers[i] is the chosen option index for questions[i].
 * Ties go to the track that appears first in TRACK_ORDER.
 */
export function scoreQuiz(questions, answers) {
  const totals = Object.fromEntries(TRACK_ORDER.map((track) => [track, 0]));
  questions.forEach((question, i) => {
    const option = question.options[answers[i]];
    if (option && option.track in totals) totals[option.track] += 1;
  });
  const winner = TRACK_ORDER.reduce((best, track) => (totals[track] > totals[best] ? track : best));
  return { winner, totals };
}

/** Return a new answers array with answer `optionIndex` at position `index`. */
export function withAnswer(answers, index, optionIndex) {
  const next = answers.slice();
  next[index] = optionIndex;
  return next;
}

export function isComplete(questions, answers) {
  return questions.every((_, i) => Number.isInteger(answers[i]));
}
