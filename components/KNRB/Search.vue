<template lang="pug">
  .component-wrapper
    .element-wrapper
      .element-body
        h1 Zoek naar roeiers, stuurtjes, coaches binnen de KNRB.
        form.search(role="search" :class="{ 'searchable': searchQuery.length > 0 }" @submit.prevent="submit")
          label.sr-only(for="knrb-search") Naam van een roeier, stuur of coach
          input#knrb-search(
            v-model="searchQuery"
            type="text"
            placeholder="Naam..."
            autocomplete="off"
            spellcheck="false"
            enterkeyhint="search"
            maxlength="100"
            aria-describedby="knrb-search-status"
            @input="sanitizeInput"
            @keydown.esc="clear"
          )
          //- The button stays while searching (keyboard focus stays on it); only its icon changes.
          button.search-button(type="submit" aria-label="Zoeken" :aria-busy="loading ? 'true' : 'false'" :class="{ busy: loading }")
            UiLoader.loading(v-if="loading" aria-hidden="true")
            nuxt-icon(v-else name="search" aria-hidden="true")
        //- One status line, as on the Time-Team search: screen readers hear every state, sighted
        //- visitors see only the messages they need ("Zoeken…" and the count stay hidden).
        .status#knrb-search-status(role="status" aria-live="polite" :class="{ 'sr-only': !statusVisible }") {{ announcement }}
        .results(:class="{ 'loading-results': loading }" v-if="paginatedResults.length > 0" :aria-busy="loading ? 'true' : 'false'")
          .headers(aria-hidden="true")
            .name
              span Naam
            span.id ID
          ul.result-list
            li(v-for="person in paginatedResults" :key="person.personId")
              NuxtLink.result(
                :to="`/knrb/persoon/${person.personId}`"
                :class="{ 'current-rower': person.personId === KNRBStore.personId }"
              )
                span.name
                  | {{ person.fullName }}
                  span.club(v-if="person.clubName") {{ person.clubName }}
                span.id {{ person.personId }}
          nav.pagination(v-if="KNRBStore.results.length > resultsPerPage" aria-label="Pagina's met resultaten")
            button(type="button" @click="prevPage" :disabled="currentPage === 1") Vorige
            span {{ (currentPage - 1) * resultsPerPage + 1 }}-{{ Math.min(currentPage * resultsPerPage, KNRBStore.results.length) }} van {{ KNRBStore.results.length }} {{ KNRBStore.results.length === 1 ? 'resultaat' : 'resultaten' }}
            button(type="button" @click="nextPage" :disabled="currentPage === totalPages") Volgende
  </template>

  <script setup lang="ts">
  import { computed, ref } from 'vue';
  import type { PersonResult } from '~/types/KNRB';
  import { useKNRBStore } from '~/stores/knrb';

  const KNRBStore = useKNRBStore();

  // The last search stays in the store: back from a person page, the same list is still here.
  const searchQuery = ref<string>(KNRBStore.query);
  const tooShort = ref<boolean>(false);
  const resultsPerPage = 10;

  const loading = computed(() => KNRBStore.searchStatus === 'loading');
  const empty = computed(() => KNRBStore.searchStatus === 'done' && KNRBStore.results.length === 0);

  // Letters with accents ("Daniël"), apostrophes ("van 't Hof"), dots and hyphens are part of names:
  // foys finds "Daniël Kruk" but not "Daniel Kruk" or "Danil Kruk".
  function sanitizeInput() {
    const clean = searchQuery.value.replace(/[^\p{L}\p{M}\p{N} '’.\-]/gu, '');
    if (clean !== searchQuery.value) searchQuery.value = clean;
    tooShort.value = false;
  }

  function submit() {
    const q = searchQuery.value.trim();
    if (q.length < 2) {
      tooShort.value = q.length > 0;
      return;
    }
    KNRBStore.search(q);
  }

  function clear() {
    searchQuery.value = '';
    tooShort.value = false;
  }

  const announcement = computed(() => {
    if (tooShort.value) return 'Typ minstens 2 tekens.';
    switch (KNRBStore.searchStatus) {
      case 'loading': return 'Zoeken…';
      case 'error': return 'Te veel verzoeken achter elkaar of de KNRB is niet beschikbaar.';
      case 'done': {
        const n = KNRBStore.results.length;
        return n === 0 ? 'Helaas, geen resultaten.' : `${n} ${n === 1 ? 'resultaat' : 'resultaten'}`;
      }
      default: return '';
    }
  });
  const statusVisible = computed(() => tooShort.value || KNRBStore.searchStatus === 'error' || empty.value);

  // Pagination: the page lives in the store as well.
  const currentPage = computed({
    get: () => KNRBStore.currentPage || 1,
    set: (page: number) => { KNRBStore.currentPage = page; },
  });
  const totalPages = computed(() => Math.ceil(KNRBStore.results.length / resultsPerPage));

  const paginatedResults = computed((): PersonResult[] => {
    const start = (currentPage.value - 1) * resultsPerPage;
    return KNRBStore.results.slice(start, start + resultsPerPage);
  });

  function nextPage(): void {
    if (currentPage.value < totalPages.value) currentPage.value++;
  }

  function prevPage(): void {
    if (currentPage.value > 1) currentPage.value--;
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
        padding: 0;
        border: none;
        background: none;
        line-height: 0;
        cursor: pointer;
        border-radius: 4px;
        :deep(.nuxt-icon) {
          display: block;
        }
        :deep(svg) {
          height: fit-content;
          margin-bottom: 0;
          width: 1.8rem;
          color: $black50;
        }
        &:focus-visible {
          outline: 2px solid $red;
          outline-offset: 2px;
        }
        // Where the loader always sat: 3px from the top, 6px from the right.
        &.busy {
          padding: 3px 6px 0 0;
          cursor: progress;
        }
      }
    }
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
    @include mobile {
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
      display: flex;
      flex-direction: column;
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
      .club {
        margin-left: 0.5rem;
        font-size: 0.95rem;
        opacity: 0.5;
      }
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
      &:hover,
      &:focus-visible {
        background-color: $red25;
        border-radius: 0.25rem;
      }
      &:focus-visible {
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
        font-family: "Lato";
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

  .searchable {
    .search-button :deep(svg) {
      color: $red!important;
    }
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  </style>
