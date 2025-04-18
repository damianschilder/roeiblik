<template lang="pug">
  .component-wrapper
    .content
      .tournament
        .tournament-info
          span {{ tournament.tournamentName }}
          span {{ new Date(tournament.firstTournamentDate).toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' }) }}
        .races
          .race(v-for="race in tournament.races" :key="race.raceId")
            KNRBPersoonTournamentsRace(:race="race")
            // You may also choose to pass the onlyWon flag to the preliminary component if needed.
            KNRBPersoonTournamentsPreliminary(
              v-for="preliminary in race.preliminaries" 
              :key="preliminary.raceId || preliminary.id" 
              :race="preliminary"
            )
  </template>
  
  <script setup lang="ts">
  import type { Tournament } from '~/types/KNRB'
  
  const props = defineProps<{
    tournament: Tournament;
  }>()
  </script>
  
  <style lang="scss" scoped>
  .tournament {
    display: flex;
    flex-direction: column;
    padding: 3rem 0 2rem;
    border-bottom: 1px solid $black10;
    > .tournament-info {
      display: flex;
      color: $black50;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }
    .races {
      display: flex;
      flex-direction: column;
      row-gap: 4rem;
    }
    .race {
      display: flex;
      flex-direction: column;
    }
  }
  </style>
  