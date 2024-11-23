<template lang="pug">
  .component-wrapper 
    .element-wrapper
      .element-body
        .error(v-if="rowerStore.error") Can't connect to databank. Please try again later.
        .races( v-if="rowerStore.rower.firstEntryDate")
          .header
            span {{ formatDate(rowerStore.rower.firstEntryDate) }}
            span {{Object.keys(rowerStore.rower.allRaceCrewInfo).length}} races
            span {{ formatDate(rowerStore.rower.lastEntryDate) }}
          .race(v-for="(crew, crewKey) in rowerStore.rower.allRaceCrewInfo" :key="crewKey")
            .race-event(v-for="(event, eventKey) in crew" :key="eventKey" :class="event.length > 1 ? 'multiple-events' : 'single-event'")
              .race-detail(v-for="(race, raceKey) in event" :class="getRaceClass(race, event)")
                .top-label
                  span {{ formatDate(race.date) || 'Datum niet aanwezig' }}
                  span {{ race.location || 'Locatie niet aanwezig' }}
                .entry
                  img(v-if="race.blades" :src="race.blades.crop")
                  span {{ race.entry_name || 'Niet aanwezig' }}
                .title
                  span {{ raceKey == 0 ? (race.field_name || 'Niet aanwezig') : (race.event_code || 'Niet aanwezig') }}
                  .result 
                    nuxt-icon(v-if="race.adjusted_position === 1 && (race.round_type_code === 'FA' || /^\d/.test(race.round_type_code))" name="trophy")

                    span
                      | {{ formatPosition(race.adjusted_position) || (raceKey == 0 ? 'Niet aanwezig' : 'Tijd ontbreekt') }} in 
                      | {{ raceKey == 0 ? (race.round_type_code || `${race.timing_layout.distance}m`) : (race.round_type_name || 'ontbreekt') }}
                .bottom-label
                  span.role {{ race.role }}
                  span(v-if="race.result").time {{ race.timing_layout.code }} in {{ race.result }}
                .rules(v-if="race.rules.length > 0 && race.result")
                  span {{ race.rules[0].code || 'niet gevonden' }} door
                .icon(v-if="raceKey === 0")
                  nuxt-icon(
                    :name="expandedRaceKey === `${crewKey}-${eventKey}-${raceKey}` ? 'less' : 'more'"
                    @click="toggleExpand(crewKey, eventKey, raceKey)"
                  )
                transition(name="expand")
                  .expand(v-show="expandedRaceKey === `${crewKey}-${eventKey}-${raceKey}`")
                    .rowers
                      h4 Roeiers
                      span(v-for="(rower, idx) in race.rowers") {{ idx + 1 }} {{ rower.name || 'niet gevonden' }}
                      span(v-if="race.coxes[0]") (c) {{race.coxes[0] || 'niet gevonden'}}
                    .coaches
                      h4 Coaches
                      span(v-for="coach in race.coaches") {{ coach || 'niet gevonden' }}
                    .boat
                      h4 Boot
                      span {{ race.boat_name || 'niet gevonden' }}
                      
  
  </template>
  
  <script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useRowersStore } from '@/stores/rowers';

const rowerStore = useRowersStore();
const route = useRoute();

// Store the currently expanded race key
const expandedRaceKey = ref<string | null>(null);

function toggleExpand(crewKey: string, eventKey: string, raceKey: string) {
  const uniqueKey = `${crewKey}-${eventKey}-${raceKey}`;
  if (expandedRaceKey.value === uniqueKey) {
    // Collapse if the same race is clicked again
    expandedRaceKey.value = null;
  } else {
    // Expand the new race and collapse others
    expandedRaceKey.value = uniqueKey;
  }
}

function formatPosition(position) {
  if (!position) return null;
  return position + (position === 1 ? 'ste' : 'de');
}

// Function to determine the appropriate class for each race
function getRaceClass(race: any, event: any[]): string {
  const finalsOrder = ['FA', 'FB', 'FC', 'FD', 'FE', 'HF', 'KF', 'E', 'H', 'TT'];
  const highestAttainedFinal = event.length === 1 ? race : event.find(e => finalsOrder.includes(e.round_type_code)) || { round_type_code: '' };

  if (race.round_type_code === highestAttainedFinal.round_type_code) {
    return 'final';
  } else if (['E', 'H', 'TT', 'HF', 'KF'].includes(race.round_type_code) || !race.round_type_code || /^R\d*$/.test(race.round_type_code)) {
    return event.length === 1 ? 'final' : 'preliminary';
  } else if (/^\d+m$/.test(race.round_type_code) && event.length > 1) {
    return 'multiple-distance';
  } else if (/^\d+m$/.test(race.round_type_code)) {
    return 'distance';
  } else {
    return '';
  }
}

// Function to format the date to "5 June 2022"
function formatDate(dateInput: string | string[]): string {
  let dateString: string;

  // Handle if dateInput is an array
  if (Array.isArray(dateInput) && dateInput.length > 0) {
    dateString = dateInput[0]; // Use the first date in the array
  } else if (typeof dateInput === 'string') {
    dateString = dateInput;
  } else {
    return undefined;
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return undefined; // Handle cases where the date cannot be parsed
  }

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

</script>
  
<style lang="scss" scoped>
.multiple-events {
  display: flex;
  flex-direction: column;
  /* row-gap: 1.2rem; */

  > :not(:first-child) {
    margin-top: 1rem;
    .entry, .top-label {
      display: none!important;
    }
    .role {
      visibility: hidden;
    }
    margin-top: 1rem;
  }
}

  

  
  .final {
  }
  
  .distance {
  }
  
  .knocked-out {
  }
  
  .multiple-distance {
  }
  
  .component-wrapper {
    margin-top: 2rem;
    .element-wrapper {
      .element-body {
        display: flex;
        justify-content: center;
        .loading {
          width: 2rem;
          height: 2rem;
          margin-top: initial;
          &:deep(.loader) {
            width: 2rem;
            height: 2rem;
          }
        }
        &:deep(.nuxt-icon svg) {
        }
      }
    }
  }
  
  .races {
    display: flex;
    flex: 1;
    flex-direction: column;
    max-width: 70%;
    @include mobile {
      max-width: initial;
    } 
    .header {
      display: flex;
      justify-content: space-between;
      color: $neutral50;
      font-size: 0.9rem;
      padding-bottom: 0.1rem;
      font-weight: bold;
      padding-bottom: 0.1rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);

    }
    .race {
      display: flex;
      flex-direction: column;
      row-gap: 2rem;
      width: 100%;
      padding: 3rem 0 1.5rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      &:last-child {
        border: initial;
      }
      .top-label {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.8rem;
      }
      .top-label {
        color: $neutral50;
        font-size: 0.9rem;
      }
      .entry {
        display: flex;
        column-gap: 0.25rem;
        align-items: center;
        text-transform: capitalize;
        img {
          height: 0.8rem;
        }
      }
      .title {
        text-transform: capitalize;
        display: flex;
        justify-content: space-between;
        column-gap: 2.5rem;
        font-size: 1.5rem;
        font-weight: bold;
        .title {
        }
        .result {
          display: flex;
          column-gap: 0.2rem;
          text-transform: initial;
          text-align: right;
          min-width: 5rem;
        }
      }
      .bottom-label {
        margin-top: 0.75rem;
        display: flex;
        justify-content: space-between;
        font-size: 1.15rem;
      }
      .icon {
        margin-top: 0.5rem;
        display: flex;
        justify-content: center;
        .nuxt-icon {
          cursor: pointer;
          padding: 0.1rem 0.3rem;
          &:hover {
            background-color: rgba(230, 0, 0, 0.03);
            border-radius: 50px;
          }
        }
      }
    }
    >:nth-child(2) {
      padding-top: 1.5rem;
    }
  }
  
  .expand {
    margin: 0.5rem;
    display: flex;
    justify-content: space-between;
    overflow: hidden;
    @include tablet-small {
      display: grid;
      grid-template-columns: auto max-width;
      grid-template-areas: 
        "roeiers coaches"
        "boot boot";
    }
    .rowers, .coxes, .coaches, .boat {
      display: flex;
      row-gap: 0.05rem;
      flex-direction: column;
      >:first-child {
        color: $neutral50;
        font-weight: bold;
        margin-bottom: 0.25rem;
      }
    }
    .rowers {
      grid-area: roeiers;
    }
    .coaches {
      grid-area: coaches;
    }
    .boat {
      grid-area: boot;
      @include tablet-small {
        margin-top: 1rem;
    }
    }
  }
  
  .expand-enter-active, .expand-leave-active {
    transition: max-height 0.3s ease;
  }
  
  .expand-enter-from, .expand-leave-to {
    max-height: 0;
  }
  
  .expand-enter-to, .expand-leave-from {
    max-height: 500px; // Use a value large enough to accommodate your content
  }

.preliminary {
  border-left: 1px solid rgba(0, 0, 0, 0.05);

  margin-left: 1rem;
  margin-right: 2rem;
  margin-top: 1rem!important;
  .top-label, .entry,  {
    display: none!important;
  }
  .expand {
    padding-left: 1rem;
  }
  .title {
    margin-top: initial!important;
    >:first-child {
      font-size: 1.1rem;
      font-weight: bold;
      padding-left: 1rem;
    }
  }
  .role {
    visibility: hidden;
  }
  .bottom-label {
    display: flex;
    column-gap: 2rem;
  }
  .rules {
    margin-left: 2rem;
    font-size: 0.9rem;
  }
  .result {
    font-size: 1.1rem!important;
    font-weight: normal!important;
    font-weight: bold!important;
  }
  .time {
    font-size: 0.85rem;
    min-width: max-content;
  }
}
.rules {
  display: flex;
  justify-content: end;
  color: $neutral-variant50;
}
.rules2 {
  font-size: 1rem!important;
}
</style>
  