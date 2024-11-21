<template lang="pug">
.component-wrapper 
  .element-wrapper
    .element-body
              

      .races
        span {{formatDate(rowerStore.rower.firstEntryDate)}} - {{formatDate(rowerStore.rower.lastEntryDate)}}
        .race(v-for="(race, index) in rowerStore.rower.allRaceCrewInfo" :key="index")
          .top-label
            span {{ formatDate(race.date) }}
            span {{ race.location }}
          .title
            h3 {{ race.field_name }}
            h4 {{ race.adjusted_position }} in {{ race.round_type_code }}
          .bottom-label
            span {{ race.role }}
            span {{ race.result }}
          .icon
            nuxt-icon(:name="expandedRaces[index] ? 'less' : 'more'", @click="toggleExpand(index)")
          transition(name="expand")
            .expand(v-show="expandedRaces[index]")
              .rowers
                h4 Roeiers
                span(v-for="(rower, index) in race.rowers") {{ index + 1 }} {{ rower.name }}
                span(v-for="cox in race.coxes") (C) {{ cox }}
              .coaches
                h4 Coaches
                span(v-for="coach in race.coaches") {{ coach }}
              .boot
                h4 Boot
                span {{ race.boat_name }}
  </template>
  

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useRowersStore } from '@/stores/rowers';

const rowerStore = useRowersStore();
const route = useRoute();

// Use an array to track expanded states for each race
const expandedRaces = ref<boolean[]>([]);

function toggleExpand(index: number) {
  // Toggle the expanded state for the specific race
  expandedRaces.value[index] = !expandedRaces.value[index];
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
  /* row-gap: 2rem; */
  max-width: 70%;
  @include mobile {
    max-width: initial;
  } 
  > span {
    color: $neutral50;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }
  .race {
    width: 100%;
    padding: 0 0 2rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    .top-label {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.1rem;
    }
    .title {
      text-transform: capitalize;
      display: flex;
      justify-content: space-between;

    }
    .bottom-label {
      display: flex;
      justify-content: space-between;
    }
    .result {

    }
    .icon {
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
}

// @include tablet-medium {
//   .slot-wrapper {
//     display: none;
//   }
//   .noMobile {
//     display: flex;
//   }
// }
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
  .rowers, .coxes, .coaches {
    display: flex;
    flex-direction: column;
  }
  .rowers {
    grid-area: roeiers;
  }
  .coaches {
    grid-area: coaches;
  }
  .boot {
    grid-area: boot;
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

</style>
