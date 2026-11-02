// Old addresses (/Time-Team, /KNRB, /api/Time-Team, /api/KNRB, in any casing, and the removed
// statistics page) go to the lowercase ones in one hop. See server/utils/address.js.
export default defineEventHandler((event) => {
  const target = redirectTarget(event);
  if (target) return sendRedirect(event, target.location, target.status);
});
