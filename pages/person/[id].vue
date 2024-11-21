<template lang="pug">
.page-wrapper
  UiRowerIntro(v-if="rowerStore && rowerStore.rower.displayname")
  .loader-container(v-if="!rowerStore || rowerStore.loading")
    UiLoader
    span Voor veel resultaten kan dit een paar seconden duren.
  UiTimeteam(v-if="rowerStore && rowerStore.rower?.allRaceCrewInfo")
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useRowersStore } from '@/stores/rowers';

const rowerStore = useRowersStore();
const runtimeConfig = useRuntimeConfig();

const route = useRoute();

const isLoading = computed(() => rowerStore.loading);

const pageLoading = ref<boolean>(false);
  const pageError = ref<boolean>(false);

async function getRower(id: Person['id']) {
  pageLoading.value = true;
  pageError.value = false; // Reset error state before attempting to fetch data
  try {
    await rowerStore.getRower(id);
  } catch (error) {
    console.error('Error fetching rower:', error);
    pageError.value = true; // Set error state if an error occurs
  } finally {
    pageLoading.value = false;
  }
}

onMounted(async () => {
  if (!rowerStore.rower.allRaceCrewInfo) {
    const id = route.params.id;
    if (id) {
      await getRower(id as Person['id']);
    }
  }
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

</style>
