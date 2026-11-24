function safeDecode(segment) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * Parse "#/stories/ola?field=data" into { segments: ['stories','ola'], query: {field:'data'} }.
 * Returns null for in-page anchors such as "#main" (not routes).
 */
export function parseHash(hash) {
  const raw = String(hash ?? '').replace(/^#/, '');
  if (raw && !raw.startsWith('/')) return null;
  const [pathPart, queryPart = ''] = raw.split('?');
  const segments = pathPart.split('/').filter(Boolean).map(safeDecode);
  const query = Object.fromEntries(new URLSearchParams(queryPart));
  return { segments, query };
}

/** Find the first route whose pattern ("stories/:id") matches the segments. */
export function matchRoute(routes, segments) {
  for (const route of routes) {
    const parts = route.pattern.split('/').filter(Boolean);
    if (parts.length !== segments.length) continue;
    const params = {};
    const isMatch = parts.every((part, i) => {
      if (part.startsWith(':')) {
        params[part.slice(1)] = segments[i];
        return true;
      }
      return part === segments[i];
    });
    if (isMatch) return { route, params };
  }
  return null;
}

/** Build "#/path?x=1", dropping empty query values. */
export function buildHash(path, query = {}) {
  const entries = Object.entries(query).filter(
    ([, value]) => value !== undefined && value !== null && value !== '',
  );
  const qs = new URLSearchParams(entries).toString();
  return `#${path}${qs ? `?${qs}` : ''}`;
}
