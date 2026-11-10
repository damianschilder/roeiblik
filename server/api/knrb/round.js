// One race with every crew in it: times per distance, status, lineup.
//
// foys sends each crew member twice (flat and as a nested `person`), the full match definition and
// empty registration lists; a time trial of 23 crews is 87 kB. Only what the page shows goes out,
// and people who asked not to be shown (NUXT_BLOCKED_PERSON_IDS) lose their name and id here, so
// they cannot turn up in someone else's lineup, as stroke, or as a link.

const BASE = 'https://api.foys.io/tournament/public/api/v1';

const trim = (value) => (typeof value === 'string' ? value.trim() : value);
const positive = (value) => (Number(value) > 0 ? Number(value) : null);

function member(event, m) {
  const id = personId(m);
  const role = {
    boatPosition: positive(m.boatPosition),
    isCox: Boolean(m.isCox),
    isCoach: Boolean(m.isCoach),
    isStroke: Boolean(m.isStroke),
  };
  if (!id || isBlocked(event, id)) {
    return { ...role, personId: null, fullName: null, hidden: true };
  }
  return { ...role, personId: String(id), fullName: trim(m.fullName ?? m.person?.fullName) ?? '', hidden: false };
}

// Names are compared without case, accents, punctuation or extra spaces. The same function as
// normalName in ../time-team/person.js, copied rather than imported so this route does not pull in
// that one.
function normalName(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const personId = (m) => m?.personId ?? m?.person?.personId ?? null;

// A single sculler's crew is often named after them. When the crew's name is the name of a member
// who asked not to be shown, the club's name stands in for it, or nothing if there is none.
// Word order does not count either, so "Jöbsis, Anne" is "Anne Jobsis".
const nameKey = (value) => normalName(value).split(' ').sort().join(' ');

function teamName(event, matchTeam, members) {
  const name = trim(matchTeam.name) || trim(matchTeam.teamFullName) || trim(matchTeam.organisationName) || '';
  const hiddenNames = new Set(members
    .filter((m) => isBlocked(event, personId(m)))
    .map((m) => nameKey(m.fullName ?? m.person?.fullName))
    .filter(Boolean));
  if (!hiddenNames.size || !hiddenNames.has(nameKey(name))) return name;
  const club = trim(matchTeam.organisationName) || '';
  return hiddenNames.has(nameKey(club)) ? '' : club;
}

function team(event, t) {
  const matchTeam = t.teamVersion?.matchTeam ?? {};
  const members = Array.isArray(t.teamVersion?.teamMembers) ? t.teamVersion.teamMembers : [];
  return {
    id: t.teamVersionId ?? matchTeam.matchRegistrationId ?? null,
    name: teamName(event, matchTeam, members),
    lane: positive(t.lane),
    position: positive(t.endPosition),
    // A corrected time (after a penalty or a bonus) replaces the measured one.
    time: positive(t.correctedEndTime) ?? positive(t.endTime),
    didNotStart: Boolean(t.didNotStart),
    didNotFinish: Boolean(t.didNotFinish),
    times: (Array.isArray(t.raceTeamTimes) ? t.raceTeamTimes : [])
      .filter((x) => Number(x?.distance) > 0)
      .map((x) => ({
        distance: Number(x.distance),
        time: positive(x.correctedTime) ?? positive(x.time),
      }))
      .sort((a, b) => a.distance - b.distance),
    members: members.map((m) => member(event, m)),
  };
}

// Finishers by position; crews without a position (did not start or finish) at the end.
function byResult(a, b) {
  return (a.position ?? Infinity) - (b.position ?? Infinity) || (a.lane ?? Infinity) - (b.lane ?? Infinity);
}

// Only what the page shows: the race's name and distance, and per crew its place, times and lineup.
export function buildRound(event, race) {
  return {
    raceId: race.id,
    name: trim(race.name) ?? '',
    distance: positive(race.distance),
    teams: (Array.isArray(race.raceTeams) ? race.raceTeams : []).map((t) => team(event, t)).sort(byResult),
  };
}

export default defineEventHandler(async (event) => {
  const tournamentId = queryString(event, 'tournamentId');
  const raceId = queryString(event, 'raceId');

  if (!validNumber(tournamentId) || !validNumber(raceId)) {
    return invalid(event, 'Both tournamentId and raceId parameters are required');
  }

  let races;
  try {
    races = await upstream(`${BASE}/races?tournamentId=${tournamentId}&raceId=${raceId}`);
  } catch (error) {
    return error?.statusCode === 404 ? notFound(event) : upstreamFailure(event, error);
  }
  // Only the race that was asked for; never another race of the tournament.
  const race = Array.isArray(races) ? races.find((r) => String(r?.id) === raceId) : null;
  if (!race) {
    return notFound(event);
  }

  setResponseHeader(event, 'Cache-Control', 'private, max-age=300');
  return buildRound(event, race);
});
