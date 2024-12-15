<template lang="pug">
  .component-wrapper 
    .element-wrapper
      .element-body
        // File Selector
        .select-file
          select#file-select(v-model="selectedFile" @change="loadCSV")
            option(v-for="(file, index) in files" :key="index" :value="file.filename") {{ file.event_name }}
  
        // Column Visibility Checkboxes
        .checkbox-container
          label(v-for="(header, index) in headers" :key="index")
            input(type="checkbox" v-model="header.visible") 
            span {{ header.name }}
        
        // Table Container with horizontal scroll
        .table-container
          table(v-if="rows.length")
            thead
              tr
                th(v-for="(header, index) in headers" :key="index" v-show="header.visible") {{ header.name }}
            tbody
              tr(v-for="(row, rowIndex) in rows" :key="rowIndex")
                td(v-for="(cell, cellIndex) in row" :key="cellIndex" v-show="headers[cellIndex]?.visible") {{ cell }}
  </template>
  
  <script setup>
  import { ref, watch } from 'vue';
  import { parse } from 'csv-parse/browser/esm';
  import useTimeFormatter from '@/composables/useTimeFormatter';
  
  const { formatTime } = useTimeFormatter();
  
  // Props
  const props = defineProps({
    fileList: {
      type: Array,
      required: true,
    },
    folder: {
      type: String,
      required: true,
    }
  });
  
  const { folder } = props;
  
  // Reactive variables
  const files = ref([]);
  const selectedFile = ref('');
  const rows = ref([]);
  const events = ref([]); // To store associated events for the selected file
  const headers = ref([]); // To store associated events for the selected file
  
  // CSV loading function
  const loadCSV = async () => {
    if (!selectedFile.value) return;
  
    const fileUrl = `/${folder}/${selectedFile.value}`;
    const response = await fetch(fileUrl);
    const csvText = await response.text();
  
    // Parse CSV using csv-parse
    parse(csvText, { skip_empty_lines: true }, (err, output) => {
      if (err) {
        console.error('Error parsing CSV:', err);
        return;
      }
  
      // Extract and prepare headers
      headers.value = output[0].map(name => ({
        name: name,
        visible: true,
      }));
  
      // Extract rows and format specific columns
      rows.value = output.slice(1).map(row =>
        row.map((cell, index) => {
          // Check if the column header indicates time (e.g., contains "time")
          const isTimeColumn = headers.value[index]?.name.toLowerCase().includes('time');
          return isTimeColumn ? formatTime(cell) : cell; // Format time cells or leave unchanged
        })
      );
    });
  
    // Update events for the selected file
    events.value = props.fileList
      .filter((file) => file.filename === selectedFile.value)
      .map((file) => file.event_name);
  };
  
  // Watch for updates to the file list prop
  watch(
    () => props.fileList,
    (newList) => {
      // Map files to include both filename and event_name
      files.value = newList.map((item) => ({
        filename: item.filename,
        event_name: item.event_name,
      }));
  
      if (files.value.length > 0) {
        selectedFile.value = files.value[0].filename; // Default to the first filename
        loadCSV();
      }
    },
    { immediate: true }
  );
  
  // Watch for changes to the selected file
  watch(selectedFile, loadCSV);
  </script>
  
  <style lang="scss" scoped>
  .table-container {
    overflow-x: auto; /* Enable horizontal scrolling */
    max-width: 100%; /* Ensure it doesn't exceed the parent's width */
  }
  
  table {
    border-collapse: collapse; /* Optional: for better table style */
    width: 100%; /* Allow table to take up full width */
    min-width: max-content; /* Ensure columns don’t squish on overflow */
  }
  
  th, td {
    padding: 8px;
    border-bottom: 1px solid #ddd; /* Optional: table border styling */
    text-align: left; /* Optional: align text */
  }
  
  .select-file {
    margin-bottom: 1rem;
  }
  
  .checkbox-container {
    display: flex;
    flex-wrap: wrap;
    margin-bottom: 1rem;
    column-gap: 1rem; 
  }
  
  .element-body {
    margin-bottom: 4rem;
  }
  </style>
  