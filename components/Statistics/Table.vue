<template lang="pug">
  .component-wrapper
    .content
      // Filter Button
      .actions
        UiButton(label="Filters" :active="showFilters" @click="toggleFilters") {{ showFilters ? 'Hide Filters' : 'Show Filters' }}
        .button
          label
            input.checkbox(type="checkbox" v-model="headerSticky" @change="toggleSticky")
            span Sticky header
        .button(v-if="winnaars")
          label
            input.checkbox(type="checkbox" v-model="showWinnerOnly" @change="updatePositionColumns")
            span Alleen winnaars
        // Search functionality
      .filters(v-if="showFilters")
        .search
          input(type="text" v-model="searchQuery" placeholder="Search..." @input="filterRows")
          select(v-model="selectedSearchColumn")
            option(value="" disabled) Select Column
            option(v-for="header in headers" :value="header.name" :key="header.name") {{ header.name }}
        .checkbox-container
          label(v-for="(header, index) in headers.filter(h => !h.name.includes('Position'))" :key="index")
            input(type="checkbox" v-model="header.visible") 
            span {{ header.name }}
      
      .table-container(:class="{ 'loading': loading }")
        table(v-if="filteredRows.length")
          thead
            tr
              th(v-for="(header, index) in headers" :key="index" v-show="header.visible" :class="{ 'sticky': headerSticky }") {{ header.name }}
          tbody
            tr(v-for="(row, rowIndex) in filteredRows" :key="rowIndex")
                td(v-for="(cell, cellIndex) in row" 
                  :key="cellIndex" 
                  v-show="headers[cellIndex]?.visible" 
                  :class="{ number: numberColumnArray.includes(headers[cellIndex]?.name) }") {{ cell === 'NaN:NaN.NaN' ? '' : (cell.endsWith('.0') ? cell.slice(0, -2) : cell) }}
        p(v-else) No matching results found.
  </template>
  
  <script setup>
  import { ref, watch, computed } from 'vue';
  import { parse } from 'csv-parse/browser/esm';
  import useTimeFormatter from '@/composables/useTimeFormatter';
  
  const { formatTime } = useTimeFormatter();
  
  // Props
  const props = defineProps({
    selectedFile: {
      type: String,
      required: true,
    },
    folder: {
      type: String,
      required: true,
    },
    hiddenColumns: {
      type: Array,
      default: () => [],
    },
    winnaars: {
      type: Boolean,
      default: false,
    },
  });
  
  // Reactive variables
  const rows = ref([]);
  const headers = ref([]);
  const loading = ref(false);
  const showFilters = ref(false); // Toggle visibility of the filter section
  const showWinnerOnly = ref(false); // Toggle to show only "Position 1"
  const headerSticky = ref(true); // Toggle to show sticky header
  const searchQuery = ref(''); // Search input value
  const selectedSearchColumn = ref(''); // Selected column for searching
  
  // Computed for filtered rows
  const filteredRows = computed(() => {
    if (!searchQuery.value || !selectedSearchColumn.value) return rows.value;
  
    const columnIndex = headers.value.findIndex(
      header => header.name === selectedSearchColumn.value
    );
  
    if (columnIndex === -1) return rows.value;
  
    return rows.value.filter(row =>
      row[columnIndex]?.toString().toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  });
  
  const numberColumnArray = ['Number of Finalists', 'Total Teams', 'Fastest Time', 'A Final Winner Time'];
  
  function toggleSticky() {
    headerSticky.value = !headerSticky.value;
  }
  
  // CSV loading function
  const loadCSV = async () => {
    loading.value = true;
    if (!props.selectedFile) return;
  
    const fileUrl = `/${props.folder}/${props.selectedFile}`;
    const response = await fetch(fileUrl);
    const csvText = await response.text();
  
    // Parse CSV
    parse(csvText, { skip_empty_lines: true }, (err, output) => {
      if (err) {
        return;
      }
  
      headers.value = output[0].map(name => ({
        name,
        visible: !props.hiddenColumns.includes(name),
      }));
  
      rows.value = output.slice(1).map(row =>
        row.map((cell, index) =>
          headers.value[index]?.name.toLowerCase().includes('time')
            ? formatTime(cell)
            : cell
        )
      );
    });
    loading.value = false;
  };
  
  // Watch for changes in selectedFile and reload CSV
  watch(() => props.selectedFile, loadCSV, { immediate: true });
  
  // Toggle filter visibility
  const toggleFilters = () => {
    showFilters.value = !showFilters.value;
  };
  
  // Function to update position columns based on "Show Winner" toggle
  const updatePositionColumns = () => {
    headers.value.forEach(header => {
      if (header.name.startsWith('Position') && header.name !== 'Position 1') {
        header.visible = !showWinnerOnly.value; // Hide all other positions if "Show Winner" is checked
      }
    });
  };
  
  // Function to filter rows based on search
  const filterRows = () => {
    if (!searchQuery.value || !selectedSearchColumn.value) return;
  
    const columnIndex = headers.value.findIndex(
      header => header.name === selectedSearchColumn.value
    );
  
    if (columnIndex === -1) return;
  
    filteredRows.value = rows.value.filter(row =>
      row[columnIndex]?.toString().toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  };
  </script>
  
  <style lang="scss" scoped>
  .loading {
    opacity: 0.5;
  }
  .table-container {
    overflow-x: auto; /* Enable horizontal scrolling */
    overflow-y: auto; /* Enable horizontal scrolling */
    max-width: 100%; /* Ensure it doesn't exceed the parent's width */
    max-height: 70vh; /* Limit height to 80% of the viewport */
    background: white;
    border-radius: 5px;
    -moz-box-shadow: inset 0 -10px 10px -10px #000000;
  -webkit-box-shadow: inset 0 -10px 10px -10px #000000;
  box-shadow: inset 0 -10px 30px -10px rgba(0, 0, 0, 0.05);
  /* filter: drop-shadow(1px 2px 1px rgba(0, 0, 0, 0.05)); */

  }
  
  table {
    border-collapse: collapse; /* Optional: for better table style */
    width: 100%; /* Allow table to take up full width */
    min-width: min-content; /* Ensure columns don’t squish on overflow */
  }
  
  th, td {
    padding: 8px;
    border-bottom: 1px solid #ddd; /* Optional: table border styling */
    text-align: left; /* Optional: align text */
  }
th {
  filter: drop-shadow(1px 2px 1px rgba(0, 0, 0, 0.05));
  color: rgba(0, 0, 0, 0.5)

}

td {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
}
  
.search {
  margin-bottom: 1rem;
  width: min-content;
  display: flex;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(0, 0, 0, 0.05);
  background-color: white;
  border-radius: 5px;
  overflow: hidden;
  column-gap: 0.5rem;
  filter: drop-shadow(1px 2px 1px rgba(0, 0, 0, 0.05));
  input {
    border-radius: 5px;
    cursor: initial;
  }
}

.select-file {
  margin-bottom: 1rem;
}
  
  .checkbox-container {
  background-color: white;
  padding: 0.5rem 0.5rem;
  border-radius: 5px;
  row-gap: 0.25rem;
  margin-top: 0.5rem;
  display: grid;
  border: 1px solid rgba(0, 0, 0, 0.05);
  grid-template-columns: repeat(3, 1fr);
  filter: drop-shadow(1px 2px 1px rgba(0, 0, 0, 0.05));
  margin-bottom: 1rem;
  max-width: max-content;
  column-gap: 1rem;
  transition: max-height 0.3s ease, opacity 0.3s ease;
  overflow: hidden;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  row-gap: 0.5rem;
  column-gap: 1rem;
  margin-bottom: 1rem;
}

select, option {
  cursor: pointer;
  row-gap: 0.25rem;
  background-color: white;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 1rem;
  display: grid;
  border: 0px solid rgba(0, 0, 0, 0.05);
}
option, select {
  font-family: "Mulish", sans-serif;
}

.button {
  cursor: pointer;
  padding: 0.5rem;
  width: max-content;
  height: fit-content;
  border: 1px solid rgba(0, 0, 0, 0.05);
  background-color: white;
  filter: drop-shadow(1px 2px 1px rgba(0, 0, 0, 0.05));
  cursor: pointer;
  border-radius: 5px;
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
}
:deep(svg) {
height: 1.1rem;
width: 1.1rem;
}
input, label {
  margin: initial;
  cursor: pointer;
  accent-color: $seed;
}

label {
  display: flex;
  column-gap: 0.25rem;
}

.sticky {
  position: sticky;
  top: 0; /* Stick to the top of the container */
  background-color: white; /* Set a background color to avoid transparency */
  z-index: 1; /* Ensure it stays above other elements */
}
.element-body {
  margin-bottom: 4rem;
}
.content {
}

</style>