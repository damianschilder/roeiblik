<template lang="pug">
  .component-wrapper 
    .element-wrapper
      .element-body
                
        .error(v-if="rowerStore.error") Can't connect to databank. Please try again later.
        .races
          .header
            span {{ formatDate(rowerStore.rower.firstEntryDate) }}
            span {{Object.keys(rowerStore.rower.allRaceCrewInfo).length}} races
            span {{ formatDate(rowerStore.rower.lastEntryDate) }}
          .race(v-for="(race, index) in filteredRaces" :key="index")
            .top-label
              span {{ formatDate(race.date) }}
              span {{ race.location }}
            .title
              span {{ race.field_name }}
              span.result {{ race.adjusted_position }} in {{ race.round_type_code }}
            .bottom-label
              span {{ race.role }}
              span {{ race.result }}
            .icon
              nuxt-icon(:name="expandedRaces[index] ? 'less' : 'more'", @click="toggleExpand(index)")
            transition(name="expand")
              .expand(v-show="expandedRaces[index]")
                .rowers
                  h4 Roeiers
                  span(v-for="(rower, idx) in race.rowers") {{ idx + 1 }} {{ rower.name }}
                  span(v-for="(cox, idx) in race.coxes") (C) {{ cox }}
                .coaches
                  h4 Coaches
                  span(v-for="(coach, idx) in race.coaches") {{ coach }}
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
  
  // Computed property to get all races
  const filteredRaces = computed(() => {
    return Object.values(rowerStore.rower.allRaceCrewInfo || {});
  });
  
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
    }
    .race {
      width: 100%;
      padding: 1rem 0 2rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      .top-label {
        display: flex;
        justify-content: space-between;
      }
      .top-label {
        color: $neutral50;
        font-size: 0.9rem;
      }
      .title {
        /* text-transform: capitalize; */
        display: flex;
        justify-content: space-between;
        column-gap: 2.5rem;
        /* line-height: 1.1rem; */
        margin: 0.07rem 0 0.35rem;
        font-size: 1.5rem;
        font-weight: bold;
        .title {
        }
        .result {
          text-align: right;
        }
      }
      .bottom-label {
        display: flex;
        justify-content: space-between;
        font-size: 1.15rem;
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
    >:nth-child(2) {
      padding: 0.75rem 0 2rem;
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
    .rowers, .coxes, .coaches, .boot {
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
    .boot {
      grid-area: boot;
      @include mobile {
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
  </style>
