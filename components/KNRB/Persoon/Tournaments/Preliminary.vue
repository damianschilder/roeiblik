<template lang="pug">
  .component-wrapper(ref="target" class="observed-element")
    .content
      .tournament-event
        .event-name
          //- span {{race.matchCode}}
          .result
            span {{formatPosition(race.position)}}, {{race.raceName}}
        .event-time(v-if="race.distance")
          span {{race.distance}}, {{formatTime(race.endTime)}}
        KNRBPersoonTournamentsPositions(v-if="race.raceTeams && race.raceTeams.length > 0" :positions="race.raceTeams" preliminary=true)
  </template>
  
  <script setup lang="ts">
  import type { Race } from "~/types/KNRB";
  const KNRBStore = useKNRBStore();
  import useTimeFormatter from '@/composables/useTimeFormatter';
    
  const { formatTime } = useTimeFormatter();
  const props = defineProps<{
    race: Race;
  }>();
  
  function formatPosition(position: number) {
    if (!position) return null;
    return position + (position === 1 ? 'ste' : 'de');
  }
  
  // Function to be called
  function handleViewportEnter(tournamentId: Race['tournamentId'], raceId: Race['raceId']) {
    // console.log(`Element entered the viewport for Tournament ID: ${tournamentId}, Race ID: ${raceId}`);
    // Add any additional logic here, such as an API call
    KNRBStore.getRound(tournamentId, raceId);
  
  }
  
  const target = ref(null);
  const { isIntersecting: isVisible, observe } = useIntersectionObserver();
  
  onMounted(() => {
    if (target.value) {
      // console.log('Setting up observer...');
      const unobserve = observe(target.value, {
        root: null, // Use the viewport
        threshold: 0.1, // Trigger when 10% of the element is visible
      });
  
      onUnmounted(() => {
        // console.log('Cleaning up observer...');
        unobserve();
      });
    }
  });
  
  // Watch for visibility changes and call the function
  watch(isVisible, (newValue) => {
    if (newValue) {
      handleViewportEnter(props.race.tournamentId, props.race.raceId);
    }
  });
  </script>
  
  <style lang="scss" scoped>
  .tournament-event {
    padding: 0.5rem 0 1rem;
    .event-club {
    }
    .event-name {
      display: flex;
      /* justify-content: flex-end; */
      font-weight: bold;
      font-size: 1.15rem;
      > .result {
        text-align: right;
      }
    }
    .event-time {
      display: flex;
      /* justify-content: flex-end; */
    }
  }

.content {
  margin: 1rem 1rem 0 2rem;
  padding-left: 1rem;
  border-left: 1px solid $black10;
  @include mobile {
    margin: 0.25rem 0.5rem 0 0.5rem;
  }
}
  </style>