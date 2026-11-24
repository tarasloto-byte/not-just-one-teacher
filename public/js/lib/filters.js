import { normalize } from './format.js';

export const OPPORTUNITY_TAGS = Object.freeze(['forGirls', 'online', 'free']);

export function filterStories(stories, { region = '', field = '', gender = '' } = {}) {
  return stories.filter(
    (s) =>
      (!region || s.region === region) &&
      (!field || s.field === field) &&
      (!gender || s.gender === gender),
  );
}

/** Map a typed town or voivodeship name to a region id ('' when unknown). */
export function resolveRegion(query, towns, regions) {
  const q = normalize(query);
  if (q.length < 2) return '';
  const region = regions.find((r) => normalize(r.name) === q || normalize(r.id) === q);
  if (region) return region.id;
  const exactTown = towns.find((t) => normalize(t.name) === q);
  if (exactTown) return exactTown.region;
  if (q.length < 3) return '';
  const partialTown = towns.find((t) => normalize(t.name).startsWith(q));
  return partialTown ? partialTown.region : '';
}

/** Online and nationwide opportunities are available from any town. */
export function isReachableEverywhere(opp) {
  return opp.format === 'online' || opp.region === 'all';
}

export function hasTag(opp, tag) {
  if (tag === 'online') return opp.format === 'online';
  if (tag === 'forGirls') return Boolean(opp.forGirls);
  if (tag === 'free') return Boolean(opp.free);
  return false;
}

function matchesText(opp, q) {
  return [opp.city, opp.title].some((value) => normalize(value).includes(q));
}

function matchesField(opp, field) {
  return !field || opp.fields.includes(field) || opp.fields.includes('all');
}

/**
 * region: a resolved region id; text: free text when it didn't resolve to a region.
 * Reachable-everywhere items always pass the location filters. Sorted by deadline.
 */
export function filterOpportunities(opps, { region = '', text = '', field = '', tags = [] } = {}) {
  const q = normalize(text);
  return opps
    .filter((o) => {
      const everywhere = isReachableEverywhere(o);
      if (region && !everywhere && o.region !== region) return false;
      if (!region && q && !everywhere && !matchesText(o, q)) return false;
      if (!matchesField(o, field)) return false;
      return tags.every((tag) => hasTag(o, tag));
    })
    .slice()
    .sort((a, b) => a.deadline.localeCompare(b.deadline));
}

/** The soonest workshop in the region that hasn't happened yet, or null. */
export function nextWorkshop(workshops, region, today) {
  const upcoming = workshops
    .filter((w) => w.region === region && w.date >= today)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
  return upcoming[0] ?? null;
}
