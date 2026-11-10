// "<page title> · Roeiblik" in the browser tab. A title that already starts with "Roeiblik" (the
// homepage's) stays as it is, and a page without a title yet shows just "Roeiblik". A plugin
// rather than app.vue, so it also holds for the error page (error.vue).
export default defineNuxtPlugin(() => {
  useHead({
    titleTemplate: (title) => {
      if (!title) return 'Roeiblik';
      return title.startsWith('Roeiblik') ? title : `${title} · Roeiblik`;
    },
  });
});
