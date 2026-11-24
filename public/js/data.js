// Fake demo data lives in /data/*.json. Requests are cached for the session.
const cache = new Map();

export function loadData(name) {
  if (!cache.has(name)) {
    const request = fetch(`data/${name}.json`).then((res) => {
      if (!res.ok) throw new Error(`Cannot load data/${name}.json (HTTP ${res.status})`);
      return res.json();
    });
    request.catch(() => cache.delete(name));
    cache.set(name, request);
  }
  return cache.get(name);
}

/** loadAll({ stories: 'stories', regions: 'regions' }) -> { stories: [...], regions: [...] } */
export async function loadAll(names) {
  const values = await Promise.all(names.map(loadData));
  return Object.fromEntries(names.map((name, i) => [toKey(name), values[i]]));
}

function toKey(name) {
  return name.replace(/-(\w)/g, (_, ch) => ch.toUpperCase());
}
