<template lang="pug">
  .component-wrapper
    .element-wrapper
      .element-body
        h1 Zoek naar roeiers, stuurtjes, coaches binnen de KNRB.
        .search(:class="{ 'searchable': searchQuery && searchQuery.length > 0 }")
          input(placeholder="Naam..." v-model="searchQuery" @input="sanitizeInput" @keyup.enter="searchRowers()")
          UiLoader.loading(v-if="loading")
          nuxt-icon(v-else name="search" @click="searchRowers()")
        //- .error(v-if="rowerStore.error") Te veel verzoeken achter elkaar of time-team is niet beschikbaar.
        //- .empty(v-if="empty") Helaas, geen resultaten.
        //- .results(:class="{ 'loading-results': loading }" v-if="rowerStore && !rowerStore.error && paginatedResults.length > 0")
        .results(:class="{ 'loading-results': loading }" v-if="paginatedResults.length > 0")
          .headers
            .name
              span Naam
            span.id ID
          .result(v-for="person, index in paginatedResults" :key="person.personId" :class="{ 'current-rower': person.personId === KNRBStore.person.personId }" @click="selectRower(person.personId, ((currentPage -1 ) * resultsPerPage) + index)")
            span {{ person.fullName }}
            span.id {{ person.personId }}
          .pagination(v-if="KNRBStore.results.length > resultsPerPage")
            button(@click="prevPage" :disabled="currentPage === 1") Previous
            span {{ (currentPage - 1) * resultsPerPage + 1 }}-{{ Math.min(currentPage * resultsPerPage, KNRBStore.results.length) }} of {{ KNRBStore.results.length }} {{ KNRBStore.results.length === 1 ? 'result' : 'results' }}
            button(@click="nextPage" :disabled="currentPage === totalPages") Next
  </template> 
  
  <script setup lang="ts">
  const KNRBStore = useKNRBStore();
  // const runtimeConfig = useRuntimeConfig()
  const router = useRouter();
  
  const searchQuery = ref<string>('');
  const loading = ref<Boolean>(false);
  const error = ref<Boolean>(false);
  const empty = ref<Boolean>(false);
  const hover = ref<Boolean>(false);
  
  // // Pagination state
  const currentPage = ref<number>(1);
  const resultsPerPage = 10;
  
  function sanitizeInput() {
    searchQuery.value = searchQuery.value.replace(/[^a-zA-Z0-9 \-]/g, "");
  }
  
  async function searchRowers() {
    if (searchQuery.value) {
      loading.value = true;
      try {
        await KNRBStore.search(searchQuery.value);
      } catch (e) {
        error.value = true;
      } finally {
        KNRBStore.results = KNRBStore.results.sort((a, b) => {
          if (a.fullName.toLowerCase() < b.fullName.toLowerCase()) return -1;
          if (a.fullName.toLowerCase() > b.fullName.toLowerCase()) return 1;
          return a.personId.localeCompare(b.personId);
        });
        if (KNRBStore.results.length === 0) {
          empty.value = true;
        } else {
          empty.value = false;
        }
        currentPage.value = 1;
      }
    }
    loading.value = false;
  }
  
  function selectRower(personId: string, index: number) {
    if (!(personId === KNRBStore.person?.personId)) KNRBStore.getRower(personId);
    router.push({ name: 'KNRB-persoon-id', params: { id: KNRBStore.results[index].personId } });
  }
  
  // // Computed properties for pagination
  const totalPages = computed(() => Math.ceil(KNRBStore.results.length / resultsPerPage));

  const paginatedResults = computed((): PersonResult[] => {
    const start = (currentPage.value - 1) * resultsPerPage;
    const end = start + resultsPerPage;
    return KNRBStore.results.slice(start, end);
  });
  
  function nextPage(): void {
    if (currentPage.value < totalPages.value) {
      currentPage.value++;
    }
  }
  
  function prevPage(): void {
    if (currentPage.value > 1) {
      currentPage.value--;
    }
  }
  
  onMounted(() => {
    currentPage.value = KNRBStore.currentPage || 1;
  });
  
  onBeforeUnmount(() => {
    KNRBStore.currentPage = currentPage.value;
  });
  </script>
  
  <style lang="scss" scoped>
  .component-wrapper {
    /* align-self: center; */
  }
  
  .element-body {
    display: flex;
    /* align-self: center; */
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
      >:deep(.nuxt-icon svg) {
        position: absolute;
        height: fit-content;
        margin-bottom: 0;
        width: 1.8rem;
        right: 0;
        top: 0;
        color: $black50;
      }
      > .loading {
        position: absolute;
        top: 3px;
        right: 6px;
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
      .id {
      }
    }
    @include mobile {
      width: 100%;
      .id {
        // display: none;
      }
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
        & .help {
          text-align: left;
          display: flex;
          width: 20rem;
          row-gap: 0.25rem;
          font-weight: normal;
          color: black;
          flex-direction: column;
          @include mobile {
            width: 13rem;
          }
          >:first-child {
            font-weight: bold;
            color: $neutral50;
          }
        }
      }
      @include tablet-small {
        .id {
          display: none;
        }
      }
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
      }
      span {
        color: $black50;
        font-size: 0.9rem;
      }
    }
  }
  
  .help {
    text-align: left;
    display: flex;
    width: 20rem;
    row-gap: 0.25rem;
    font-weight: normal;
    color: black;
    flex-direction: column;
    .link {
      text-align: left;
    }
    @include mobile {
      width: 13rem;
    }
    >:first-child {
      font-weight: bold;
      color: $neutral50;
    }
  }

.current-rower {
  background-color: $red5!important;
}

.searchable {
  &:deep(.nuxt-icon svg) {
    cursor: pointer;
    color: $red!important;
  }
}
</style>
  