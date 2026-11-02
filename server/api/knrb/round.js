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
  const personId = m.personId ?? m.person?.personId ?? null;
  const role = {
    boatPosition: positive(m.boatPosition),
    isCox: Boolean(m.isCox),
    isCoach: Boolean(m.isCoach),
    isStroke: Boolean(m.isStroke),
  };
  if (!personId || isBlocked(event, personId)) {
    return { ...role, personId: null, fullName: null, hidden: true };
  }
  return { ...role, personId: String(personId), fullName: trim(m.fullName ?? m.person?.fullName) ?? '', hidden: false };
}

function team(event, t) {
  const matchTeam = t.teamVersion?.matchTeam ?? {};
  const members = Array.isArray(t.teamVersion?.teamMembers) ? t.teamVersion.teamMembers : [];
  return {
    id: t.teamVersionId ?? matchTeam.matchRegistrationId ?? null,
    name: trim(matchTeam.name) || trim(matchTeam.teamFullName) || trim(matchTeam.organisationName) || '',
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
