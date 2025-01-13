<template lang="pug">
.page-wrapper
  .header
    h2 {{ title }}
    .dropdown-wrapper(ref="dropdownWrapper")
      input.search-input(
        type="text"
        placeholder="Zoek naar een veld..."
        v-model="searchQuery"
        @focus="showDropdown = true"
        @focusout="closeDropdown"
        @input="filterOptions"
      )
      ul.dropdown-list(v-show="showDropdown")
        li.dropdown-item(
          v-for="(event, index) in filteredEvents"
          :key="index"
          @click="selectEvent(event.event_name, event.code)"
        ) {{ event.event_name }}
  h3 Wedstrijd uitslagen, {{selectedEventCode}} veld.
  StatisticsTable.table(
    :selectedFile="getFilePath(selectedEventName, 'event_results')"
    :hiddenColumns="['Id', 'Event Name', 'Wedstrijd laatste dag', 'Snelste tijd', 'Event Code', 'Team snelste tijd']"
    winnaars
  )
  h3 Winnende tijd en gemiddelde tijd van alle deelnemeners, {{selectedEventCode}} veld.
  StatisticsTable.table(
    :selectedFile="getFilePath(selectedEventName, 'event_times')"
    :hiddenColumns="['Event Code', 'Event Name', 'Regatta Id']"
  )
  h3 Grafiek van winnende tijd en gemiddelde tijd van alle deelnemers, {{selectedEventCode}} veld.
  StatisticsChart.table(
    :selectedFile="getFilePath(selectedEventName, 'event_times')"
  )
  h3 Statistieken van verenigingen, {{selectedEventCode}} veld.
  StatisticsTable.table(
    :selectedFile="getFilePath(selectedEventName, 'event_statistics')"
    :hiddenColumns="['Event Name', 'Event Code']"
  )
  h3 Grafiek van statistieken van verenigingen, {{selectedEventCode}} veld.
  StatisticsBar(
    :selectedFile="getFilePath(selectedEventName, 'event_statistics_by_year')"
  )
  h1.weird test
  h1.weird test
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue';

  const title = ref('Selecteer een veld');
  const combinedFileList = ref([]);
  const selectedEventName = ref('');
  const selectedEventCode = ref('');
  const searchQuery = ref('');
  const showDropdown = ref(false);
  const filteredEvents = ref([]);

  function closeDropdown() {
    setTimeout(() => {
      showDropdown.value = false;
    }, 100);
  }

  onMounted(async () => {
    try {
      const response = await fetch('/combined_files_list.json');
      combinedFileList.value = await response.json();

      // Initialize the filteredEvents with the full list
      filteredEvents.value = combinedFileList.value;

      // Default to the first event name if available
      if (combinedFileList.value.length) {
        selectedEventName.value = combinedFileList.value[0].event_name;
        searchQuery.value = selectedEventName.value;
      }
    } catch (error) {
      console.error('Error loading combined JSON file:', error);
    }
  });

  // Filter events based on search query
  const filterOptions = () => {
    const query = searchQuery.value.toLowerCase();
    filteredEvents.value = combinedFileList.value.filter(event =>
      event.event_name.toLowerCase().includes(query)
    );
  };

  // Select event from dropdown
  const selectEvent = (eventName, eventCode) => {
    console.log(eventName, eventCode);
    selectedEventName.value = eventName;
    selectedEventCode.value = eventCode;
    searchQuery.value = eventName;
    showDropdown.value = false;
  };

  // Function to get file path by event name and file type
  const getFilePath = (eventName, fileType) => {
    title.value = eventName;
    const event = combinedFileList.value.find(event => event.event_name === eventName);
    if (event) {
      const fileTypeIndexMap = {
        event_results: 0,
        event_statistics: 1,
        event_statistics_by_year: 2,
        event_times: 3, // Newly added folder
      };
      return event.files[fileTypeIndexMap[fileType]] || null;
    }
    return null;
  };
  </script>


  
  <style lang="scss" scoped>
  .page-wrapper {
    display: flex;
    flex-direction: column;
    padding: 3rem 1rem 0;
    height: 100%;
    margin-bottom: 4rem;
  }
  
  h2 {
    text-transform: capitalize;
    margin-bottom: 1rem;
  }
  h3 {
    margin-bottom: 1rem;
  }
  .header{
    margin-bottom: 2rem;
  }

  .table {
    margin-bottom: 5rem;
  }
  
  .dropdown-wrapper {
    position: relative;
    max-width: max-content;
    text-transform: capitalize;
    input {
      text-transform: capitalize;

    }
  }
  
  .search-input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 5px;
    background-color: white;
    font-size: 1rem;
    font-family: 'Mulish', sans-serif;
  }
  
  .dropdown-list {
    position: absolute;
    width: 100%;
    max-height: 200px;
    overflow-y: auto;
    background-color: white;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-top: none;
    border-radius: 0 0 5px 5px;
    z-index: 800;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  
  .dropdown-item {
    padding: 0.5rem;
    cursor: pointer;
    font-family: 'Mulish', sans-serif;
  }
.weird {
  visibility: hidden;
}
  </style>
  