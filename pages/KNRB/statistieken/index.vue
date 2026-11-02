<template lang="pug">
.page-wrapper
  .header
    h1.page-title {{ title }}
    //- A combobox: type to filter, arrow keys to move, Enter to choose, Escape to close.
    .dropdown-wrapper
      label.visually-hidden(for="veld-zoeken") Kies een veld
      input#veld-zoeken.search-input(
        type="text"
        role="combobox"
        autocomplete="off"
        aria-autocomplete="list"
        aria-controls="veld-lijst"
        :aria-expanded="showDropdown ? 'true' : 'false'"
        :aria-activedescendant="showDropdown && activeIndex >= 0 ? `veld-${activeIndex}` : undefined"
        placeholder="Zoek naar een veld..."
        v-model="searchQuery"
        @focus="openList"
        @click="openList"
        @blur="closeList"
        @input="onInput"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.enter.prevent="chooseActive"
        @keydown.esc="closeList"
      )
      ul#veld-lijst.dropdown-list(v-show="showDropdown" role="listbox" aria-label="Velden")
        li.dropdown-item(
          v-for="(event, index) in filteredEvents"
          :key="event.code"
          :id="`veld-${index}`"
          role="option"
          :aria-selected="index === activeIndex ? 'true' : 'false'"
          :class="{ active: index === activeIndex }"
          @mousedown.prevent="selectEvent(event)"
          @mouseenter="activeIndex = index"
        ) {{ event.event_name }}
        li.dropdown-item.empty(v-if="!filteredEvents.length") Geen veld gevonden
  h2 Wedstrijduitslagen, {{ selectedEvent?.code }} veld.
  StatisticsTable.table(
    v-if="files.event_results"
    :selectedFile="files.event_results"
    :hiddenColumns="['Id', 'Event Name', 'Wedstrijd laatste dag', 'Snelste tijd', 'Event Code', 'Team snelste tijd']"
    caption="Wedstrijduitslagen"
    winnaars
  )
  p.no-data(v-else) Geen gegevens voor dit veld.
  h2 Winnende tijd en gemiddelde tijd van alle deelnemers, {{ selectedEvent?.code }} veld.
  StatisticsTable.table(
    v-if="files.event_times"
    :selectedFile="files.event_times"
    :hiddenColumns="['Event Code', 'Event Name', 'Regatta Id']"
    caption="Winnende en gemiddelde tijden"
  )
  p.no-data(v-else) Geen gegevens voor dit veld.
  h2 Grafiek van winnende tijd en gemiddelde tijd van alle deelnemers, {{ selectedEvent?.code }} veld.
  StatisticsChart.table(
    v-if="files.event_times"
    :selectedFile="files.event_times"
  )
  p.no-data(v-else) Geen gegevens voor dit veld.
  h2 Statistieken van verenigingen, {{ selectedEvent?.code }} veld.
  StatisticsTable.table(
    v-if="files.event_statistics"
    :selectedFile="files.event_statistics"
    :hiddenColumns="['Event Name', 'Event Code']"
    caption="Statistieken van verenigingen"
  )
  p.no-data(v-else) Geen gegevens voor dit veld.
  h2 Grafiek van statistieken van verenigingen, {{ selectedEvent?.code }} veld.
  StatisticsBar(
    v-if="files.event_statistics_by_year"
    :selectedFile="files.event_statistics_by_year"
  )
  p.no-data(v-else) Geen gegevens voor dit veld.
</template>

<script setup>
import { ref, computed } from 'vue';
// In the bundle (2 kB gzipped) instead of fetched: the first field renders on the server already.
import fileList from '~/public/combined_files_list.json';

useHead({
  title: 'Statistieken',
  meta: [{ name: 'description', content: 'Landelijke statistieken van de KNRB per veld: uitslagen, tijden en verenigingen.' }],
});

const FOLDERS = ['event_results', 'event_statistics', 'event_statistics_by_year', 'event_times'];

const selectedEvent = ref(fileList[0] || null);
const searchQuery = ref(selectedEvent.value?.event_name || '');
const showDropdown = ref(false);
const activeIndex = ref(-1);
const typed = ref(false); // filter only after typing; on opening, show every field

const title = computed(() => selectedEvent.value?.event_name || 'Selecteer een veld');

// Files by folder, not by position: some fields lack a file.
const files = computed(() => {
  const byFolder = {};
  for (const file of selectedEvent.value?.files || []) {
    const folder = file.split('/')[0];
    if (FOLDERS.includes(folder)) byFolder[folder] = file;
  }
  return byFolder;
});

const normalise = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

const filteredEvents = computed(() => {
  if (!typed.value) return fileList;
  const query = normalise(searchQuery.value);
  if (!query) return fileList;
  return fileList.filter((event) =>
    normalise(event.event_name).includes(query) || normalise(event.code).includes(query)
  );
});

function openList() {
  if (showDropdown.value) return;
  typed.value = false;
  showDropdown.value = true;
  activeIndex.value = Math.max(0, fileList.indexOf(selectedEvent.value));
}

function closeList() {
  showDropdown.value = false;
  activeIndex.value = -1;
  // Leaving the field without choosing puts the chosen field's name back.
  searchQuery.value = selectedEvent.value?.event_name || '';
}

function onInput() {
  typed.value = true;
  showDropdown.value = true;
  activeIndex.value = filteredEvents.value.length ? 0 : -1;
}

function move(step) {
  if (!showDropdown.value) {
    openList();
    return;
  }
  const count = filteredEvents.value.length;
  if (!count) return;
  activeIndex.value = (activeIndex.value + step + count) % count;
  document.getElementById(`veld-${activeIndex.value}`)?.scrollIntoView({ block: 'nearest' });
}

function chooseActive() {
  const event = filteredEvents.value[activeIndex.value];
  if (event) selectEvent(event);
}

function selectEvent(event) {
  selectedEvent.value = event;
  closeList();
}
</script>

<style lang="scss" scoped>
.page-wrapper {
  display: flex;
  flex-direction: column;
  padding: 3rem 1rem 7.5rem; // the bottom space two invisible headings used to make
  height: 100%;
  margin-bottom: 4rem;
  @include tablet-small {
    padding-bottom: 5rem;
  }
}

// The sizes these headings had as h2 and h3.
.page-title {
  font-size: 2.5rem;
  text-transform: capitalize;
  margin-bottom: 1rem;
  @include tablet-small {
    font-size: 2rem;
  }
  @include mobile {
    font-size: 2.5rem;
  }
}
h2 {
  font: bold 1.125rem/1.5625rem "Lato";
  margin-bottom: 1rem;
}
.header{
  margin-bottom: 2rem;
}

.table {
  margin-bottom: 5rem;
}

.no-data {
  margin-bottom: 5rem;
  color: $black50;
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
  &:focus {
    border-color: $black50;
  }
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
  &.active {
    background-color: $black5;
  }
  &.empty {
    cursor: default;
    color: $black50;
  }
}
</style>
