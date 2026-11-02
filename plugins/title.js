// "<page title> · Roeiblik" in the browser tab; just "Roeiblik" on the homepage or while a page has
// no title yet. A plugin rather than app.vue, so it also holds for the error page (error.vue).
export default defineNuxtPlugin(() => {
  useHead({
    titleTemplate: (title) => (title && title !== 'Roeiblik' ? `${title} · Roeiblik` : 'Roeiblik'),
  });
});
