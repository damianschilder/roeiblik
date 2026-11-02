<template lang="pug">
  .component-wrapper(ref="target" class="observed-element" :aria-busy="entry?.status === 'loading'")
    .content
      .tournament-event
        .event-name
          h3.match {{ race.matchName }}
          .result
            nuxt-icon.trophy(v-if="race.won" name="trophy" aria-hidden="true")
            span.sr-only(v-if="race.won") Gewonnen:
            span {{ resultText(race, team) }}
        .event-time(v-if="showDetailsLine")
          span {{ roleIn(team, personId) }}
          span {{ distanceAndTime }}
        p.details-error(v-if="entry?.status === 'error'")
          | Details van deze race konden niet worden geladen.
          button(type="button" @click="retry") Opnieuw proberen
        p.details-error(v-else-if="entry?.status === 'missing'") De KNRB heeft geen details van deze race.
        KNRBPersoonTournamentsPositions(
          v-if="round && round.teams.length > 0"
          :round="round"
          :race="race"
          :person-id="personId"
        )
  </template>

  <script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import type { Race } from '~/types/KNRB';
  import { resultText, roleIn, teamFor, useKNRBStore } from '~/stores/knrb';
  import useTimeFormatter from '@/composables/useTimeFormatter';

  const props = defineProps<{
    race: Race;
    personId: string;
  }>();

  const KNRBStore = useKNRBStore();
  const { formatTime } = useTimeFormatter();

  const entry = computed(() => KNRBStore.roundFor(props.race.raceId));
  const round = computed(() => entry.value?.data ?? null);
  const team = computed(() => teamFor(round.value, props.personId, props.race));

  // The line under the event appears once the race details are in (as before); if they cannot be
  // loaded, the time from the overview is still shown.
  const showDetailsLine = computed(() => entry.value?.status === 'done'
    || ((entry.value?.status === 'error' || entry.value?.status === 'missing') && props.race.endTime));

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

  // Race details load when the race comes near the screen, one request per race, cached.
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
    .event-name {
      display: flex;
      justify-content: space-between;
      font-weight: bold;
      font-size: 1.5rem;
      > .match {
        font: inherit;
        margin: 0 1rem 0 0;
      }
      .result {
        text-align: right;
      }
    }
    .event-time {
      display: flex;
      margin-top: 0.75rem;
      justify-content: space-between;
    }
  }
  .trophy {
    color: $roeiblik;
    margin-right: 0.25rem;
  }
  .details-error {
    margin-top: 0.75rem;
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
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  </style>
