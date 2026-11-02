<template lang="pug">
  .component-wrapper
    .content
      .tournament
        .tournament-info
          h2.name {{ tournament.tournamentName }}
          //- On a phone the first day only, as always: a range would push the name onto two lines.
          time(v-if="dateText" :datetime="isoDate(tournament.firstTournamentDate)")
            span.range {{ dateText }}
            span.first-day {{ firstDayText }}
        .races
          .race(v-for="race in tournament.races" :key="`${race.raceId}|${race.teamName}`")
            KNRBPersoonTournamentsRace(:race="race" :person-id="personId")
            KNRBPersoonTournamentsPreliminary(
              v-for="preliminary in race.preliminaries"
              :key="`${preliminary.raceId}|${preliminary.teamName}`"
              :race="preliminary"
              :person-id="personId"
            )
  </template>

  <script setup lang="ts">
  import { computed } from 'vue';
  import type { Tournament } from '~/types/KNRB';

  const props = defineProps<{
    tournament: Tournament;
    personId: string;
  }>();

  // foys sends "2025-05-24T00:00:00" without a time zone: read the date part only, so the day
  // cannot shift with the visitor's time zone.
  function isoDate(value: string | null): string {
    return typeof value === 'string' ? value.slice(0, 10) : '';
  }

  function toDate(value: string | null): Date | null {
    const match = isoDate(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match || match[1] === '0001') return null;
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  const long: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };

  const firstDayText = computed(() => toDate(props.tournament.firstTournamentDate)?.toLocaleDateString('nl-NL', long) ?? '');

  // "24 mei 2025"; for a regatta over more days "24 – 25 mei 2025" or "30 april – 1 mei 2022".
  const dateText = computed(() => {
    const first = toDate(props.tournament.firstTournamentDate);
    const last = toDate(props.tournament.lastTournamentDate);
    if (!first) return '';
    const full = first.toLocaleDateString('nl-NL', long);
    if (!last || last.getTime() <= first.getTime()) return full;
    const end = last.toLocaleDateString('nl-NL', long);
    if (first.getFullYear() !== last.getFullYear()) return `${full} – ${end}`;
    if (first.getMonth() !== last.getMonth()) {
      return `${first.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })} – ${end}`;
    }
    return `${first.getDate()} – ${end}`;
  });
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
      column-gap: 0.5rem;
      margin-bottom: 0.5rem;
      > .name {
        font: inherit;
        margin: 0;
      }
      > time {
        text-align: right;
        .first-day {
          display: none;
        }
        @include mobile {
          .range {
            display: none;
          }
          .first-day {
            display: inline;
          }
        }
      }
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
