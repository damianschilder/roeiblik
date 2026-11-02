<template lang="pug">
.component-wrapper
  .content
    button.checkbox(type="button" :aria-pressed="showAllPositions" @click="showAllPositions = !showAllPositions")
      nuxt-icon(:name="showAllPositions ? 'less' : 'more'" aria-hidden="true")
      span {{ showAllPositions ? `Toon alleen ${personName}` : `Alle posities` }}
  .table-wrapper
    table
      caption.sr-only Uitslag {{ round.name || race.raceName }}
      thead
        tr
          th
            span.sr-only Opstelling
          th(scope="col")
            span(aria-hidden="true") ⚑
            span.sr-only Positie
          th(scope="col") Vereniging
          th.left(scope="col")
            span(aria-hidden="true") #
            span.sr-only Plaats in de boot
          th.mobile(scope="col") Slag
          th.right(v-for="distance in distances" :key="distance" scope="col") {{ distance }}m
      tbody
        template(v-for="team in visibleTeams" :key="teamKey(team)")
          tr.row(@click="toggleTeam(team)")
            td.expand
              button(
                type="button"
                :aria-expanded="isOpen(team)"
                :aria-controls="lineupId(team)"
                :aria-label="`Opstelling van ${team.name || 'deze ploeg'}`"
                @click.stop="toggleTeam(team)"
              )
                nuxt-icon(:name="isOpen(team) ? 'less' : 'more'" aria-hidden="true")
            td.left
              template(v-if="team.position") {{ team.position }}
              abbr(v-else-if="team.didNotStart" title="Niet gestart") DNS
              abbr(v-else-if="team.didNotFinish" title="Niet gefinisht") DNF
              template(v-else) –
            td.club.left {{ team.name }}
            td.left {{ seatOf(team) }}
            td.mobile {{ strokeOf(team) }}
            td.right(v-for="distance in distances" :key="distance")
              .times
                span {{ timeAt(team, distance) }}
          tr(v-if="isOpen(team)" :id="lineupId(team)")
            td
            td(:colspan="4 + distances.length")
              .lineup
                .rowers
                  span.title Opstelling
                  .rower(
                    v-for="(member, index) in rowersOf(team)"
                    :key="member.personId ?? `hidden-${index}`"
                    :class="{ 'active-rower': member.personId === personId }"
                  )
                    NuxtLink.link(v-if="!member.hidden" :to="`/knrb/persoon/${member.personId}`")
                      span {{ member.boatPosition }} {{ member.fullName }}
                      nuxt-icon(name="link" aria-hidden="true")
                    span.hidden(v-else) {{ member.boatPosition }} Naam afgeschermd
                  .rower(
                    v-for="(member, index) in coxesOf(team)"
                    :key="member.personId ?? `hidden-cox-${index}`"
                    :class="{ 'active-rower': member.personId === personId }"
                  )
                    NuxtLink.link(v-if="!member.hidden" :to="`/knrb/persoon/${member.personId}`")
                      span (c) {{ member.fullName }}
                      nuxt-icon(name="link" aria-hidden="true")
                    span.hidden(v-else) (c) Naam afgeschermd
                .coaches(v-if="coachesOf(team).length > 0")
                  span.title Coaches
                  .rower(
                    v-for="(member, index) in coachesOf(team)"
                    :key="member.personId ?? `hidden-coach-${index}`"
                    :class="{ 'active-rower': member.personId === personId }"
                  )
                    NuxtLink.link(v-if="!member.hidden" :to="`/knrb/persoon/${member.personId}`")
                      span {{ member.fullName }}
                      nuxt-icon(name="link" aria-hidden="true")
                    span.hidden(v-else) Naam afgeschermd
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { RaceResult, RaceTeam, Round, TeamMember } from '~/types/KNRB';
import { useKNRBStore } from '~/stores/knrb';
import useTimeFormatter from '@/composables/useTimeFormatter';

const props = defineProps<{
  round: Round;
  race: RaceResult;
  personId: string;
}>();

const KNRBStore = useKNRBStore();
const { formatTime } = useTimeFormatter();

const personName = computed(() => KNRBStore.person?.fullName ?? '');

// By default only the crew(s) of this person; "Alle posities" shows the whole race.
const showAllPositions = ref(false);
const expanded = ref<string[]>([]);

const hasPerson = (team: RaceTeam) => team.members.some((m) => m.personId === props.personId);

const visibleTeams = computed(() => {
  const own = props.round.teams.filter(hasPerson);
  return showAllPositions.value || own.length === 0 ? props.round.teams : own;
});

// Columns for every distance any crew has a time at, so a crew that stopped early stays aligned.
const distances = computed(() => {
  const all = new Set<number>();
  for (const team of props.round.teams) for (const t of team.times) all.add(t.distance);
  return [...all].sort((a, b) => a - b);
});

function teamKey(team: RaceTeam) {
  return String(team.id ?? `${team.name}|${team.lane}`);
}

function lineupId(team: RaceTeam) {
  return `lineup-${props.round.raceId}-${teamKey(team)}`.replace(/[^A-Za-z0-9_-]/g, '-');
}

const isOpen = (team: RaceTeam) => expanded.value.includes(teamKey(team));

function toggleTeam(team: RaceTeam) {
  const key = teamKey(team);
  expanded.value = isOpen(team) ? expanded.value.filter((k) => k !== key) : [...expanded.value, key];
}

function seatOf(team: RaceTeam) {
  const member = team.members.find((m) => m.personId === props.personId);
  if (!member || member.isCoach) return '';
  if (member.isCox) return 'c';
  return member.boatPosition ?? '';
}

function strokeOf(team: RaceTeam) {
  const stroke = team.members.find((m) => m.isStroke);
  if (!stroke) return '';
  return stroke.hidden ? 'Naam afgeschermd' : stroke.fullName;
}

function timeAt(team: RaceTeam, distance: number) {
  const time = team.times.find((t) => t.distance === distance)?.time;
  return time ? formatTime(time) : '';
}

const rowersOf = (team: RaceTeam): TeamMember[] => team.members
  .filter((m) => !m.isCoach && !m.isCox)
  .sort((a, b) => (a.boatPosition ?? 99) - (b.boatPosition ?? 99));
const coxesOf = (team: RaceTeam): TeamMember[] => team.members.filter((m) => m.isCox);
const coachesOf = (team: RaceTeam): TeamMember[] => team.members.filter((m) => m.isCoach);
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

abbr {
  text-decoration: none;
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
  align-self: flex-start;
  font: inherit;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
  padding: 0;
  border: none;
  background: none;
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
  &:focus-visible {
    outline: 2px solid $roeiblik;
    outline-offset: 2px;
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
}

.expand {
  text-align: center;
  width: fit-content;
  button {
    display: flex;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    border-radius: 3px;
    &:focus-visible {
      outline: 2px solid $roeiblik;
      outline-offset: 1px;
    }
  }
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

.hidden {
  color: $black50;
  font-style: italic;
}

.link {
  color: black;
  display: flex;
  text-decoration: none;
  column-gap: 0.5rem;
  &:hover {
    text-decoration: underline;
  }
  &:focus-visible {
    outline: 2px solid $roeiblik;
    outline-offset: 2px;
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
