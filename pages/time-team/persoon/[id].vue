<template lang="pug">
.page-wrapper
  Time-TeamHeader(v-if="current && rowerStore.rower?.person.displayname")
  //- While loading and the loader is not shown yet (the first 200 ms), the area stays empty.
  .loader-container(v-if="status === 'loading' && showLoader" role="status" aria-live="polite")
    UiLoader
    span Dit kan een paar seconden duren.
  .message(v-else-if="status === 'error'" role="alert")
    span {{ apiErrorText(rowerStore.personError, 'Time-Team') }}
    button(type="button" @click="retry") Opnieuw proberen
  .message(v-else-if="status === 'notFound'")
    span Deze persoon staat niet (meer) op Roeiblik.
    NuxtLink(to="/time-team") Terug naar zoeken
  Time-TeamRaces(v-else-if="status === 'done' && current")
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useRowersStore } from '@/stores/rowers';
import { apiErrorText } from '~/composables/apiError';

const rowerStore = useRowersStore();
const route = useRoute();

const id = computed(() => String(route.params.id ?? ''));
// The store may still hold the previous person for a moment: show only what belongs to this id.
const current = computed(() => rowerStore.rower?.person.id === id.value);
const status = computed(() => (rowerStore.personId === id.value && rowerStore.personStatus !== 'idle'
  ? rowerStore.personStatus
  : 'loading'));
// No loader flash for a quick answer (a person seen before, or one from the edge cache).
const showLoader = useDelayedFlag(() => status.value === 'loading');

useHead({
  title: computed(() => (current.value && rowerStore.rower?.person.displayname) || 'Time-Team'),
  // Other people's names and results: findable on Roeiblik, not via search engines.
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
});

function retry() {
  rowerStore.getRower(id.value, { force: true });
}

// Fetched in the browser: the loader shows at once instead of a blank page while Time-Team
// answers. Watching the id also covers moving from one person to another (a crew member's link).
onMounted(() => {
  watch(id, (value) => rowerStore.getRower(value), { immediate: true });
});
</script>

<style lang="scss" scoped>
.page-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.loader-container, .message {
  display: flex;
  justify-content: center;
  flex-direction: column;
  height: 100%;
  text-align: center;
  &:deep(.component-wrapper) {
    display: flex;
    justify-content: center;
  }
  &:deep(.loader) {
    align-self: center;
    width: 2rem;
    height: 2rem;
    border: 4px solid rgba(230, 0, 0, 0.03);
    border-top: 4px solid $seed;
  }
  span {
    margin-top: 0.5rem;
    font-weight: bold;
  }
}

.message {
  align-items: center;
  row-gap: 1rem;
  padding: 3rem 1rem 0;
  button, a {
    font: bold 1rem $font-text;
    background: $red50;
    border: none;
    border-radius: 5px;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    color: $black50;
    text-decoration: none;
    &:focus-visible {
      outline: 2px solid $red;
      outline-offset: 2px;
    }
  }
}
</style>
