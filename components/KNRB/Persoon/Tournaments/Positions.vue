<template lang="pug">
  .component-wrapper
    .content
      .table-wrapper
        table
          thead
            tr
              th ⚑
              th Vereniging
              th #
              th Slag
              th 
              th.right(v-for="distance in positions[0].raceTeamTimes") {{distance.distance}}m
          tbody
            tr(v-for="(club, index) in filteredPositions" :key="index" ref="target" class="observed-element")
              td.left {{ club.endPosition }}
              td.club.left
                img(:src="club.oarBladeUrl" alt="KNRB logo")
                | {{ club.teamVersion.matchTeam.name }}
              td.left {{ club.teamVersion.teamMembers.find(member => member.person.personId === KNRBStore.person.personId)?.boatPosition || '' }}
              td {{club.teamVersion.teamMembers.find(member => member.isStroke).person.fullName}}
              td.expand
              td.right(v-for="time in club.raceTeamTimes") 
                .times
                  span {{formatTime(time.time)}}
                  span.times-splits(v-if="time.splitTime !== 0") {{formatTime(time.splitTime)}}, {{time.position}}
      .checkbox(@click="toggleView")
        nuxt-icon(:name="showAllPositions ? 'less' : 'more'")
        span  {{showAllPositions ? `Toon alleen ${KNRBStore.person.fullName}` : `Alle posities`}}
</template>

<script setup lang="ts">
const KNRBStore = useKNRBStore();
import useTimeFormatter from '@/composables/useTimeFormatter';

const { formatTime } = useTimeFormatter();

const props = defineProps<{
  positions: Race;
}>();

import { ref, computed } from 'vue';

// Reactive toggle state
const showAllPositions = ref(false);
// KNRBStore.getLimitedPerson('8d9a6a6a-c2be-44e1-8ef9-23277633c47e');
// Toggle function
function toggleView() {
  showAllPositions.value = !showAllPositions.value;
}

// Check if a club has the active rower
function checkActiveRower(club: RaceTeam) {
  for (const person of club.teamVersion.teamMembers) {
    if (KNRBStore.person.personId  === person.person.personId) {
      return true;
    }
  }
  return false;
}

// Filtered positions based on toggle state
const filteredPositions = computed(() => {
  if (showAllPositions.value) {
    return props.positions;
  }
  return props.positions.filter((club: RaceTeam) => checkActiveRower(club));
});
</script>

<style lang="scss" scoped>
.table-wrapper {
  overflow-x: auto;
}
table {
  width: 100%;
}

th {
  color: $black50;
  text-align: left;
  font-size: 0.85rem;
}

td {
  vertical-align: top;
  white-space: nowrap;
}

.content {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.checkbox {
  display: flex;
  // justify-content: center;
  flex: 1;
  color: black;
  font-size: 0.75rem;
  cursor: pointer;
  color: $black50;
  font-weight: normal;
  :deep(svg) {
    color: $black50;
  }
  &:hover {
    color: $black;
    :deep(svg) {
      color: $black;
    }
  }
}

.club {
  display: flex;
  column-gap: 0.5rem;
  align-items: center;
  width: max-content;
  img {
    height: 0.8rem;
  }
  @include mobile {
    width: 100%;
  }
}

.times {
  display: grid;
  flex-direction: column;
  grid-template-rows: 1fr 1fr;
  grid-template-columns: 1fr;
  width: min-content;
  > .times-splits {
    font-size: 0.75rem;
    color: $black60;
  }
}

.expand {
  width: 100%;
}

.left {
  padding-right: 0.5rem;
}

.right {
  padding-left: 0.5rem;
}
</style>
  