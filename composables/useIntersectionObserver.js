// composables/useIntersectionObserver.js
import { ref } from 'vue';

export function useIntersectionObserver() {
  const isIntersecting = ref(false);

  const observe = (target, options = {}) => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
      } else {
      }
      isIntersecting.value = entry.isIntersecting;
    }, options);

    if (target) observer.observe(target);

    return () => {
      console.log('Observer disconnected.');
      observer.disconnect();
    };
  };

  return { isIntersecting, observe };
}
