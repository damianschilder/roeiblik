<template lang="pug">
.component-wrapper
  .content
    .tournament
      .tournament-info
        span {{tournament.tournamentName}}
        span {{ new Date(tournament.firstTournamentDate).toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' }) }}
      .race(v-for="race in tournament.races" :key="race.raceId")
        KNRBPersoonTournamentsRace(:race="race")
        KNRBPersoonTournamentsPreliminary( v-for="preliminary in race.preliminaries" :race="preliminary")

</template>

<script setup lang="ts">
import type { Tournament } from "~/types/KNRB";
// const KNRBStore = useKNRBStore();

const props = defineProps<{
  tournament: Tournament;
}>();
</script>

<style lang="scss" scoped>
.tournament {
  display: flex;
  flex-direction: column;
  row-gap: 2rem;
  padding: 3rem 0 2rem;
  border-bottom: 1px solid $black10;
  > .tournament-info {
    display: flex;
    color: $black50;
    font-size: 0.85rem;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }
  .race {
    display: flex;
    flex-direction: column;
    // row-gap: 2rem;
  }
}
</style>