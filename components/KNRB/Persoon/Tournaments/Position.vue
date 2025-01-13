<template lang="pug">
tr(ref="target" class="observed-element")
  td.index {{ club.endPosition }}
  td.club
    img(:src="club.oarBladeUrl" alt="KNRB logo")
    | {{ club.teamVersion.matchTeam.name }}
  //- td.margin
  //-   .loader-container(v-if="loading")
  //-     UiLoader
  //-   span(v-else) {{ totalScullingPoints }}
  //- td.margin
  //-   .loader-container(v-if="loading")
  //-     UiLoader
  //-   span(v-else) {{ totalSweepingPoints }}
  td 4
  td.expand 
  td(v-for="time in club.raceTeamTimes") 
    .time 
      span {{formatTime(time.time)}}
      span.time-splits(v-if="time.splitTime !== 0") {{formatTime(time.splitTime)}}, {{time.position}}
</template>

<script setup lang="ts">
import type { RaceTeam } from "~/types/KNRB";
import useTimeFormatter from '@/composables/useTimeFormatter';
const KNRBStore = useKNRBStore();

const { formatTime } = useTimeFormatter();
  
const props = defineProps<{
  club: RaceTeam;
}>();

const loading = ref(false);
const totalScullingPoints = ref(0);
const totalSweepingPoints = ref(0);

const teamMembers = computed(() => props.club.teamVersion.teamMembers);

async function getLimitedPersons() {
  for (const member of teamMembers.value) {
    await KNRBStore.getLimitedPerson(member.person.personId);
  }

  for (const member of props.club.teamVersion.teamMembers) {
    if (!member.isCoach && !member.isStroke) {
      console.log(member.fullName, member.person.totalScullingPoints, member.person.totalSweepingPoints);
      totalScullingPoints.value += member.person.totalScullingPoints;
      totalSweepingPoints.value += member.person.totalSweepingPoints;
    }
  }
}

onMounted( async () => {
  loading.value = true;
  // await getLimitedPersons()
  loading.value = false;
});
</script>


<style lang="scss" scoped>
img {
  height: 0.8rem;
}

.club {
  display: flex;
  column-gap: 0.5rem;
  align-items: center;
  width: max-content;
  @include mobile {
    width: 100%;
  }
}

.margin {
  padding-left: 1rem;
  vertical-align: top;
  text-align: center;
}
.time {
  display: grid;
  flex-direction: column;
  grid-template-rows: 1fr 1fr;
  grid-template-columns: 1fr;
  height: 100%;
  padding-left: 0.5rem;
  > span {
  }
  > .time-splits {
    font-size: 0.75rem;
    color: $black60;
  }
}
.expand {
  vertical-align: top;
  text-align: center;
  width: 100%;
}

.index {
  vertical-align: top;
  padding-right: 0.5rem;
  width: 2rem;
  text-align: center;
}

.times {
  border-spacing: 10rem 0;
  text-align: left;
}

td {
  vertical-align: top;
}
</style>
