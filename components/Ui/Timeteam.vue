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
                  span {{ formatDate(race.date) }}
                  span {{ race.location }}
                .entry
                  img(:src="race.blades.crop")
                  span {{ race.entry_name }}
                .title
                  span(v-if="raceKey == 0") {{ race.field_name }}
                  span(v-else) {{ race.event_code }}
                  span(v-if="raceKey == 0").result {{ race.adjusted_position }} in {{ race.round_type_code }}
                  span(v-else).result {{ race.adjusted_position }} in {{ race.round_type_name }}
                .bottom-label
                  span.role {{ race.role }}
                  span.time {{race.timing_layout.code}} in {{ race.result }}
                .rules(v-if="race.rules.length > 0")
                  span {{ race.rules[0].code }} door
                .icon(v-if="raceKey === event.length - 1")
                  nuxt-icon(
                    :name="expandedRaceKey === `${crewKey}-${eventKey}-${raceKey}` ? 'less' : 'more'"
                    @click="toggleExpand(crewKey, eventKey, raceKey)"
                  )
                transition(name="expand")
                  .expand(v-show="expandedRaceKey === `${crewKey}-${eventKey}-${raceKey}`")
                    .rowers
                      h4 Roeiers
                      span(v-for="(rower, idx) in race.rowers") {{ idx + 1 }} {{ rower.name }}
                      span (c) {{race.coxes[0]}}
                    .coaches
                      h4 Coaches
                      span(v-for="coach in race.coaches") {{ coach }}
  
                    .boat
                      h4 Boot
                      span {{ race.boat_name }}
                      
  
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

// Function to determine the appropriate class for each race
function getRaceClass(race: any, event: any[]): string {
  const finalsOrder = ['FA', 'FB', 'FC', 'FD', 'FE', 'HF', 'KF', 'E', 'TT'];
  const highestAttainedFinal = event.length === 1 ? race : event.find(e => finalsOrder.includes(e.round_type_code)) || { round_type_code: '' };

  if (race.round_type_code === highestAttainedFinal.round_type_code) {
    return 'final';
  } else if (['E', 'TT', 'HF', 'KF'].includes(race.round_type_code) || !race.round_type_code || /^R\d*$/.test(race.round_type_code)) {
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
    return 'Invalid Date';
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return 'Invalid Date'; // Handle cases where the date cannot be parsed
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
    row-gap: 2rem;
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
      padding: 3rem 0 3rem;
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
        margin: 0.07rem 0 0.35rem;
        font-size: 1.5rem;
        font-weight: bold;
        .title {
        }
        .result {
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
        margin-top: 1.5rem;
        margin-bottom: 1rem;
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
    display: flex;
    justify-content: space-between;
    overflow: hidden;
    @include tablet-small {
      display: grid;
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
  margin-top: 1rem;
  border-left: 1px solid rgba(0, 0, 0, 0.05);

  margin-left: 1rem;
  .top-label, .entry,  {
    display: none!important;
  }
  .expand {
    padding-left: 1rem;
  }
  .title {
    >:first-child {
      font-size: 1.2rem;
      font-weight: normal;
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
    font-size: 1.2rem!important;
    font-weight: normal!important;
  }
  .time {
    font-size: 0.9rem;
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
  