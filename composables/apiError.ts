// What went wrong with a call to Roeiblik's own API, in the terms a visitor can act on.
//
// The routes in server/api answer a failure with a real status (see failure() in
// server/utils/upstream.js): 400 a malformed request, 404 no such person or race (also someone who
// asked to be hidden), 502/503 Time-Team or the KNRB not answering. A 429 comes from Cloudflare's
// rate limit in front of /api. No answer at all is either the visitor's connection or the site.

export type ApiErrorKind = "invalid" | "notFound" | "rateLimited" | "offline" | "unavailable";

export const isAbort = (e: any): boolean => e?.name === "AbortError" || e?.cause?.name === "AbortError";

export function apiErrorKind(e: any): ApiErrorKind {
  const status = Number(e?.statusCode ?? e?.status ?? e?.response?.status) || 0;
  if (status === 400) return "invalid";
  if (status === 404) return "notFound";
  if (status === 429) return "rateLimited";
  if (!status && typeof navigator !== "undefined" && navigator.onLine === false) return "offline";
  return "unavailable";
}

// Every call to /api goes through here: no automatic second try. $fetch would otherwise repeat a
// failed GET at once, and a route that waited ten seconds on Time-Team would make the visitor wait
// twenty. The visitor gets a button to try again instead.
export const API_FETCH = { retry: 0 } as const;

// One sentence the page shows, about the source the page talks to ("Time-Team", "De KNRB").
export function apiErrorText(kind: ApiErrorKind | null | undefined, source: string): string {
  switch (kind) {
    case "offline":
      return "Geen internetverbinding. Controleer je verbinding en probeer het opnieuw.";
    case "rateLimited":
      return "Te veel verzoeken achter elkaar. Wacht een minuut en probeer het opnieuw.";
    case "invalid":
      return "Zoek op 2 tot 100 tekens.";
    default:
      return `${source} is nu niet bereikbaar. Probeer het over een paar minuten opnieuw.`;
  }
}
