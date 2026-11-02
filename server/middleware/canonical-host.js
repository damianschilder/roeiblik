// Roeiblik lives on one address. When NUXT_CANONICAL_HOST is set (the Worker config sets it to
// roeiblik.com), any other host name that reaches the Worker, such as www.roeiblik.com, gets a
// permanent redirect to that host. Local development is left alone.
//
// The redirect also corrects the path (old capitalised sections, see server/utils/address.js), so
// www plus an old address is still a single hop.
export default defineEventHandler((event) => {
  const target = redirectTarget(event);
  if (target?.hostChanged) return sendRedirect(event, target.location, target.status);
});
