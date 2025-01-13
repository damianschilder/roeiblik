<template lang="pug">
.page-wrapper
  KNRBPersoonHeader(v-if="KNRBStore.person.personId" :fullName="KNRBStore.person.fullName")
  .loader-container(v-if="loading")
    UiLoader
    span Dit kan een paar seconden duren.
  KNRBPersoonTournamentsOverview(v-if="KNRBStore.person.personId" :tournaments="KNRBStore.person.tournaments")
</template>
  
<script setup lang="ts">
import { useRoute } from 'vue-router';
const route = useRoute();
const KNRBStore = useKNRBStore();

const error = ref<boolean>(false);
const loading = ref<boolean>(false);

async function getRower(id: PersonResult['personId']) {
  loading.value = true;
  error.value = false;
  try {
    await KNRBStore.getRower(id);
  } catch (e) {
    console.error('Error fetching rower:', e);
    error.value = true; // Set error state if an error occurs
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  if (KNRBStore.results.length === 0) {
    const id = route.params.id;
    if (id) {
      await getRower(id as PersonResult['personId']);
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

</style>
