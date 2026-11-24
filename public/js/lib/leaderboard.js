export const POINTS = Object.freeze({ module: 10, task: 5, session: 15 });

/**
 * Towns are ranked by points per active student, so a small town
 * can beat a bigger one. Individual students are never ranked.
 */
export function rankCities(cities, points = POINTS) {
  return cities
    .map((c) => {
      const total = c.modules * points.module + c.tasks * points.task + c.sessions * points.session;
      const perStudent = c.students > 0 ? Math.round((total / c.students) * 10) / 10 : 0;
      return { ...c, total, perStudent };
    })
    .sort((a, b) => b.perStudent - a.perStudent || b.total - a.total)
    .map((c, i) => ({ ...c, rank: i + 1 }));
}
