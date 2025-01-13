<template lang="pug">
  .component-wrapper
    .content
      .table-wrapper
        table
          thead
            tr
              th ⚑
              th Vereniging
              th.left #
              th Slag
              th
              th.right(v-for="distance in positions[0].raceTeamTimes") {{distance.distance}}m
          tbody(v-for="(club, index) in filteredPositions" :key="index" ref="target" class="observed-element")
            tr
              td.left {{ club.endPosition }}
              td.club.left
                img(:src="club.oarBladeUrl" alt="KNRB logo")
                | {{ club.teamVersion.matchTeam.name }}
              td.left {{ club.teamVersion.teamMembers.find(member => member.person.personId === KNRBStore.person.personId)?.boatPosition || '' }}
              td {{club.teamVersion.teamMembers.find(member => member.isStroke).person.fullName}}
              td.expand(@click="toggleClub(index)") {{expandedLineups.includes(index) ? 'Verberg opstelling' : 'Toon opstelling'}}
              td.right(v-for="time in club.raceTeamTimes") 
                .times
                  span {{formatTime(time.time)}}
                  span.times-splits(v-if="time.splitTime !== 0") {{formatTime(time.splitTime)}}, {{time.position}}
            tr(v-if="expandedLineups.includes(index) && !preliminary")
              td
              td(colspan="8")
                .lineup
                  .rowers
                    span.title Opstelling {{props.preliminary}}
                    span( :class="{ 'active-rower': member.person.personId === KNRBStore.person.personId }" v-for="member in club.teamVersion.teamMembers.filter(member => !member.isCoach && !member.isCox).sort((a, b) => a.boatPosition - b.boatPosition) " :key="member.person.personId") {{member.boatPosition}} {{member.fullName}}
                    span(v-if="club.teamVersion.teamMembers.find(member => member.isCox)") (c) {{ club.teamVersion.teamMembers.find(member => member.isCox)?.fullName || '' }}
                  .coaches
                    span.title Coaches
                    span(v-for="member in club.teamVersion.teamMembers.filter(member => member.isCoach)" :key="member.person.personId" :class="{ 'active-rower': member.person.personId === KNRBStore.person.personId }") {{ member.fullName }}
                
      .checkbox(@click="toggleView")
        nuxt-icon(:name="showAllPositions ? 'less' : 'more'")
        span  {{showAllPositions ? `Toon alleen ${KNRBStore.person.fullName}` : `Alle posities`}}
</template>

<script setup lang="ts">
const KNRBStore = useKNRBStore();
import useTimeFormatter from '@/composables/useTimeFormatter';
import exp from 'constants';

const { formatTime } = useTimeFormatter();

const props = defineProps<{
  positions: Race;
  preliminary: boolean;
}>();

import { ref, computed } from 'vue';

const showAllPositions = ref(false);
const expandedLineups = ref([]); // Track expanded club index

function toggleView() {
  showAllPositions.value = !showAllPositions.value;
}

function toggleClub(index: number) {
  console.log(props.preliminary)
  const clubIndex = expandedLineups.value.indexOf(index);
  if (clubIndex === -1) {
    expandedLineups.value.push(index);
  } else {
    expandedLineups.value.splice(clubIndex, 1);
  }
}

function checkActiveRower(club: RaceTeam) {
  for (const person of club.teamVersion.teamMembers) {
    if (KNRBStore.person.personId === person.person.personId) {
      return true;
    }
  }
  return false;
}

function getLimitedPerson(personId: string) {
  KNRBStore.getLimitedPerson(personId);
}

const filteredPositions = computed(() => {
  const positions = showAllPositions.value
    ? props.positions
    : props.positions.filter((club: RaceTeam) => checkActiveRower(club));

  positions.forEach((club, index) => {
    club.teamVersion.teamMembers.forEach((member) => {
      if (
        !member.isCoach &&
        !member.isCox &&
        !KNRBStore.calledLimitedPersons.some((person) => person.personId === member.person.personId)
      ) {
        KNRBStore.calledLimitedPersons.push({
          fullName: member.person.fullName,
          personId: member.person.personId,
        });
        getLimitedPerson(member.person.personId);
      }
    });
  });
  return positions;
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
  padding-bottom: 0.25rem;
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
  text-align: center;
  text-decoration: underline;
  cursor: pointer;
}

.left {
  padding-right: 0.5rem;
}

.right {
  padding-left: 0.5rem;
}

tr {
  position: relative;
}

.lineup {
  display: flex;
  column-gap: 2rem;
  margin-bottom: 1rem;
  > .rowers, .coaches {
    display: flex;
    flex-direction: column;
    > .title {
      font-weight: bold;
      color: $black50;
      font-size: 0.85rem;
      margin-bottom: 0.25rem;
    }
  }
}

.active-rower {
  font-weight: bold;
}
</style>
