// Every address Roeiblik answers on, in one place, so a wrong address is corrected in ONE redirect.
//
// Two things can be wrong with a request:
//  - the host: anything other than NUXT_CANONICAL_HOST (roeiblik.com), such as www.roeiblik.com;
//  - the path: the sections used to be /Time-Team and /KNRB (and /api/Time-Team, /api/KNRB). They
//    are lowercase now. Old links, bookmarks and search results keep working: any casing of the
//    section is sent to the lowercase one, with the rest of the path (a person id keeps its own
//    casing) and the query string. The statistics page is gone: /knrb/statistieken and everything
//    below it, in any casing, goes straight to /knrb.
//
// server/middleware/canonical-host.js and server/middleware/lowercase-sections.js both ask
// redirectTarget() for the whole correction, so www.roeiblik.com/KNRB/persoon/x reaches
// https://roeiblik.com/knrb/persoon/x in one hop, whichever middleware runs first.
//
// Pages get a 301. API routes get a 308, which keeps the method and makes clear to a browser bundle
// from before the change that the same request belongs at the new address.

const SECTION = /^\/(api\/)?(time-team|knrb)(?=\/|$)/i;
const STATISTICS = /^\/knrb\/statistieken(?:\/|$)/i;
const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

// The path as it should be, or the same string when nothing needs to change.
export function canonicalPath(path) {
  const raw = String(path || '/');
  const cut = raw.indexOf('?');
  const pathname = cut === -1 ? raw : raw.slice(0, cut);
  const query = cut === -1 ? '' : raw.slice(cut);
  if (STATISTICS.test(pathname)) return '/knrb';
  const match = SECTION.exec(pathname);
  if (!match) return raw;
  const fixed = `/${match[1] ? 'api/' : ''}${match[2].toLowerCase()}`;
  if (match[0] === fixed) return raw;
  return fixed + pathname.slice(match[0].length) + query;
}

// { location, status, hostChanged } when the request should go elsewhere, else null.
export function redirectTarget(event) {
  const canonical = String(useRuntimeConfig(event).canonicalHost || '').toLowerCase();
  const host = (getRequestHeader(event, 'host') || '').toLowerCase();
  const hostChanged = Boolean(canonical) && host !== canonical && !LOCAL.test(host);
  const path = canonicalPath(event.path);
  if (!hostChanged && path === event.path) return null;
  return {
    location: hostChanged ? `https://${canonical}${path}` : path,
    status: /^\/api\//i.test(event.path) ? 308 : 301,
    hostChanged,
  };
}
