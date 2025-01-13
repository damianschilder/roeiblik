<template lang="pug">
.component-wrapper(ref="target" class="observed-element")
  .content
    .tournament-event
      .event-club
        span {{race.teamName}}
      .event-name
        span {{race.matchName}}
        .result
          span {{formatPosition(race.position)}}, {{race.raceName}}
      .event-time(v-if="race.distance")
        span {{getPosition(race)}}
        span {{race.distance}}m, {{formatTime(race.endTime)}}
      KNRBPersoonTournamentsPositions(v-if="race.raceTeams && race.raceTeams.length > 0" :positions="race.raceTeams")
</template>

<script setup lang="ts">
import type { Race } from "~/types/KNRB";
const KNRBStore = useKNRBStore();
import useTimeFormatter from '@/composables/useTimeFormatter';
  
const { formatTime } = useTimeFormatter();
const props = defineProps<{
  race: Race;
}>();

const fetchedRaces = ref([]);

function formatPosition(position: number) {
  if (!position) return null;
  return position + (position === 1 ? 'ste' : 'de');
}

function handleViewportEnter(tournamentId: Race['tournamentId'], raceId: Race['raceId']) {
  KNRBStore.getRound(tournamentId, raceId);
}

function getPosition(race: Race) {
  if (!race.raceTeams) return '';

  for (const team of race.raceTeams) {
    const member = team.teamVersion.teamMembers.find(
      (member) => member.person.personId === KNRBStore.person.personId
    );
    if (member) {
      if (member.isCoach) return 'Coach';
      if (member.isCox) return 'Stuur';
      return 'Roeier';
    }
  }
  return '';
}

const target = ref(null);
const { isIntersecting: isVisible, observe } = useIntersectionObserver();

onMounted(() => {
  if (target.value) {
    const unobserve = observe(target.value, {
      root: null,
      threshold: 0.1,
    });

    onUnmounted(() => {
      unobserve();
    });
  }
});

watch(isVisible, (newValue) => {
  if (newValue) {
    if (!fetchedRaces.value.includes(props.race.raceId)) {
      fetchedRaces.value.push(props.race.raceId);
      handleViewportEnter(props.race.tournamentId, props.race.raceId);
    }
  }
});
</script>

<style lang="scss" scoped>
.tournament-event {
  padding: 0.5rem 0 0;
  .event-club {
  }
  .event-name {
    display: flex;
    justify-content: space-between;
    font-weight: bold;
    font-size: 1.5rem;
    .result {
      text-align: right;
    }
  }
  .event-time {
    display: flex;
    justify-content: space-between;
  }
}
</style>