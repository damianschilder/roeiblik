// composables/useIntersectionObserver.js
import { ref } from 'vue';

// isIntersecting follows whether the observed element is on screen. observe() returns a function
// that stops observing. Without IntersectionObserver (server rendering, very old browsers) the
// element counts as visible, so nothing that waits for it stays hidden.
export function useIntersectionObserver() {
  const isIntersecting = ref(false);

  const observe = (target, options = {}) => {
    if (typeof IntersectionObserver === 'undefined') {
      isIntersecting.value = true;
      return () => {};
    }

    const observer = new IntersectionObserver(([entry]) => {
      isIntersecting.value = entry.isIntersecting;
    }, options);

    if (target) observer.observe(target);

    return () => observer.disconnect();
  };

  return { isIntersecting, observe };
}
