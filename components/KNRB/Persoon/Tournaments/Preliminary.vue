<template lang="pug">
  .component-wrapper(ref="target" class="observed-element" :aria-busy="entry?.status === 'loading'")
    .content
      .tournament-event
        .event-name
          h4.match {{ race.matchCode }}
          .result
            span {{ resultText(race, team) }}
        .event-time(v-if="showDetailsLine")
          span {{ distanceAndTime }}
        p.details-error(v-if="entry?.status === 'error'")
          | Details van deze race konden niet worden geladen.
          button(type="button" @click="retry") Opnieuw proberen
        KNRBPersoonTournamentsPositions(
          v-if="round && round.teams.length > 0"
          :round="round"
          :race="race"
          :person-id="personId"
        )
  </template>

  <script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import type { RaceResult } from '~/types/KNRB';
  import { resultText, teamFor, useKNRBStore } from '~/stores/knrb';
  import useTimeFormatter from '@/composables/useTimeFormatter';

  const props = defineProps<{
    race: RaceResult;
    personId: string;
  }>();

  const KNRBStore = useKNRBStore();
  const { formatTime } = useTimeFormatter();

  const entry = computed(() => KNRBStore.roundFor(props.race.raceId));
  const round = computed(() => entry.value?.data ?? null);
  const team = computed(() => teamFor(round.value, props.personId, props.race));

  const showDetailsLine = computed(() => entry.value?.status === 'done' || (entry.value?.status === 'error' && props.race.endTime));

  const distanceAndTime = computed(() => {
    const time = team.value?.time ?? props.race.endTime;
    const parts = [];
    if (round.value?.distance) parts.push(`${round.value.distance}m`);
    if (time) parts.push(formatTime(time));
    return parts.join(', ');
  });

  function retry() {
    KNRBStore.loadRound(props.race.tournamentId, props.race.raceId, { retry: true });
  }

  // Loaded once, when the race comes near the screen (before: on every scroll into view).
  const target = ref<HTMLElement | null>(null);
  const { isIntersecting, observe } = useIntersectionObserver();
  let stop: (() => void) | null = null;

  onMounted(() => {
    if (target.value) stop = observe(target.value, { root: null, rootMargin: '200px 0px', threshold: 0 });
  });
  onBeforeUnmount(() => {
    stop?.();
    stop = null;
  });
  watch(isIntersecting, (visible) => {
    if (!visible) return;
    KNRBStore.loadRound(props.race.tournamentId, props.race.raceId);
    stop?.();
    stop = null;
  });
  </script>

  <style lang="scss" scoped>
  .tournament-event {
    padding: 0.5rem 0 1rem;
    .event-name {
      display: flex;
      justify-content: space-between;
      font-weight: bold;
      column-gap: 1rem;
      font-size: 1.15rem;
      > .match {
        font: inherit;
        margin: 0;
      }
      > .result {
        text-align: right;
      }
    }
    .event-time {
      display: flex;
      justify-content: flex-end;
      margin-top: 0.25rem;
    }
  }

  .details-error {
    margin-top: 0.25rem;
    font-size: 0.9rem;
    color: $black50;
    button {
      font: inherit;
      margin-left: 0.5rem;
      padding: 0;
      border: none;
      background: none;
      color: inherit;
      text-decoration: underline;
      cursor: pointer;
      &:hover {
        color: $black;
      }
      &:focus-visible {
        outline: 2px solid $red;
        outline-offset: 2px;
      }
    }
  }

  .content {
    margin: 1.5rem 1rem 0 2rem;
    padding-left: 1rem;
    border-left: 1px solid $black10;
    @include mobile {
      margin: 0.25rem 0.5rem 0 0.5rem;
    }
  }
  </style>
