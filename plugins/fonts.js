// Preload the logo font (4 kB: only the letters of "Roeiblik" and the digits of an error code), so
// the logo is drawn in its own font from the first frame or very soon after; without the preload
// the browser only finds it after the stylesheet, and on a slow phone the logo stayed empty until
// 2.0-2.9 s instead of 1.4-1.9 s. The import gives the same hashed /_nuxt/ URL as the @font-face
// rule in assets/style/app.scss.
//
// Mulish, the text font, is deliberately not preloaded: on a slow phone that preload competed with
// the stylesheet and delayed the first paint by about 0.25 s, while the fallback ('Mulish
// fallback', same proportions) already shows the text in its final place.
import racingLogo from '~/assets/fonts/racing-sans-one-logo.woff2?url';

export default defineNuxtPlugin(() => {
  useHead({
    link: [{
      rel: 'preload',
      as: 'font',
      type: 'font/woff2',
      href: racingLogo,
      crossorigin: 'anonymous',
      tagPriority: 'high',
    }],
  });
});
