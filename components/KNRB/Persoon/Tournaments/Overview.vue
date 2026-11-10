<template lang="pug">
  .component-wrapper
    .element-wrapper
      .element-body
        .overview
          .filters(v-if="person.stats.wins > 0")
            UiWon(v-model="onlyWon")

          .header
            span(role="status") {{ headerText }}
          .tournaments(v-if="displayTournaments.length > 0")
            KNRBPersoonTournamentsTournament(
              v-for="tournament in displayTournaments"
              :tournament="tournament"
              :person-id="person.personId"
              :key="tournament.tournamentId ?? `${tournament.tournamentName}|${tournament.firstTournamentDate}`"
            )
          .no-results(v-else)
            p {{ noResultsText }}
  </template>

  <script setup lang="ts">
  import { computed, ref } from 'vue';
  import type { Person, Tournament } from '~/types/KNRB';

  const props = defineProps<{
    person: Person;
  }>();

  const onlyWon = ref(false);

  // "Alleen winsten": the events that were won (decided on the server, see server/api/knrb/person.js),
  // with the earlier rounds that led there.
  const displayTournaments = computed((): Tournament[] => {
    const all = props.person.tournaments ?? [];
    if (!onlyWon.value) return all;
    return all
      .map((tournament) => ({ ...tournament, races: tournament.races.filter((race) => race.won) }))
      .filter((tournament) => tournament.races.length > 0);
  });

  // Counted per entry (one crew in one event), like the Time-Team page: with "Alleen winsten" the
  // number is the wins. (It used to count tournaments: two wins at one regatta read as one.)
  const headerText = computed(() => {
    const count = displayTournaments.value.reduce((sum, tournament) => sum + tournament.races.length, 0);
    if (onlyWon.value) return `${count} ${count === 1 ? 'winst' : 'winsten'}`;
    return `${count} ${count === 1 ? 'vermelding' : 'vermeldingen'}`;
  });

  const noResultsText = computed(() => (onlyWon.value
    ? 'Geen wedstrijden gevonden met gewonnen hoogst behaalde races.'
    : 'Geen wedstrijden gevonden.'));
  </script>

  <style lang="scss" scoped>
  // (A local $black50 of 0.5 used to override the shared one here: 3.87:1, under WCAG AA. The
  // shared $black50 from _variables.scss gives 4.6:1.)

  @mixin mobile {
    @media (max-width: 768px) {
      @content;
    }
  }

  .overview {
    padding-top: 2rem;
  }

  .component-wrapper {
    @include mobile {
      padding: 0 0.5rem;
    }
  }

  .filters {
    display: flex;
    margin-bottom: 1rem;
    :deep(label) {
      cursor: pointer;
    }
  }

  .tournaments {
    display: flex;
    flex-direction: column;
    row-gap: 2rem;
    margin-top: 0.5rem;
  }

  .header {
    display: flex;
    justify-content: space-between;
    color: $black50;
    font-size: 0.9rem;
    font-weight: bold;
    padding: 0 0.5rem;
    padding-bottom: 0.1rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }

  .no-results {
      padding: 1rem 0.5rem;
      color: $black50;
      font-style: italic;
  }
  </style>
