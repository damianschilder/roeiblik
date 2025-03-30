<template lang="pug">
  .component-wrapper
    .content
      .checkbox(@click="toggleView")
        nuxt-icon(:name="showAllPositions ? 'less' : 'more'")
        span {{ showAllPositions ? `Toon alleen ${KNRBStore.person.fullName}` : `Alle posities` }}
    .table-wrapper
      table
        thead
          tr
            th
            th ⚑
            th Vereniging
            th.left #
            th.mobile Slag
            th.right(v-for="(distance, dIndex) in positions[0].raceTeamTimes" :key="dIndex") {{ distance.distance }}m
        tbody
          //- Wrap both rows in a template so each iteration gets its own index and club data
          template(v-for="(club, index) in filteredPositions" :key="index")
            tr.row(ref="target" class="observed-element" @click="!preliminary && toggleClub(index)")
              td.expand( v-if="!preliminary")
                nuxt-icon(:name="expandedLineups.includes(index) ? 'less' : 'more'")
              td(v-else)
              td.left {{ club.endPosition }}
              td.club.left {{ club.teamVersion.matchTeam.name }}
              td.left {{ club.teamVersion.teamMembers.find(member => member.person.personId === KNRBStore.person.personId)?.boatPosition || '' }}
              td.mobile {{ club.teamVersion.teamMembers.find(member => member.isStroke).person.fullName }}
              td.right(v-for="(time, tIndex) in club.raceTeamTimes" :key="tIndex")
                .times
                  span {{ formatTime(time.time) }}
                  //- Uncomment below if you need to show split times:
                  //- span.times-splits(v-if="time.splitTime !== 0") {{ formatTime(time.splitTime) }}, {{ time.position }}
            tr(v-if="expandedLineups.includes(index) && !preliminary")
              td
              td(colspan="8")
                .lineup
                  .rowers
                    span.title Opstelling
                    span(
                      v-for="member in club.teamVersion.teamMembers.filter(member => !member.isCoach && !member.isCox).sort((a, b) => a.boatPosition - b.boatPosition)"
                      :key="member.person.personId"
                      :class="{ 'active-rower': member.person.personId === KNRBStore.person.personId }"
                    )
                      | {{ member.boatPosition }} {{ member.fullName }}
                    span(v-if="club.teamVersion.teamMembers.find(member => member.isCox)")
                      | (c) {{ club.teamVersion.teamMembers.find(member => member.isCox)?.fullName || '' }}
                  .coaches
                    span.title Coaches
                    span(v-for="member in club.teamVersion.teamMembers.filter(member => member.isCoach)" :key="member.person.personId" :class="{ 'active-rower': member.person.personId === KNRBStore.person.personId }")
                      | {{ member.fullName }}
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import useTimeFormatter from '@/composables/useTimeFormatter';

// Access your store (make sure the store is set up accordingly)
const KNRBStore = useKNRBStore();
const { formatTime } = useTimeFormatter();

const props = defineProps<{
  positions: RaceTeam[]; // Adjust the type to match your data (e.g., array of clubs)
  preliminary: boolean;
}>();

// State for toggling between all positions and only active rower positions
const showAllPositions = ref(false);
// Track which club rows are expanded
const expandedLineups = ref<number[]>([]);

function toggleView() {
  showAllPositions.value = !showAllPositions.value;
}

function toggleClub(index: number) {
  const clubIndex = expandedLineups.value.indexOf(index);
  if (clubIndex === -1) {
    expandedLineups.value.push(index);
  } else {
    expandedLineups.value.splice(clubIndex, 1);
  }
}

function checkActiveRower(club: RaceTeam) {
  // Returns true if the active user is found in the club's team
  return club.teamVersion.teamMembers.some(
    (member) => KNRBStore.person.personId === member.person.personId
  );
}

function getLimitedPerson(personId: string) {
  // Call your store function to load additional person details
  KNRBStore.getLimitedPerson(personId);
}

const filteredPositions = computed(() => {
  const positions = showAllPositions.value
    ? props.positions
    : props.positions.filter((club: RaceTeam) => checkActiveRower(club));

  // Request additional person data for each club
  positions.forEach((club: RaceTeam) => {
    club.teamVersion.teamMembers.forEach((member) => {
      if (
        !member.isCoach &&
        !member.isCox &&
        !KNRBStore.calledLimitedPersons.some((p) => p.personId === member.person.personId)
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

.mobile {
  @include tablet-small {
    display: none;
  }
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
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  color: $black50;
  text-decoration: underline;
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
  grid-template-columns: 1fr;
  width: min-content;
  > .times-splits {
    font-size: 0.75rem;
    color: $black60;
  }
}

.expand {
  text-align: center;
  text-decoration: underline;
  cursor: pointer;
  :deep(svg) {
    width: 1.25rem;
    height: 1.25rem;
    color: $black50;
    &:hover {
      color: red;
    }
  }
}

.left {
  padding-right: 0.5rem;
}

.right {
  padding-left: 0.5rem;
  width: 2rem;
}

tr {
  position: relative;
  cursor: pointer;
  td {
    width: fit-content;
  }
}

.row {
  &:hover {
    :deep(svg) {
    color: red;
  }
  }

}

.lineup {
  display: flex;
  column-gap: 2rem;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
  > .rowers,
  .coaches {
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
