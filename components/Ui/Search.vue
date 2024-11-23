<template lang="pug">
.component-wrapper
  .element-wrapper
    .element-body
      h1 Zoek naar roeiers, stuurtjes, coaches binnen Time-Team.
      .search(:class="{ 'searchable': searchQuery && searchQuery.length > 0 }")
        input(placeholder="Naam..." v-model="searchQuery" @input="sanitizeInput" @keyup.enter="searchRowers()")
        UiLoader.loading(v-if="loading")
        nuxt-icon(v-else name="search" @click="searchRowers()")
      .error(v-if="rowerStore.error") Te veel verzoeken achter elkaar of time-team is niet beschikbaar.
      .empty(v-if="empty") Helaas, geen resultaten.
      .results(:class="{ 'loading-results': loading }" v-if="rowerStore && !rowerStore.error && paginatedResults.length > 0")
        .headers
          .name
            span Naam
          span.id ID
        .result(v-for="rower, index in paginatedResults" :key="rower.id" @click="selectRower(rower.id, index)")
          span {{ rower.displayname }}
          span.id {{ rower.id }}
        .pagination(v-if="rowerStore.results.length > resultsPerPage")
          button(@click="prevPage" :disabled="currentPage === 1") Previous
          span {{ (currentPage - 1) * resultsPerPage + 1 }}-{{ Math.min(currentPage * resultsPerPage, rowerStore.results.length) }} of {{ rowerStore.results.length }} {{ rowerStore.results.length === 1 ? 'result' : 'results' }}
          button(@click="nextPage" :disabled="currentPage === totalPages") Next
</template> 

<script setup lang="ts">
const rowerStore = useRowersStore();
const runtimeConfig = useRuntimeConfig()
const router = useRouter();

const searchQuery = ref<string>('');
const loading = ref<Boolean>(false);
const empty = ref<Boolean>(false);
const hover = ref<Boolean>(false);

// Pagination state
const currentPage = ref<number>(1);
const resultsPerPage = 10;

function sanitizeInput() {
  searchQuery.value = searchQuery.value.replace(/[^a-zA-Z0-9 \-]/g, "");
}

async function searchRowers() {
  loading.value = true;
  if (searchQuery.value) await rowerStore.searchRowers(searchQuery.value);
  if (rowerStore.results.length === 0) {
    empty.value = true;
  } else {
    empty.value = false;
  }
  currentPage.value = 1;
  loading.value = false;
}

function selectRower(id: Person['id'], index: number) {
  rowerStore.getRower(id, index);
  if (rowerStore.results && rowerStore.results[(currentPage.value - 1) * resultsPerPage + 1 + index] && rowerStore.results[index].id) {
    router.push({ name: 'person-id', params: { id: rowerStore.results[index].id } });
  }
}

// Computed properties for pagination
const totalPages = computed(() => Math.ceil(rowerStore.results.length / resultsPerPage));
const paginatedResults = computed(() => {
  const start = (currentPage.value - 1) * resultsPerPage;
  const end = start + resultsPerPage;
  return rowerStore.results.slice(start, end);
});

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}
</script>

<style lang="scss" scoped>
.component-wrapper {
  align-self: center;
}

.element-body {
  display: flex;
  align-self: center;
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
    margin-bottom: 2rem;

    > input {
      border-bottom: 1px solid $seed;
      width: 30rem;
      font-size: 1.5rem;
      text-align: center;
      margin-bottom: 1px;
      @include mobile {
        width: 100%;
      }
      &:focus {
        border-bottom: 2px solid $seed;
        margin-bottom: initial;
      }
    }
    >:deep(.nuxt-icon svg) {
      position: absolute;
      height: fit-content;
      margin-bottom: 0;
      width: 1.8rem;
      right: 0;
      color: $neutral-variant50;
      top: 0;
    }
    > .loading {
      position: absolute;
      top: 3px;
      right: 6px;
    }
  }
}

.searchable {
  &:deep(.nuxt-icon svg) {
    cursor: pointer;
    color: black;
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
    color: $neutral-variant50;
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
    border-radius: 10px;
    column-gap: 6rem;
    color: $neutral-variant20;
    cursor: pointer;
    white-space: nowrap;
    .id {
      font-size: 0.95rem;
      color: $neutral50
    }
    @include tablet-small {
      flex-direction: column;
      text-align: left;
      .id {
        font-size: 0.8rem;
        color: $neutral50
      }
    }
    &:hover {
      background-color: rgba(230, 0, 0, 0.03);
      border-radius: 0.25rem;
    }
  }
  .pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 1rem;
    button {
      font-family: "Lato";
      background: rgba(230, 0, 0, 0.03);
      border: none;
      border-radius: 5px;
      padding: 0.25rem 0.5rem;
      cursor: pointer;
      &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
    }
    span {
      opacity: 0.5;
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
</style>