import { onBeforeUnmount, ref, watch, type Ref } from "vue";

// True once `source` has been true for `delay` ms, false again as soon as it turns false. A loader
// shown with this does not flash for an answer that is back within the delay (measured with a
// fast upstream: the person loader showed for 60-70 ms, the search spinner for 25-35 ms).
// On the server and while the page hydrates it simply follows the source, so a loader rendered on
// the server stays put instead of disappearing and coming back.
export function useDelayedFlag(source: () => boolean, delay = 200): Ref<boolean> {
  if (import.meta.server) return ref(source());
  const shown = ref(useNuxtApp().isHydrating ? source() : false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  watch(
    source,
    (on) => {
      clearTimeout(timer);
      if (!on) {
        shown.value = false;
      } else if (!shown.value) {
        timer = setTimeout(() => {
          shown.value = true;
        }, delay);
      }
    },
    { immediate: true },
  );
  onBeforeUnmount(() => clearTimeout(timer));
  return shown;
}
