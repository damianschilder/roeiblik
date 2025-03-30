<template lang="pug">
.component-wrapper 
  .element-wrapper
    .element-body
      .error
      .tournaments
        KNRBPersoonTournamentsTournament(v-if="tournaments.length" v-for="tournament in tournaments" :tournament="tournament" :key="tournament.tournamentId")
      </template>

<script setup lang="ts">
import type { Person } from "~/types/KNRB";

const props = defineProps<{
  tournaments: Person['tournaments'];
}>();
</script>

<style lang="scss" scoped>
.component-wrapper {
  @include mobile {
    padding: 0 0.5rem;
  }
}
.tournaments {
  display: flex;
  flex-direction: column;
  row-gap: 2rem;
}
</style>