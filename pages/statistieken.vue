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
            @focusout="setTimeout(() => showDropdown = false, 100)"
          @input="filterOptions"
        )
        ul.dropdown-list(v-show="showDropdown")
          li.dropdown-item(
            v-for="(event, index) in filteredEvents"
            :key="index"
            @click="selectEvent(event.event_name)"
          ) {{ event.event_name }}
    h3 Uitslagen per veld
    StatisticsTable.table(
      :selectedFile="getFilePath(selectedEventName, 'event_results')"
      folder="event_results"
      :hiddenColumns="['Id', 'Event Name', 'Wedstrijd laatste dag', 'Snelste tijd']"
      winnaars
    )
    h3 Statistieken per club
    StatisticsTable.table(
      :selectedFile="getFilePath(selectedEventName, 'event_statistics')"
      folder="event_statistics"
      :hiddenColumns="['Event Name']"
    )
    h3 Statistieken per roeier
    StatisticsTable(
      :selectedFile="getFilePath(selectedEventName, 'event_rowers')"
      folder="event_rowers"
      :hiddenColumns="['Event Name', 'Id', 'Eerste wedstrijd ID', 'Laatste wedstrijd ID', 'Eerste punt ID', 'Eerste punt veld']"
    )
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue';
  
  const title = ref('Selecteer een veld');
  const combinedFileList = ref([]);
  const selectedEventName = ref('');
  const searchQuery = ref('');
  const showDropdown = ref(false);
  const filteredEvents = ref([]);
  
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
  
    // Close dropdown when clicking outside
    document.addEventListener('click', handleClickOutside);
  });
  
  // Filter events based on search query
  const filterOptions = () => {
    const query = searchQuery.value.toLowerCase();
    filteredEvents.value = combinedFileList.value.filter(event =>
      event.event_name.toLowerCase().includes(query)
    );
  };
  
  // Select event from dropdown
  const selectEvent = (eventName) => {
    selectedEventName.value = eventName;
    searchQuery.value = eventName;
    showDropdown.value = false;
  };
  
  // Close dropdown when clicking outside
  const handleClickOutside = (event) => {
    const { dropdownWrapper } = $refs;
    if (dropdownWrapper && !dropdownWrapper.contains(event.target)) {
      showDropdown.value = false;
    }
  };
  
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
  });
  
  // Function to get file path by event name and file type
  const getFilePath = (eventName, fileType) => {
    title.value = eventName;
    const event = combinedFileList.value.find(event => event.event_name === eventName);
    if (event) {
      const fileTypeIndexMap = {
        event_results: 1,
        event_statistics: 0,
        event_rowers: 2,
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
    z-index: 1000;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  
  .dropdown-item {
    padding: 0.5rem;
    cursor: pointer;
    font-family: 'Mulish', sans-serif;
  }

  </style>
  