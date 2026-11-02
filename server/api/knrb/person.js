// A KNRB person: the profile plus every race they rowed, coxed or coached, grouped per event.
//
// foys returns one flat list of race results per tournament (`person-overview-results`), sorted
// by finishing position, not by round. Here the races of one event (one crew in one match) become
// one entry: the highest round the crew reached is the main race, the earlier rounds hang under it
// as `preliminaries`. Whether that event was won is decided here too, from data that is complete
// up front, so the page never depends on which race details happen to have been loaded.
// Only what the page shows goes out: the round type, match and day ids and the lane serve the
// grouping and the win rule here and are left out of the answer.

const BASE = 'https://api.foys.io/tournament/public/api/v1';

// Round types by how far into an event they come. Race names are free text in foys; seen in real
// data: "A-finale", "B-finale", "voorwedstrijd 3", "time-trial", "time-trial 1", and single-race
// events named after the distance or the event ("4500 meter", "PEiL").
export function classifyRace(raceName) {
  const name = String(raceName ?? '').trim().toLowerCase();
  if (/halve|semi/.test(name)) return { type: 'semi', rank: 70 };
  if (/kwart|quarter/.test(name)) return { type: 'quarter', rank: 60 };
  if (/herkansing|repechage/.test(name)) return { type: 'repechage', rank: 50 };
  if (/voorwedstrijd|voorrace|\bheat|\bserie/.test(name)) return { type: 'heat', rank: 40 };
  // "Kleine finale" is the Dutch name for the B-final.
  if (/kleine[\s-]?finale/.test(name)) return { type: 'final', rank: 99, final: 'B' };
  const lettered = name.match(/^([a-h])[\s-]?final[e]?\b/) || name.match(/\bfinal[e]?[\s-]([a-h])\b/) || name.match(/^f([a-h])$/);
  if (lettered) {
    const index = lettered[1].charCodeAt(0) - 97;
    return { type: 'final', rank: 100 - index, final: lettered[1].toUpperCase() };
  }
  if (/\bfinal[e]?\b/.test(name)) return { type: 'final', rank: 100, final: 'A' };
  if (/time[\s-]?trial|tijd[\s-]?(race|rit)/.test(name)) return { type: 'timetrial', rank: 30 };
  return { type: 'other', rank: 20 };
}

// An event is won when the crew finished first in the race that decided it: an A-final (or a
// plain "Finale"), or a race after which nothing followed that is not itself a heat, repechage,
// quarter- or semi-final (a time trial or a head race such as "4500 meter"). First place in a
// heat whose final is missing, or in a B-final, is not a win.
export function isWin(mainRace, round = classifyRace(mainRace.raceName)) {
  if (Number(mainRace.position) !== 1) return false;
  const { type, final } = round;
  if (type === 'final') return final === 'A';
  return type === 'timetrial' || type === 'other';
}

const trim = (value) => (typeof value === 'string' ? value.trim() : value);
const positive = (value) => (Number(value) > 0 ? Number(value) : null);

function raceEntry(result) {
  return {
    raceId: result.raceId,
    tournamentId: result.tournamentId,
    matchCode: trim(result.matchCode) ?? '',
    matchName: trim(result.matchName) ?? '',
    raceName: trim(result.raceName) ?? '',
    teamName: trim(result.teamName) ?? '',
    position: positive(result.position),
    endTime: positive(result.endTime),
  };
}

export function groupTournament(tournament) {
  const groups = new Map();
  const results = Array.isArray(tournament.raceResults) ? tournament.raceResults : [];
  for (const result of results) {
    if (!result || result.raceId == null) continue;
    // One event per crew: a coach with two crews in the same match gets two entries.
    const key = `${result.matchId ?? trim(result.matchCode)}|${trim(result.teamName) ?? ''}`;
    if (!groups.has(key)) groups.set(key, []);
    const races = groups.get(key);
    // The same race twice for the same crew adds nothing.
    if (!races.some((r) => r.race.raceId === result.raceId)) {
      races.push({ race: raceEntry(result), round: classifyRace(result.raceName) });
    }
  }

  const events = [];
  for (const races of groups.values()) {
    // Highest round first; equal rounds keep foys' order. The rest are the earlier rounds.
    const ordered = races
      .map((item, index) => ({ ...item, index }))
      .sort((a, b) => b.round.rank - a.round.rank || a.index - b.index);
    const [main, ...preliminaries] = ordered;
    events.push({ ...main.race, won: isWin(main.race, main.round), preliminaries: preliminaries.map((p) => p.race) });
  }

  const tournamentId = events[0]?.tournamentId ?? null;
  return {
    tournamentId,
    tournamentName: trim(tournament.tournamentName) ?? '',
    firstTournamentDate: tournament.firstTournamentDate ?? null,
    lastTournamentDate: tournament.lastTournamentDate ?? tournament.firstTournamentDate ?? null,
    races: events,
  };
}

export function buildPerson(info, overview) {
  const tournaments = (Array.isArray(overview) ? overview : [])
    .map(groupTournament)
    .filter((t) => t.races.length > 0)
    // Newest first, as foys does, but explicitly: a stable sort on the start date.
    .sort((a, b) => String(b.firstTournamentDate ?? '').localeCompare(String(a.firstTournamentDate ?? '')));

  let wins = 0;
  for (const tournament of tournaments) {
    for (const event of tournament.races) if (event.won) wins++;
  }

  return {
    personId: info.personId,
    fullName: trim(info.fullName) ?? '',
    // foys fills one of the two, depending on how the membership was registered.
    club: trim(info.organisationName) || trim(info.clubNames) || null,
    yearOfBirth: positive(info.yearOfBirth),
    totalScullingPoints: Number(info.totalScullingPoints) || 0,
    totalSweepingPoints: Number(info.totalSweepingPoints) || 0,
    stats: { wins },
    tournaments,
  };
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

  const [info, overview] = await Promise.allSettled([
    upstream(`${BASE}/persons/${encodeURIComponent(id)}`),
    upstream(`${BASE}/races/person-overview-results/${encodeURIComponent(id)}`),
  ]);

  if (info.status === 'rejected' || !info.value?.personId) {
    // foys answers an unknown id with a 500 on /persons and an empty list of results.
    const unknown = overview.status === 'fulfilled' && Array.isArray(overview.value) && overview.value.length === 0;
    if (unknown) return notFound(event);
    return upstreamFailure(event, info.status === 'rejected' ? info.reason : overview.reason);
  }
  if (overview.status === 'rejected' || !Array.isArray(overview.value)) {
    return upstreamFailure(event, overview.reason);
  }

  // Results of finished races hardly change: the browser may keep them for five minutes.
  setResponseHeader(event, 'Cache-Control', 'private, max-age=300');
  return buildPerson(info.value, overview.value);
});
