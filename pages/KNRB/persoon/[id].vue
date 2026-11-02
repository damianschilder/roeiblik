<template lang="pug">
.page-wrapper
  KNRBPersoonHeader(v-if="person" :person="person")
  .loader-container(v-if="status === 'loading'" role="status")
    UiLoader(aria-hidden="true")
    span Dit kan een paar seconden duren.
  .message(v-else-if="status === 'notfound'" role="alert")
    p Deze persoon is niet (meer) te vinden.
    NuxtLink.link(to="/KNRB") Terug naar zoeken
  .message(v-else-if="status === 'error'" role="alert")
    p De gegevens van de KNRB zijn nu niet bereikbaar.
    button.link(type="button" @click="load(true)") Opnieuw proberen
  KNRBPersoonTournamentsOverview(v-if="person" :person="person")
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useKNRBStore } from '~/stores/knrb';

const route = useRoute();
const KNRBStore = useKNRBStore();

const id = computed(() => String(route.params.id ?? ''));

// Only the person this page is about: never the previous one while the next one loads.
const person = computed(() => (KNRBStore.person?.personId === id.value ? KNRBStore.person : null));
// Until this page's own request has started, show the loader rather than an older outcome.
const status = computed(() => (KNRBStore.personId === id.value ? KNRBStore.personStatus : 'loading'));

useHead({
  title: computed(() => person.value?.fullName || 'KNRB-uitslagen'),
  // Other people's names and results: findable on Roeiblik, not via search engines.
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
});

function load(force = false) {
  KNRBStore.loadPerson(id.value, { force });
}

// Loaded in the browser (as before), also when a lineup link leads to another person. The watch
// skips the moment of leaving the page, when the route already has no id.
onMounted(() => load());
watch(id, () => {
  if (route.params.id) load();
});
</script>

<style lang="scss" scoped>
.page-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.loader-container {
  display: flex;
  justify-content: center;
  flex-direction: column;
  height: 100%;
  max-width: 95%;
  text-align: center;
  &:deep(.component-wrapper) {
    display: flex;
    justify-content: center;
  }
  &:deep(.loader) {
    align-self: center;
    width: 2rem;
    height: 2rem;
    border: 4px solid rgba(230, 0, 0, 0.03); /* Light grey */
    border-top: 4px solid $seed;; /* Blue */
  }
  span {
    margin-top: 0.5rem;
    font-weight: bold;
  }
}

.message {
  display: flex;
  flex-direction: column;
  align-items: center;
  row-gap: 0.75rem;
  justify-content: center;
  height: 100%;
  text-align: center;
  font-weight: bold;
  .link {
    font: inherit;
    font-weight: normal;
    color: $black70;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-decoration: underline;
    &:hover {
      color: $black;
    }
    &:focus-visible {
      outline: 2px solid $red;
      outline-offset: 2px;
    }
  }
}
</style>
