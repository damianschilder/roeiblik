<template lang="pug">
  .page-wrapper
    h2 Uitslagen per veld
    StatisticsTable( :fileList="event_results_list" folder="event_results" :hiddenColumns="['Regatta ID']")
    h2 Statistieken per club per veld
    StatisticsTable( :fileList="club_statistics_list" folder="club_statistics" :hiddenColumns="['Event Name']")
  </template>
  
  <script setup>
  import { ref } from 'vue';
  const event_results_list = ref([]);
  const club_statistics_list = ref([]);
  
  onMounted(async () => {
    // Fetch JSON from the public folder
    const event_results_list_response = await fetch('/file_lists/event_results_list.json');
    event_results_list.value = await event_results_list_response.json();
  
    const club_statistics_list_response = await fetch('/file_lists/club_statistics_list.json');
    club_statistics_list.value = await club_statistics_list_response.json();
  });
  </script>
  
  
  <style lang="scss" scoped>
  .page-wrapper {
    display: flex;
    flex-direction: column;
    padding: 3rem 0 0;
    height: 100%;
  }
  
  .beta {
    display: none;
    justify-content: center;
    align-items: center;
    padding: 0.5rem 0.5rem;
    font-size: 0.9rem;
    background-color: rgba(230, 0, 0, 0.10);;
    a {
      color: #663333;
  
    }
    @include mobile {
      display: flex;
    }
  }
  
  h2 {
    margin-bottom: 1rem;
  }
  </style>