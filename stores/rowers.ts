export const useRowersStore = defineStore('rowers', () => {
  const loading = ref<boolean>(false);
  const error = ref<boolean>(false);
  const results = ref<any[]>([]);
  const rower = ref<Object>({}); 

  async function searchRowers(query: string) {
    loading.value = true;
    try {
      const response = await $fetch('/api/proxy/search', {
        method: 'GET',
        params: { query },
      });
      results.value = response.person ? Object.values(response.person) : [];
      error.value = false;
    } catch (e) {
      error.value = true;
      console.error('Failed to fetch rowers:', e);
    } finally {
      loading.value = false;
    }
  };

  async function getRower(id: string) {
    loading.value = true;
    try {
      const response = await $fetch(`/api/proxy/person/${id}`, {
        method: 'GET',
      });
      rower.value = response; // Assuming `response` is a single object
      error.value = false;
    } catch (e) {
      error.value = true;
      console.error('Failed to fetch rower:', e);
    } finally {
      loading.value = false;
    }
  }

  return { loading, error, results, searchRowers, getRower, rower };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRowersStore, import.meta.hot));
}
