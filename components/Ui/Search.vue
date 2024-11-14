<template lang="pug">
.component-wrapper 
  .element-wrapper
    .element-body
      h1 Search for rowers
      //- UiInfo( @mouseenter="hover(true)" @mouseleave="hover(false)" )
      .search( :class="{ 'searchable': searchQuery && searchQuery.length > 0 }" )
        input(placeholder="Name..." v-model="searchQuery" @keyup.enter="searchRowers()")
        UiLoader.loading( v-if="loading")
        nuxt-icon( v-else name="search"   @click="searchRowers()")
      .error( v-if="rowerStore.error") Can't connect to databank. Please try again later.
      .results( v-if="rowerStore && !rowerStore.error && rowerStore.results.length > 0" )
        .headers
          span Name
          span Id
        .result( v-for="rower in rowerStore.results" @click="getRower(rower.id)")
          span {{ rower.displayname}}
          span {{rower.id}}
  </template>

<script setup lang="ts">
const rowerStore = useRowersStore();
const runtimeConfig = useRuntimeConfig()

const searchQuery = ref<string>('');

const loading = ref<Boolean>(false);

const hover = ref<Boolean>(false);

async function searchRowers() {
  loading.value = true;
  if (searchQuery) await rowerStore.searchRowers(searchQuery.value);
  loading.value = false;
}
async function getRower(id) {
  loading.value = true;
  await rowerStore.getRower(id);
  loading.value = false;
}


</script>

<style lang="scss" scoped>
.element-body {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.search {
  position: relative;
  margin: 1rem;
  > input {
    border-bottom: 1px solid $colors--primary;
    width: 30rem;
    margin-bottom: 1rem;
    &:focus {
      border-bottom: 2px solid $colors--primary;
      margin-bottom: 15px;
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

.searchable {
  &:deep(.nuxt-icon svg) {
    cursor: pointer;
    color: black;
  }
}

.results {
  display: flex;
  flex-direction: column;
  width: 60%;
  .headers {
    display: grid;
    font-size: 14px;
    padding: 0 0.5rem;
    color: $neutral-variant30;
    grid-template-columns: 50% 50%;
    margin-bottom: 0.5rem;
  }
  .result {
    display: grid;
    grid-template-columns: 50% 50%;
    padding: 0.3rem 0.5rem;
    border-radius: 5px;

    color: $neutral-variant20;
    cursor: pointer;
    &:hover {
      background-color: $surfaces--light--surface2;
    }
  }
}


.total {
  width: 80%;
  padding-left: 1rem;
  font-size: 13px;
  > span {
    color: $neutral-variant10;
  }
}
</style>~/types/FoodBankTypes