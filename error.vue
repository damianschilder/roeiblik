<template lang="pug">
NuxtLayout
  .page-wrapper
    .text
      p.code {{ statusCode }}
      h1 {{ heading }}
      p.explanation {{ explanation }}
    a.home(href="/" @click.prevent="home") Naar de startpagina
</template>

<script setup lang="ts">
import type { NuxtError } from '#app';

const props = defineProps<{ error: NuxtError }>();

const statusCode = computed(() => props.error?.statusCode || 500);
const notFound = computed(() => statusCode.value === 404);
const heading = computed(() => (notFound.value ? 'Pagina niet gevonden' : 'Er ging iets mis'));
// No technical details: an error message can contain a name or an id from the address.
const explanation = computed(() =>
  notFound.value
    ? 'Deze pagina bestaat niet (meer). Misschien is de link oud of zit er een typfout in.'
    : 'Roeiblik kon deze pagina nu niet laten zien. Probeer het over een paar minuten opnieuw.',
);

useHead({
  title: heading,
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
});

const home = () => clearError({ redirect: '/' });
</script>

<style lang="scss" scoped>
.page-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  row-gap: 3rem;
  padding: 3rem 1rem 0;
  text-align: center;
}

.text {
  display: flex;
  flex-direction: column;
  align-items: center;
  row-gap: 1rem;
}

.code {
  color: $seed;
  font-family: "Racing Sans One";
  font-size: 5.5rem;
  line-height: 1;
}

h1 {
  font-size: 2.5rem;
  @include tablet-small {
    font-size: 2rem;
  }
}

.explanation {
  max-width: 30rem;
}

// The same button as on the homepage.
.home {
  display: flex;
  align-items: center;
  font-size: 1.5rem;
  width: max-content;
  text-decoration: none;
  border: 1px solid $black20;
  background-color: $beige;
  padding: 0.75rem 1.25rem;
  filter: drop-shadow(1px 1px 0px $roeiblik);
  border-radius: 5px;
  color: black;
  &:hover {
    background-color: $roeiblik;
    color: white;
  }
}
</style>
