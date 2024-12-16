<template lang="pug">
  .page-wrapper
    .header
      h2 {{title}}
      .select-file
        select(v-model="selectedEventName")
          option( style="font-family: 'Mulish', sans-serif;" v-for="(file, index) in allEventNames" :key="index" :value="file.event_name") {{ file.event_name }}
    h3 Uitslagen per veld
    StatisticsTable.table(
      :selectedFile="getFileByEventName(selectedEventName, 'event_results')"
      folder="event_results"
      :hiddenColumns="['Regatta ID', 'Event Name', 'Last Tournament Date', 'Fastest Time']"
      winnaars=true
    )
    h3 Statistieken per club
    StatisticsTable.table(
      :selectedFile="getFileByEventName(selectedEventName, 'club_statistics')"
      folder="club_statistics"
      :hiddenColumns="['Event Name']"
    )
    h3 Statistieken per roeier
    StatisticsTable.table(
      :selectedFile="getFileByEventName(selectedEventName, 'event_rowers')"
      folder="event_rowers"
      :hiddenColumns="['Event Name', 'personId','firstRegattaId','lastRegattaId', 'firstRegattaWonId', 'EventNameWon']"
    )
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue';
  
  const title = ref('Selecteer een veld');
  
  // Reactive variables for file lists
  const eventResultsList = ref([]);
  const clubStatisticsList = ref([]);
  const eventRowersList = ref([]);
  
  // User-selected event name
  const selectedEventName = ref(''); // Start with an empty value
  
  // Fetch JSON files on mount
  onMounted(async () => {
    try {
      const eventResultsResponse = await fetch('/file_lists/event_results_list.json');
      eventResultsList.value = await eventResultsResponse.json();
  
      const clubStatisticsResponse = await fetch('/file_lists/club_statistics_list.json');
      clubStatisticsList.value = await clubStatisticsResponse.json();
  
      const eventRowersResponse = await fetch('/file_lists/event_rowers_list.json');
      eventRowersList.value = await eventRowersResponse.json();
  
      // Default to the first available event name if lists are not empty
      if (eventResultsList.value.length) {
        selectedEventName.value = eventResultsList.value[0].event_name;
      }
    } catch (error) {
      console.error('Error loading JSON files:', error);
    }
  });
  
  // Combine all unique event names from all lists
  const allEventNames = computed(() => {
    const namesSet = new Set([
      ...eventResultsList.value.map(file => file.event_name),
      ...clubStatisticsList.value.map(file => file.event_name),
      ...eventRowersList.value.map(file => file.event_name),
    ]);
    return Array.from(namesSet).map(name => ({ event_name: name }));
  });
  
  // Function to find the correct file by event name and type
  const getFileByEventName = (eventName, type) => {
    title.value = eventName;
    let list;
    switch (type) {
      case 'event_results':
        list = eventResultsList.value;
        break;
        case 'club_statistics':
          list = clubStatisticsList.value;
          break;
          case 'event_rowers':
            list = eventRowersList.value;
            break;
            default:
              return null;
            }
    const file = list.find(file => file.event_name === eventName);
    return file ? file.filename : null; // Return filename or null if not found
  };
  </script>
  
  <style lang="scss" scoped>
  .page-wrapper {
    display: flex;
    flex-direction: column;
    padding: 3rem 1rem 0;
    height: 100%;
  }
  
  h3 {
    margin-bottom: 1rem;
  }
  
  .table {
    margin-bottom: 5rem;
  }
  
  select, option {
    cursor: pointer;
    background-color: white;
    padding: 0.5rem 0.5rem;
    border-radius: 5px;
    row-gap: 0.25rem;
    margin-top: 0.5rem;
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 1rem;
    display: grid;
    border: 1px solid rgba(0, 0, 0, 0.05);
    grid-template-columns: repeat(3, 1fr);
    filter: drop-shadow(1px 2px 1px rgba(0, 0, 0, 0.05));
  }
  option, select {
    font-family: "Mulish";
  }
  
  .header {
    margin-bottom: 2rem;
  }
  </style>
  