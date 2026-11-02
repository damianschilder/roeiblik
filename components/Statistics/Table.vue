<template lang="pug">
  .component-wrapper
    .content
      .actions
        UiButton(label="Filters" icon="filter" :active="showFilters" :aria-expanded="showFilters ? 'true' : 'false'" :aria-controls="filtersId" @click="toggleFilters")
        UiButton(label="Download" icon="download" :disabled="!rows.length" @click="downloadFile")
      .filters(v-if="showFilters" :id="filtersId")
        .search
          input(type="text" v-model="searchQuery" placeholder="Zoeken..." aria-label="Zoeken in de tabel")
          select(v-model="selectedSearchColumn" aria-label="Zoeken in kolom")
            option(value="") Alle kolommen
            option(v-for="header in headers" :value="header.name" :key="header.name") {{ header.label }}
        fieldset.checkbox-container
          legend.visually-hidden Zichtbare kolommen
          label(v-for="header in headers.filter(h => !h.name.includes('Position'))" :key="header.name")
            input(type="checkbox" v-model="header.visible")
            span {{ header.label }}

      //- The box scrolls on its own; tabindex lets keyboard users scroll it too.
      .table-container(
        :class="{ 'loading': loading }"
        role="region"
        :aria-label="caption || 'Tabel'"
        :tabindex="filteredRows.length ? 0 : undefined"
        :aria-busy="loading ? 'true' : 'false'"
      )
        table(v-if="filteredRows.length")
          caption.visually-hidden(v-if="caption") {{ caption }}
          thead
            tr
              th(v-for="(header, index) in headers" :key="index" v-show="header.visible" scope="col" :class="{ 'sticky': headerSticky }") {{ header.label }}
          tbody
            tr(v-for="(row, rowIndex) in filteredRows" :key="rowIndex")
                td(v-for="(cell, cellIndex) in row"
                  :key="cellIndex"
                  v-show="headers[cellIndex]?.visible") {{ display(cell) }}
        p.status(v-else-if="loading") Laden…
        p.status(v-else-if="failed") De gegevens konden niet worden geladen.
        p.status(v-else) Geen resultaten gevonden.
  </template>

  <script setup>
  import { ref, watch, computed } from 'vue';
  import { parse } from 'csv-parse/browser/esm';
  import useTimeFormatter from '@/composables/useTimeFormatter';

  const { formatTime } = useTimeFormatter();

  const props = defineProps({
    selectedFile: {
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
    // Read by screen readers as the table's name.
    caption: {
      type: String,
      default: '',
    },
  });

  // The CSVs mix English and Dutch column names; show them in Dutch.
  const LABELS = {
    'Westrijd eerste dag': 'Wedstrijd eerste dag',
    Location: 'Locatie',
    Year: 'Jaar',
    'Regatta Name': 'Wedstrijd',
    'First Day Date': 'Datum',
    'Winning Time': 'Winnende tijd',
    'Winning Team': 'Winnaar',
    'Fastest Time': 'Snelste tijd',
    'Fastest Team': 'Snelste ploeg',
    'Average Time': 'Gemiddelde tijd',
    Club: 'Vereniging',
    Wins: 'Overwinningen',
    Entries: 'Inschrijvingen',
    'Win Rate (%)': 'Winstpercentage (%)',
    'Average Position': 'Gemiddelde positie',
  };

  const rows = ref([]);
  const headers = ref([]);
  // Starts as "loading" on the server too, so the server's HTML and the browser's first render match.
  const loading = ref(Boolean(props.selectedFile));
  const failed = ref(false);
  const showFilters = ref(false);
  const headerSticky = ref(true);
  const searchQuery = ref('');
  const selectedSearchColumn = ref('');
  const filtersId = useId();

  // Search one column, or all of them.
  const filteredRows = computed(() => {
    const query = searchQuery.value.trim().toLowerCase();
    if (!query) return rows.value;
    const columnIndex = headers.value.findIndex((header) => header.name === selectedSearchColumn.value);
    return rows.value.filter((row) =>
      columnIndex === -1
        ? row.some((cell, i) => headers.value[i]?.visible && cell.toLowerCase().includes(query))
        : row[columnIndex]?.toLowerCase().includes(query)
    );
  });

  // "2024.0" -> "2024"; empty times stay empty.
  const display = (cell) => (cell === 'NaN:NaN.NaN' ? '' : cell.endsWith('.0') ? cell.slice(0, -2) : cell);

  const parseCsv = (text) =>
    new Promise((resolve, reject) => {
      parse(text, { skip_empty_lines: true, bom: true }, (err, output) => (err ? reject(err) : resolve(output)));
    });

  let current = 0;
  const loadCSV = async () => {
    if (!props.selectedFile || import.meta.server) return;
    const request = ++current;
    loading.value = true;
    failed.value = false;
    try {
      const output = await parseCsv(await fetchStaticCsv(props.selectedFile));
      if (request !== current) return; // a newer field was chosen meanwhile
      headers.value = (output[0] || []).map((name) => ({
        name,
        label: LABELS[name] || name,
        visible: !props.hiddenColumns.includes(name),
      }));
      // Time columns in seconds become m:ss.cc; ones already written as m:ss.sss stay as they are.
      const isTime = headers.value.map((h) => h.name.toLowerCase().includes('time'));
      rows.value = output.slice(1).map((row) => row.map((cell, i) => (isTime[i] ? formatTime(cell) : cell)));
    } catch {
      if (request !== current) return;
      headers.value = [];
      rows.value = [];
      failed.value = true;
    } finally {
      if (request === current) loading.value = false;
    }
  };

  watch(() => props.selectedFile, loadCSV, { immediate: true });

  const toggleFilters = () => {
    showFilters.value = !showFilters.value;
  };

  // RFC 4180: quote a value that holds a comma, a quote or a line break.
  const csvValue = (value) => (/[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

  const downloadFile = () => {
    if (!rows.value.length) return;
    const csvContent = [headers.value.map((h) => csvValue(h.label)), ...rows.value.map((r) => r.map(csvValue))]
      .map((line) => line.join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', (props.selectedFile || 'data.csv').split('/').pop());
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
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

  .status {
    padding: 8px;
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
  color: $black50;
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
  &:focus-within {
    border-color: $black50;
  }
}

.checkbox-container {
  background-color: white;
  padding: 0.5rem 0.5rem;
  border-radius: 5px;
  row-gap: 0.25rem;
  margin: 0.5rem 0 1rem;
  display: grid;
  border: 1px solid rgba(0, 0, 0, 0.05);
  grid-template-columns: repeat(3, 1fr);
  filter: drop-shadow(1px 2px 1px rgba(0, 0, 0, 0.05));
  max-width: max-content;
  min-width: 0;
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
</style>
