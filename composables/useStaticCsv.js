// The statistics CSVs (public/event_*): fetched at most once per page visit and shared by the
// components that show them (the times file feeds both a table and a chart), so switching back to
// a field is instant. Browser only. A failed fetch is forgotten, so the next attempt tries again.
const texts = new Map();

export function fetchStaticCsv(path) {
  if (!texts.has(path)) {
    const request = fetch(`/${path}`)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      })
      .catch((error) => {
        texts.delete(path);
        throw error;
      });
    texts.set(path, request);
  }
  return texts.get(path);
}
