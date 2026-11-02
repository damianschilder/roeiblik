// The crew of one Time-Team entry, for a race whose crew the person route did not look up (only
// people with a long history; see LOOKUP_BUDGET in person.js). Called when the visitor opens it.
//   /api/time-team/entry?regatta=<regatta id>&id=<entry id>&person=<person id>
// Answers { crew, role } with the same crew shape as the person route: hidden people left out.
// 404 for an unknown entry and for a hidden person alike.
import { roleInCrew, shapeCrew } from './person.js';

export default defineEventHandler(async (event) => {
  const regatta = queryString(event, 'regatta');
  const id = queryString(event, 'id');
  const person = queryString(event, 'person');

  if (!validId(regatta) || !validId(id) || !validId(person)) {
    return invalid(event, 'The regatta, id and person parameters are required');
  }
  if (isBlocked(event, person)) {
    return notFound(event);
  }

  let answer;
  try {
    answer = await upstream(`https://api.beta.regatta.time-team.nl/api/1/${encodeURIComponent(regatta)}/entry/${encodeURIComponent(id)}`);
  } catch (error) {
    return error?.statusCode === 404 ? notFound(event) : upstreamFailure(event, error);
  }
  const entry = answer?.entry?.[id];
  const crew = shapeCrew(entry, person, (personId) => Boolean(personId) && isBlocked(event, personId));
  if (!crew) {
    return notFound(event);
  }

  setResponseHeader(event, 'Cache-Control', 'private, max-age=300');
  const role = roleInCrew(entry, person, '');
  return { crew, ...(role ? { role } : {}) };
});
