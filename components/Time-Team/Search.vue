<template lang="pug">
  .component-wrapper
    .element-wrapper
      .element-body
        h1 Zoek naar comporoeiers, wedstrijdroeiers, stuurtjes en coaches binnen Time-Team.
        form.search(role="search" :class="{ 'searchable': rowerStore.searchInput.length > 0 }" @submit.prevent="submit")
          input(
            v-model="rowerStore.searchInput"
            type="text"
            placeholder="Naam..."
            aria-label="Naam om te zoeken in Time-Team"
            autocomplete="off"
            spellcheck="false"
            enterkeyhint="search"
            maxlength="100"
          )
          button.search-button(type="submit" aria-label="Zoeken" :aria-busy="loading ? 'true' : 'false'")
            UiLoader.loading(v-if="slow")
            nuxt-icon(v-else name="search" aria-hidden="true")
        .status(role="status" aria-live="polite" :class="{ 'visually-hidden': !statusVisible }") {{ statusText }}
        .results(:class="{ 'loading-results': slow }" v-if="paginatedResults.length > 0")
          .headers(aria-hidden="true")
            .name
              span Naam
            span.id ID
          ul.result-list
            li(v-for="rower in paginatedResults" :key="rower.id")
              NuxtLink.result(
                :to="`/time-team/persoon/${rower.id}`"
                :class="{ 'current-rower': rower.id === rowerStore.rower?.person.id }"
              )
                span {{ rower.displayname }}
                span.id {{ rower.id }}
          nav.pagination(v-if="total > resultsPerPage" aria-label="Pagina's met resultaten")
            button(type="button" @click="prevPage" :disabled="currentPage === 1") Vorige
            span {{ (currentPage - 1) * resultsPerPage + 1 }}-{{ Math.min(currentPage * resultsPerPage, total) }} van {{ total }} {{ total === 1 ? 'resultaat' : 'resultaten' }}
            button(type="button" @click="nextPage" :disabled="currentPage === totalPages") Volgende
  </template>

  <script setup lang="ts">
  import { apiErrorText } from '~/composables/apiError';

  const rowerStore = useRowersStore();

  const resultsPerPage = 10;

  const loading = computed(() => rowerStore.searchStatus === 'loading');
  // The spinner and the dimmed list only for a search that takes longer than 200 ms; aria-busy
  // and the status line follow `loading` at once.
  const slow = useDelayedFlag(() => loading.value);
  const total = computed(() => rowerStore.results.length);
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / resultsPerPage)));
  // The page lives in the store, so Back from a person returns to the same page of results.
  const currentPage = computed(() => Math.min(rowerStore.storeCurrentPage, totalPages.value));
  const paginatedResults = computed(() => {
    const start = (currentPage.value - 1) * resultsPerPage;
    return rowerStore.results.slice(start, start + resultsPerPage);
  });

  // One status line for screen readers; the same line shows the messages sighted visitors need.
  const statusText = computed(() => {
    switch (rowerStore.searchStatus) {
      case 'loading': return 'Zoeken…';
      case 'tooShort': return 'Typ minstens 2 tekens.';
      case 'error': return apiErrorText(rowerStore.searchError, 'Time-Team');
      case 'done': return total.value === 0
        ? 'Helaas, geen resultaten.'
        : `${total.value} ${total.value === 1 ? 'resultaat' : 'resultaten'}`;
      default: return '';
    }
  });
  const statusVisible = computed(() =>
    ['tooShort', 'error'].includes(rowerStore.searchStatus) || (rowerStore.searchStatus === 'done' && total.value === 0));

  function submit() {
    rowerStore.searchRowers(rowerStore.searchInput);
  }

  function nextPage() {
    if (currentPage.value < totalPages.value) rowerStore.storeCurrentPage = currentPage.value + 1;
  }

  function prevPage() {
    if (currentPage.value > 1) rowerStore.storeCurrentPage = currentPage.value - 1;
  }
  </script>

  <style lang="scss" scoped>
  .element-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    h1 {
      text-align: center;
      margin-bottom: 4rem;
      @include mobile {
        margin-top: 5rem;
      }
    }
    .search {
      position: relative;
      display: flex;
      justify-content: center;
      margin-bottom: 2rem;

      > input {
        border-bottom: 1px solid $red;
        width: 30rem;
        font-size: 1.5rem;
        text-align: center;
        margin-bottom: 1px;
        @include mobile {
          width: 100%;
        }
        &:focus {
          border-bottom: 2px solid $red;
          margin-bottom: initial;
        }
      }
      > .search-button {
        position: absolute;
        right: 0;
        top: 0;
        display: flex;
        padding: 0;
        margin: 0;
        border: none;
        border-radius: 4px;
        background: none;
        color: $black50;
        cursor: pointer;
        &:focus-visible {
          outline: 2px solid $red;
          outline-offset: 2px;
        }
        :deep(.nuxt-icon svg) {
          height: fit-content;
          margin-bottom: 0;
          width: 1.8rem;
          color: $black50;
        }
        > .loading {
          margin: 3px 6px 0 0;
        }
      }
    }
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }

  .results {
    display: flex;
    flex-direction: column;
    justify-content: center;
    opacity: 1;
    transition: opacity 0.3s ease;
    width: 62%;
    @include tablet-small {
      width: 100%;
    }
    &.loading-results {
      opacity: 0.5;
      pointer-events: none;
    }
    .headers {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      font-weight: bold;
      padding: 0 0.5rem;
      background-color: initial;
      opacity: 0.5;
      .name {
        display: flex;
        column-gap: 0.1rem;
      }
      @include tablet-small {
        .id {
          display: none;
        }
      }
    }
    .result-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .result {
      font-size: 1.1rem;
      display: flex;
      justify-content: space-between;
      padding: 0.3rem 0.5rem;
      border-radius: 5px;
      column-gap: 6rem;
      cursor: pointer;
      white-space: nowrap;
      color: inherit;
      text-decoration: none;
      .id {
        font-size: 0.95rem;
        opacity: 0.5;
      }
      @include tablet-small {
        flex-direction: column;
        text-align: left;
        .id {
          font-size: 0.8rem;
          color: $black50;
        }
      }
      &:hover {
        background-color: $red25;
        border-radius: 0.25rem;
      }
      &:focus-visible {
        background-color: $red25;
        border-radius: 0.25rem;
        outline: 2px solid $red;
        outline-offset: 0;
      }
    }
    .pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: initial;
      margin-top: 1rem;
      button {
        font-family: $font-text;
        background: $red50;
        border: none;
        border-radius: 5px;
        padding: 0.25rem 0.5rem;
        cursor: pointer;
        font-weight: bold;
        color: $black50;
        &:disabled {
          cursor: initial;
          color: $black20;
        }
        &:focus-visible {
          outline: 2px solid $red;
          outline-offset: 2px;
        }
      }
      span {
        color: $black50;
        font-size: 0.9rem;
      }
    }
  }

.current-rower {
  background-color: $red5!important;
}

// Red once there is something to search for, as before; more specific than the grey default above.
.element-body .search.searchable > .search-button :deep(.nuxt-icon svg) {
  color: $red;
}
</style>
