// One Time-Team person, merged and trimmed on the server.
//
// Time-Team's /person/{id} answer is a set of flat maps (event, entry, round, race, round_crew,
// race_crew) of 100-200 kB. It has no crews, no regatta names and no venues, so two small lookups
// are added: /{regatta}/entry/{entry} (the crew, with each member's person id: that is how the
// person's role is found) and /regatta/{regatta} (name and city). The browser gets one compact,
// ready-to-render profile of about a tenth of the size.
//
// Shape (see types/Timeteam.ts): { person: { id, displayname }, clubs[], events[] (newest first, one per
// event the person took part in; each with its entries and their races, latest round first),
// firstRace, partial }. Only what the page shows goes out. Whether an entry was won is decided
// here (decide(), below), so the page's count, its "Alleen winsten" filter and its trophies cannot
// disagree. `partial` means a lookup failed or came too late: such an answer is not cached, so the
// next visit tries again.

const API = 'https://api.beta.regatta.time-team.nl/api/1';

// Lookups per page view. A Cloudflare Worker on the free plan may make 50 subrequests per request:
// the person itself plus at most 40 lookups stays well inside that. Whatever does not fit (only
// people with a long history) is left out: the newest entries are complete, older ones may miss
// their regatta name or crew, and a crew can still be loaded when the visitor opens it.
const LOOKUP_BUDGET = 40;
const LOOKUP_CONCURRENCY = 8;
// Do not let a slow upstream hold the page: after this long, answer with what has arrived.
const LOOKUP_DEADLINE_MS = 4000;

export const ROLES = ['Rower', 'Cox', 'Coach'];

// Names are compared without case, accents, punctuation or extra spaces, so "Jöbsis" matches
// "Jobsis" and "van 't Hof" matches "Van t Hof".
export function normalName(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// A crew as the page shows it: names and seats only. People who asked to be hidden are left out.
export function shapeCrew(apiEntry, personId, blocked) {
  if (!apiEntry || !Array.isArray(apiEntry.rowers)) return null;
  const members = (list) => (Array.isArray(list) ? list : [])
    .filter((m) => m && !blocked(m.club_member?.person_id))
    .map((m) => {
      const id = m.club_member?.person_id;
      const name = m.fullname || [m.firstname, m.lastname].filter(Boolean).join(' ');
      return {
        name,
        ...(Number.isFinite(m.position) ? { position: m.position } : {}),
        ...(id ? { id } : {}),
        ...(id && id === personId ? { self: true } : {}),
      };
    })
    .filter((m) => m.name)
    .sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
  const boat = Array.isArray(apiEntry.boats) ? apiEntry.boats.find((b) => b?.name)?.name : undefined;
  return {
    rowers: members(apiEntry.rowers),
    coxes: members(apiEntry.coxes),
    coaches: members(apiEntry.coaches),
    ...(boat ? { boat } : {}),
  };
}

// The person's role in an entry: by person id when the crew is known (exact), else by name.
export function roleInCrew(apiEntry, personId, displayname) {
  if (!apiEntry) return undefined;
  const lists = { Rower: apiEntry.rowers, Cox: apiEntry.coxes, Coach: apiEntry.coaches };
  for (const role of ROLES) {
    if ((lists[role] || []).some((m) => m?.club_member?.person_id === personId)) return role;
  }
  const name = normalName(displayname);
  for (const role of ROLES) {
    if ((lists[role] || []).some((m) => m && normalName(m.fullname || `${m.firstname} ${m.lastname}`) === name)) return role;
  }
  return undefined;
}

// A main final is a final round (round.is_final) that is not a lower final: FB, FC, ... or a
// "B-finale" / "kleine finale". A straight final (one race, no heats), a head race and a final
// named after its distance ("2000 meter") have no letter: also main.
function isMainFinal(round) {
  if (!round?.is_final) return false;
  const code = String(round.round_type_code ?? '').trim();
  const letter = /^F([A-Z])$/i.exec(code)?.[1];
  if (letter) return letter.toUpperCase() === 'A';
  return !/^[B-Z]-finale$|kleine[\s-]?finale/i.test(String(round.round_type_name ?? '').trim());
}

// WHEN AN ENTRY IS WON (one rule for the count, the "Alleen winsten" filter and the trophy).
//
// An entry (one crew in one event) is won when the crew finished first in the race that decided
// the event:
//  - If the crew raced a final round, that final decides (the latest, should there be two). Only
//    the main final counts (see isMainFinal): first in a B- or C-final is not a win.
//  - Without a final, the crew's last round decides when nothing follows it: the round has no
//    progression rules and the crew did not go on. That is a single head race or time trial that
//    Time-Team did not mark as a final, or the last round of a format in which every crew goes on
//    ("alle ploegen": 1e ronde, then 2e ronde).
//  - Several such rounds side by side, without a final (separate distances ranked one by one, such
//    as a vierkamp of 250, 750, 2500 and 5000 m): the overall ranking is not in Time-Team's person
//    data, so the entry is won only when the crew was first in every one of them.
//  - A heat, repechage, quarter- or semi-final, or a time trial with progression rules never
//    decides: other crews went on, and so did this one if it was first.
// "First" is place 1 in the crew's own event (the round's ranking when a race mixes events, as in a
// head race), with a time: no result yet, DNS/DNF/DSQ or out of competition (buiten mededinging) is
// never a win. A shared first place counts for both crews. A provisional result counts, and the
// page says it is provisional.
function decide(races) {
  const finals = races.filter((r) => r.final);
  const deciding = finals.length ? [finals[0]] : races.filter((r) => r._end);
  const won = deciding.length > 0
    && deciding.every((r) => r.position === 1 && !r.outOfCompetition && (!r.final || r._main));
  return { won, deciding: won ? deciding : [] };
}

const isTime = (value) => typeof value === 'string' && /^\d/.test(value.trim());
const text = (value) => (typeof value === 'string' && value.trim() ? value.trim() : undefined);
const day = (value) => (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : undefined);

function shapeRace(raceCrew, raw) {
  const round = raw.round?.[raceCrew.round_id] ?? {};
  const race = raw.race?.[raceCrew.race_id] ?? {};
  // A time trial or a race shared by several events is ranked per round: round_crew holds the
  // place within the person's own event ("11th of HEj 8+"), race_crew the place in the whole
  // race ("74th of all boats"). Heats and finals have no round_crew: there the race is the ranking.
  const ranking = raw.round_crew?.[raceCrew.id] ?? raceCrew;
  const rawResult = text(ranking.adjusted_result) ?? text(raceCrew.adjusted_result);
  const hasTime = isTime(rawResult);
  const position = hasTime && Number.isInteger(ranking.adjusted_pos) && ranking.adjusted_pos > 0 ? ranking.adjusted_pos : undefined;
  const layout = race.timing_layout ?? round.timing_layout ?? {};
  const distance = Number.isFinite(layout.distance) && layout.distance > 0 ? layout.distance : undefined;
  const outOfCompetition = raceCrew.is_ooc === true;
  const splits = (Array.isArray(ranking.times) ? ranking.times : [])
    .filter((t) => t?.location_name && t.location_name !== 'finish' && isTime(t.total?.result))
    .map((t) => ({ at: t.location_name, time: t.total.result, ...(Number.isInteger(t.total.pos) ? { pos: t.total.pos } : {}) }));
  const ruleList = Array.isArray(round.rules) && round.rules.length ? round.rules : (Array.isArray(race.rules) ? race.rules : []);
  const rules = ruleList.map((r) => text(r?.code)).filter(Boolean);
  return {
    id: raceCrew.id,
    date: day(race.regatta_day?.day_date) ?? day(race.start_datetime),
    start: text(race.start_datetime),
    round: text(round.round_type_code) ?? text(race.round_type_code) ?? '',
    roundName: text(round.round_type_name) ?? text(race.round_type_name) ?? '',
    sort: Number.isFinite(round.sort_order) ? round.sort_order : 0,
    final: round.is_final === true,
    ...(distance ? { distance } : {}),
    ...(text(layout.code) ? { course: text(layout.code) } : {}),
    ...(position ? { position } : {}),
    // A time, or a status code such as DNS/DNF/DSQ when the crew has no time.
    ...(rawResult ? { result: rawResult } : {}),
    ...(hasTime && text(ranking.adjusted_plus) ? { margin: text(ranking.adjusted_plus) } : {}),
    ...(text(raceCrew.lane) ? { lane: text(raceCrew.lane) } : {}),
    rules,
    ...(raceCrew.progression ? { progressed: true } : {}),
    ...(outOfCompetition ? { outOfCompetition } : {}),
    ...(raceCrew.penalty != null || ranking.penalty != null ? { penalty: true } : {}),
    ...(round.official === false ? { provisional: true } : {}),
    ...(splits.length ? { splits } : {}),
    win: false, // set per entry by decide()
    // For decide() only; removed before the answer goes out.
    _main: isMainFinal(round),
    _end: ruleList.length === 0 && !raceCrew.progression,
  };
}

// The crew's name. A single sculler's entry can carry the sculler's own name: when that is a
// hidden person, show the club instead.
function entryName(entry, crewEntry, blocked) {
  const hidden = crewEntry
    ? [...(crewEntry.rowers || []), ...(crewEntry.coxes || []), ...(crewEntry.coaches || [])]
      .filter((m) => m && blocked(m.club_member?.person_id))
      .map((m) => normalName(m.fullname || `${m.firstname} ${m.lastname}`))
    : [];
  const options = [entry.name, entry.shortname, entry.club?.shortname, entry.club?.name].map(text).filter(Boolean);
  return options.find((name) => !hidden.includes(normalName(name))) ?? '';
}

const newestFirst = (a, b) => (b.start ?? b.date ?? '').localeCompare(a.start ?? a.date ?? '') || b.sort - a.sort;

// Entries the person raced in, grouped per event, newest first. Pure: no I/O, so it can be tested
// against saved API answers.
export function buildProfile(raw, personId, { regattas = new Map(), entries = new Map(), blocked = () => false, partial = false } = {}) {
  const person = raw?.person?.[personId] ?? Object.values(raw?.person ?? {})[0];
  const displayname = person?.displayname ?? '';
  const byEntry = new Map(); // entry id -> Map(race id -> shaped race)
  for (const raceCrew of Object.values(raw?.race_crew ?? {})) {
    const entry = raw.entry?.[raceCrew.entry_id];
    if (!entry || !raw.round?.[raceCrew.round_id]) continue;
    if (!byEntry.has(entry.id)) byEntry.set(entry.id, new Map());
    // The same race twice for one entry (a re-row or a doubled record) is shown and counted once:
    // the record with a result wins over one without.
    const races = byEntry.get(entry.id);
    const key = raceCrew.race_id ?? raceCrew.id;
    const shaped = shapeRace(raceCrew, raw);
    const known = races.get(key);
    if (!known || (!known.result && shaped.result)) races.set(key, shaped);
  }

  const clubCounts = new Map();
  const groups = new Map();
  for (const [entryId, raceMap] of byEntry) {
    const entry = raw.entry[entryId];
    const event = raw.event?.[entry.event_id] ?? {};
    const regattaId = event.regatta_id;
    const crewEntry = entries.get(entryId);
    const races = [...raceMap.values()].sort(newestFirst);
    const { won, deciding } = decide(races);
    for (const race of races) {
      race.win = deciding.includes(race);
      delete race.sort;
      delete race.final;
      delete race._main;
      delete race._end;
    }

    let role = roleInCrew(crewEntry, personId, displayname);
    if (!role && !crewEntry && normalName(entry.stroke_fullname) === normalName(displayname)) role = 'Rower';

    // The club the person started for: their own membership in the crew, else the entry's club
    // (a combination lists only its first club, so that one is not used for the header).
    const self = crewEntry && [...(crewEntry.rowers || []), ...(crewEntry.coxes || []), ...(crewEntry.coaches || [])]
      .find((m) => m?.club_member?.person_id === personId);
    const club = self?.club_member?.club ?? (entry.combination ? undefined : entry.club);
    if (club?.id) {
      const known = clubCounts.get(club.id) ?? { club, count: 0, last: '' };
      known.count += 1;
      known.last = [known.last, races[0]?.start ?? ''].sort().pop();
      clubCounts.set(club.id, known);
    }

    const shaped = {
      id: entryId,
      regattaId,
      name: entryName(entry, crewEntry, blocked),
      ...(entry.club?.blades?.crop ? { blade: entry.club.blades.crop } : {}),
      ...(role ? { role } : {}),
      won,
      crew: crewEntry ? shapeCrew(crewEntry, personId, blocked) : null,
      races,
    };

    const regatta = regattas.get(regattaId);
    if (!groups.has(event.id ?? entryId)) {
      groups.set(event.id ?? entryId, {
        id: event.id ?? entryId,
        code: text(event.code) ?? '',
        name: text(event.name) ?? text(event.code) ?? '',
        ...(regatta?.name ? { regatta: text(regatta.name) } : {}),
        ...(regatta?.city ? { city: text(regatta.city) } : {}),
        entries: [],
      });
    }
    groups.get(event.id ?? entryId).entries.push(shaped);
  }

  const latest = (group) => group.entries.map((e) => e.races[0]?.start ?? e.races[0]?.date ?? '').sort().pop() ?? '';
  const events = [...groups.values()];
  for (const group of events) {
    group.entries.sort((a, b) => (b.races[0]?.start ?? '').localeCompare(a.races[0]?.start ?? ''));
    group.date = group.entries[0]?.races[0]?.date;
    group.start = latest(group);
    if (!group.date) {
      // No race date at all: fall back to the regatta's first day.
      const days = regattas.get(group.entries[0]?.regattaId)?.regatta_days;
      group.date = day(Array.isArray(days) ? days[0]?.day_date : undefined);
    }
  }
  events.sort((a, b) => (b.start || b.date || '').localeCompare(a.start || a.date || ''));

  let firstRace;
  for (const group of events) {
    for (const entry of group.entries) {
      for (const race of entry.races) {
        const key = race.start ?? race.date;
        if (key && (!firstRace || key < firstRace.key)) {
          firstRace = { key, date: race.date, entry: entry.name, event: group.code };
        }
      }
    }
  }
  if (firstRace) delete firstRace.key;
  // Start times and the event's date were only needed for the order above: the page shows each
  // race's own date.
  for (const group of events) {
    delete group.start;
    delete group.date;
    for (const entry of group.entries) for (const race of entry.races) delete race.start;
  }

  const clubs = [...clubCounts.values()]
    .sort((a, b) => b.count - a.count || b.last.localeCompare(a.last))
    .map(({ club }) => ({
      id: club.id,
      name: text(club.name) ?? text(club.shortname) ?? '',
      ...(club.blades?.crop ? { blade: club.blades.crop } : {}),
    }));

  return {
    person: { id: person?.id ?? personId, displayname },
    clubs,
    events,
    ...(firstRace ? { firstRace } : {}),
    ...(partial ? { partial: true } : {}),
  };
}

// Which lookups to do, newest entry first: its regatta (once per regatta) and, when the role is
// not already clear from the stroke's name, its crew. Crews of entries the person stroked follow
// last; they only fill the crew list. Capped at the budget.
export function planLookups(raw, personId) {
  const displayname = raw?.person?.[personId]?.displayname ?? Object.values(raw?.person ?? {})[0]?.displayname;
  const newest = new Map();
  for (const raceCrew of Object.values(raw?.race_crew ?? {})) {
    const start = raw.race?.[raceCrew.race_id]?.start_datetime ?? '';
    if ((newest.get(raceCrew.entry_id) ?? '') <= start) newest.set(raceCrew.entry_id, start);
  }
  const entries = [...newest.entries()]
    .map(([entryId, start]) => ({ entry: raw.entry?.[entryId], start }))
    .filter(({ entry }) => entry && raw.event?.[entry.event_id]?.regatta_id)
    .sort((a, b) => b.start.localeCompare(a.start));

  const first = [];
  const later = [];
  const seenRegattas = new Set();
  for (const { entry } of entries) {
    const regattaId = raw.event[entry.event_id].regatta_id;
    if (!seenRegattas.has(regattaId)) {
      seenRegattas.add(regattaId);
      first.push({ kind: 'regatta', regattaId });
    }
    const stroke = normalName(entry.stroke_fullname) === normalName(displayname);
    (stroke ? later : first).push({ kind: 'entry', regattaId, entryId: entry.id });
  }
  const all = [...first, ...later];
  return { lookups: all.slice(0, LOOKUP_BUDGET), skipped: Math.max(0, all.length - LOOKUP_BUDGET) };
}

async function runLookups(lookups) {
  const regattas = new Map();
  const entries = new Map();
  let next = 0;
  let failed = 0;
  const worker = async () => {
    while (next < lookups.length) {
      const lookup = lookups[next++];
      try {
        if (lookup.kind === 'regatta') {
          const answer = await upstream(`${API}/regatta/${encodeURIComponent(lookup.regattaId)}`);
          const regatta = answer?.regatta?.[lookup.regattaId] ?? Object.values(answer?.regatta ?? {})[0];
          if (regatta) regattas.set(lookup.regattaId, regatta);
        } else {
          const answer = await upstream(`${API}/${encodeURIComponent(lookup.regattaId)}/entry/${encodeURIComponent(lookup.entryId)}`);
          const entry = answer?.entry?.[lookup.entryId];
          if (entry) entries.set(lookup.entryId, entry);
        }
      } catch (error) {
        // A regatta or entry Time-Team does not have stays missing; anything else may work later.
        if (error?.statusCode !== 404) failed += 1;
      }
    }
  };
  let timer;
  const deadline = new Promise((resolve) => { timer = setTimeout(() => resolve('late'), LOOKUP_DEADLINE_MS); });
  const outcome = await Promise.race([
    Promise.all(Array.from({ length: Math.min(LOOKUP_CONCURRENCY, lookups.length) }, worker)),
    deadline,
  ]);
  clearTimeout(timer);
  if (outcome === 'late') next = lookups.length; // start nothing new; late answers are ignored
  // Copies: workers still running after the deadline must not change what is being returned.
  return { regattas: new Map(regattas), entries: new Map(entries), incomplete: outcome === 'late' || failed > 0 };
}

export default defineEventHandler(async (event) => {
  const id = queryString(event, 'id');

  if (!validId(id)) {
    return invalid(event, 'The id parameter is required');
  }
  // A hidden person gets the same answer as an unknown one.
  if (isBlocked(event, id)) {
    return notFound(event);
  }

  let raw;
  try {
    raw = await upstream(`${API}/person/${encodeURIComponent(id)}`);
  } catch (error) {
    return error?.statusCode === 404 ? notFound(event) : upstreamFailure(event, error);
  }
  if (!raw?.person || !Object.keys(raw.person).length) {
    return notFound(event);
  }

  // Lookups left out for the budget are not `partial`: they would be left out next time as well,
  // and the page loads such a crew when it is opened.
  const { lookups } = planLookups(raw, id);
  const { regattas, entries, incomplete } = await runLookups(lookups);
  const profile = buildProfile(raw, id, {
    regattas,
    entries,
    blocked: (personId) => Boolean(personId) && isBlocked(event, personId),
    partial: incomplete,
  });

  // The visitor's own browser may reuse a complete answer for a few minutes (Back, reload); shared
  // caches never. An incomplete one is not kept, so the next visit asks again.
  setResponseHeader(event, 'Cache-Control', incomplete ? 'no-store' : 'private, max-age=300');
  return profile;
});
