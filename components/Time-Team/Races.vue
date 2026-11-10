<template lang="pug">
  .component-wrapper
    .element-wrapper
      .element-body
        p.empty(v-if="!profile.events.length") Geen uitslagen gevonden voor deze persoon in Time-Team.
        .races(v-else)
          //- With a single event there is nothing to sort or filter, as before.
          .actions(v-if="profile.events.length > 1")
            UiSort(@click="toggleSortOrder" :label="isReversed ? 'Oudste eerst' : 'Recentste eerst'")
            .right
              select(v-if="hasMultipleRoles" v-model="selectedRole" aria-label="Toon vermeldingen per rol")
                option(value="") Alle rollen
                option(v-for="role in rolesPresent" :key="role" :value="role") {{ roleLabel(role) }}
              UiWon(v-if="rowerStore.anyWins" v-model="showOnlyWins")
          .header(aria-live="polite")
            span {{ countText }}
          .race(v-for="item in shown" :key="item.group.id" :ref="(el) => watchRace(el, item.group)")
            .race-event(
              v-for="{ entry, races } in item.entries"
              :key="entry.id"
              :class="races.length > 1 ? 'multiple-events' : 'single-event'"
            )
              .race-detail(
                v-for="(race, raceKey) in races"
                :key="race.id"
                :class="raceClass(race, raceKey)"
              )
                .top-label
                  span {{ formatRaceDate(race.date) || 'Datum niet aanwezig' }}
                  span(v-if="item.group.regatta")
                    | {{ item.group.regatta }}
                    span.city(v-if="item.group.city") , {{ item.group.city }}
                  span(v-else) Locatie niet aanwezig
                .entry
                  img(v-if="entry.blade" :src="entry.blade" alt="" loading="lazy" @error="hideImage")
                  span {{ entry.name || 'Niet aanwezig' }}
                .title
                  h2(v-if="raceKey === 0") {{ item.group.name || item.group.code || 'Niet aanwezig' }}
                  span(v-else) {{ item.group.code || 'Niet aanwezig' }}
                  .result
                    nuxt-icon.trophy(v-if="race.win" name="trophy" role="img" aria-label="Gewonnen")
                    span.text
                      | {{ `${placeText(race)} in ` }}
                      abbr(v-if="raceKey === 0 && race.round && race.roundName && race.roundName !== race.round" :title="race.roundName") {{ race.round }}
                      template(v-else) {{ roundText(race, raceKey) }}
                .bottom-label
                  span.role {{ roleLabel(entry.role) }}
                  span.time(v-if="hasTime(race)")
                    | {{ `${courseText(race)} in ${race.result}` }}
                    span.margin(v-if="race.margin") {{ race.margin }}
                .rules(v-if="race.rules.length > 0 && race.result")
                  span {{ race.rules[0] }} door
                .notes(v-if="notes(race)")
                  span {{ notes(race) }}
                .icon(v-if="raceKey === 0")
                  button.toggle(
                    type="button"
                    :aria-expanded="isOpen(entry) ? 'true' : 'false'"
                    :aria-controls="`details-${entry.id}`"
                    :aria-label="isOpen(entry) ? 'Verberg ploeg en tussentijden' : 'Toon ploeg en tussentijden'"
                    @click="toggleExpand(entry)"
                  )
                    nuxt-icon(:name="isOpen(entry) ? 'less' : 'more'" aria-hidden="true")
                transition(name="expand")
                  .expand(v-if="raceKey === 0" v-show="isOpen(entry)" :id="`details-${entry.id}`")
                    .rowers
                      h3 Roeiers
                      template(v-if="entry.crew")
                        span(v-for="member in entry.crew.rowers" :key="`r${member.position}${member.name}`" :class="{ 'rower': member.self }")
                          | {{ member.position != null ? `${member.position} ` : '' }}
                          NuxtLink(v-if="member.id && !member.self" :to="`/time-team/persoon/${member.id}`") {{ member.name }}
                          template(v-else) {{ member.name }}
                        span(v-for="member in entry.crew.coxes" :key="`c${member.position}${member.name}`" :class="{ 'rower': member.self }")
                          | {{ '(c) ' }}
                          NuxtLink(v-if="member.id && !member.self" :to="`/time-team/persoon/${member.id}`") {{ member.name }}
                          template(v-else) {{ member.name }}
                        span(v-if="!entry.crew.rowers.length && !entry.crew.coxes.length") Niet bekend
                      span(v-else-if="crewUnavailable(entry)") Ploeg niet beschikbaar
                      span(v-else) Ploeg laden…
                    .coaches(v-if="entry.crew?.coaches.length")
                      h3 Coaches
                      span(v-for="member in entry.crew.coaches" :key="`k${member.position}${member.name}`" :class="{ 'rower': member.self }")
                        NuxtLink(v-if="member.id && !member.self" :to="`/time-team/persoon/${member.id}`") {{ member.name }}
                        template(v-else) {{ member.name }}
                    .boat(v-if="entry.crew?.boat")
                      h3 Boot
                      span {{ entry.crew.boat }}
                    .splits(v-if="race.splits?.length || race.lane")
                      h3 {{ race.splits?.length ? 'Tussentijden' : 'Baan' }}
                      span(v-for="split in race.splits || []" :key="split.at") {{ splitText(split) }}
                      span(v-if="race.lane") {{ race.splits?.length ? `Baan ${race.lane}` : race.lane }}
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount, type ComponentPublicInstance } from 'vue';
import { useRowersStore, formatRaceDate, ordinalNl, roleLabel, TT_ROLES } from '@/stores/rowers';
import type { TtEntry, TtEvent, TtProfile, TtRace, TtRole, TtSplit } from '~/types/Timeteam';

const rowerStore = useRowersStore();
const profile = computed(() => rowerStore.rower as TtProfile);

const showOnlyWins = ref(false);
const selectedRole = ref<TtRole | ''>('');
const isReversed = ref(false);
const expandedEntry = ref<string | null>(null);

const rolesPresent = computed(() => TT_ROLES.filter((role) => rowerStore.roleCounts[role] > 0));
const hasMultipleRoles = computed(() => rolesPresent.value.length > 1);

function toggleSortOrder() {
  isReversed.value = !isReversed.value;
}

// The list as shown: role filter and "Alleen winsten" applied. "Alleen winsten" keeps the entries
// that were won (entry.won, the same rule as the count in the header), each with all its rounds,
// so the heats that led to a final stay visible. Entries stay the store's own objects, so a crew
// loaded later shows up in place.
const shown = computed(() => {
  const items: { group: TtEvent; entries: { entry: TtEntry; races: TtRace[] }[] }[] = [];
  for (const group of profile.value.events) {
    const entries = [];
    for (const entry of group.entries) {
      if (selectedRole.value && entry.role !== selectedRole.value) continue;
      if (showOnlyWins.value && !entry.won) continue;
      entries.push({ entry, races: entry.races });
    }
    if (entries.length) items.push({ group, entries });
  }
  return isReversed.value ? items.reverse() : items;
});

// Counted per entry (one crew in one event), like the table in the header: a coach with two
// crews in one event has two entries.
const countText = computed(() => {
  const n = shown.value.reduce((sum, item) => sum + item.entries.length, 0);
  if (showOnlyWins.value) return `${n} ${n === 1 ? 'winst' : 'winsten'}`;
  return `${n} ${n === 1 ? 'vermelding' : 'vermeldingen'}`;
});

const isOpen = (entry: TtEntry) => expandedEntry.value === entry.id;

// A group without a regatta name asks the store for it once it comes within REGATTA_MARGIN of the
// viewport, so a long history does not look up regattas nobody scrolls to. One observer for the
// whole list. Vue calls a function ref on every update (with null on unmount), so watchRace only
// acts when the element for a group changes.
const REGATTA_MARGIN = '400px 0px';
let observer: IntersectionObserver | null = null;
const watched = new Map<string, Element>(); // group id -> its .race element
const groupOf = new WeakMap<Element, TtEvent>();

function watchRace(el: Element | ComponentPublicInstance | null, group: TtEvent) {
  const previous = watched.get(group.id);
  if (el === (previous ?? null)) return;
  if (previous) {
    observer?.unobserve(previous);
    watched.delete(group.id);
  }
  if (!(el instanceof Element)) return;
  watched.set(group.id, el);
  const regattaId = group.entries[0]?.regattaId;
  if (group.regatta || !regattaId) return;
  if (typeof IntersectionObserver === 'undefined') {
    rowerStore.requestRegatta(regattaId);
    return;
  }
  observer ??= new IntersectionObserver(onRaceVisible, { rootMargin: REGATTA_MARGIN });
  groupOf.set(el, group);
  observer.observe(el);
}

function onRaceVisible(records: IntersectionObserverEntry[]) {
  for (const record of records) {
    if (!record.isIntersecting) continue;
    observer?.unobserve(record.target); // asked once, the store takes it from here
    const group = groupOf.get(record.target);
    const regattaId = group?.entries[0]?.regattaId;
    if (group && !group.regatta && regattaId) rowerStore.requestRegatta(regattaId);
  }
}

onBeforeUnmount(() => {
  observer?.disconnect();
  observer = null;
  watched.clear();
});

// No crew to show: Time-Team has none ("missing"), or the lookup gave up ("error").
function crewUnavailable(entry: TtEntry): boolean {
  const state = rowerStore.crewState[entry.id];
  return state === 'error' || state === 'missing';
}

function toggleExpand(entry: TtEntry) {
  expandedEntry.value = isOpen(entry) ? null : entry.id;
  if (isOpen(entry) && !entry.crew) rowerStore.loadCrew(entry);
}

// The latest round leads; rounds the crew came through are shown smaller beneath it. Rounds that
// did not lead to another one (separate distances of one event) keep the full size.
function raceClass(race: TtRace, raceKey: number): string {
  if (raceKey === 0) return 'final';
  return race.progressed ? 'preliminary' : 'multiple-distance';
}

const hasTime = (race: TtRace) => Boolean(race.result && /^\d/.test(race.result));

function placeText(race: TtRace): string {
  if (race.position) return ordinalNl(race.position);
  if (race.result && !hasTime(race)) return race.result; // DNS, DNF, DSQ, ...
  return 'Geen uitslag';
}

function roundText(race: TtRace, raceKey: number): string {
  const distance = race.distance ? `${race.distance}m` : '';
  if (raceKey === 0) return race.round || distance || race.roundName || 'ontbreekt';
  return race.roundName || race.round || distance || 'ontbreekt';
}

const courseText = (race: TtRace) => (race.distance ? `${race.distance}m` : race.course || '');

function notes(race: TtRace): string {
  return [
    race.outOfCompetition && 'buiten mededinging',
    race.penalty && 'met straftijd',
    race.provisional && 'voorlopige uitslag',
  ].filter(Boolean).join(', ');
}

// A blade that fails to load is removed, so the crew name does not sit behind an empty gap.
function hideImage(event: Event) {
  (event.target as HTMLImageElement).style.display = 'none';
}

function splitText(split: TtSplit): string {
  return `${split.at} ${split.time}${split.pos ? ` (${ordinalNl(split.pos)})` : ''}`;
}
</script>

<style lang="scss" scoped>
.multiple-events {
  display: flex;
  flex-direction: column;
  > :not(:first-child) {
    margin-top: 1rem;
    .entry, .top-label {
      display: none!important;
    }
    .role {
      visibility: hidden;
    }
  }
}

.nuxt-icon {
  display: flex;
  align-items: center;
}

.trophy {
  color: $red;
}

:deep(svg) {
  margin-bottom: 0;
}

.rower {
  font-weight: bold;
}

.empty {
  padding-top: 3rem;
  text-align: center;
  color: $black50;
}

.actions {
  display: flex;
  justify-content: space-between;
  .right {
    display: flex;
    column-gap: 0.5rem;
    @include tablet-small {
      align-items: end;
      flex-direction: column-reverse;
      row-gap: 0.25rem;
    }
    select {
      padding: 0.25rem 0.5rem;
      border: 1px solid rgba(0, 0, 0, 0.05);
      border-radius: 5px;
      display: flex;
      width: min-content;
      align-items: center;
      column-gap: 0.4rem;
      font: 1rem $font-text;
      cursor: pointer;
      transition: background-color 0.2s ease;
      outline: initial;
      background-color: initial;

      &:hover {
        background-color: rgba(0, 0, 0, 0.05);
      }
      &:focus-visible {
        outline: 2px solid $roeiblik;
        outline-offset: 2px;
      }
    }
  }
}

.component-wrapper {
  .element-wrapper {
    .element-body {
      display: flex;
      justify-content: center;
    }
  }
}

.races {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding-top: 2rem;
  max-width: 70%;
  @include mobile {
    max-width: initial;
  }
  .header {
    display: flex;
    margin-top: 1rem;
    justify-content: space-between;
    color: $black50;
    font-size: 0.9rem;
    font-weight: bold;
    padding-bottom: 0.1rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }
  .race {
    display: flex;
    flex-direction: column;
    row-gap: 2rem;
    width: 100%;
    padding: 3rem 0 1.5rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    &:last-child {
      border: none;
    }
    .top-label {
      display: flex;
      justify-content: space-between;
      column-gap: 1rem;
      margin-bottom: 0.8rem;
      color: $black50;
      font-size: 0.9rem;
      > :last-child {
        text-align: right;
      }
      // On a phone the regatta's name is enough.
      .city {
        @include mobile {
          display: none;
        }
      }
    }
    .entry {
      display: flex;
      column-gap: 0.25rem;
      align-items: center;
      text-transform: capitalize;
      img {
        height: 0.8rem;
      }
    }
    .title {
      text-transform: capitalize;
      display: flex;
      justify-content: space-between;
      column-gap: 2.5rem;
      font-size: 1.5rem;
      font-weight: bold;
      word-break: break-word;
      // The event name is the heading of each entry, at the size the title always had.
      h2 {
        font-size: inherit;
        font-weight: inherit;
      }
      .result {
        display: flex;
        column-gap: 0.2rem;
        align-items: center;
        text-transform: initial;
        text-align: right;
        .text {
          min-width: 7.0625rem;
          max-width: fit-content;
        }
        abbr {
          text-decoration: none;
        }
      }
    }
    .bottom-label {
      margin-top: 0.75rem;
      display: flex;
      justify-content: space-between;
      font-size: 1.15rem;
      .margin {
        color: $black50;
        font-size: 0.85em;
        margin-left: 0.3em;
      }
    }
    .icon {
      margin-top: 0.5rem;
      display: flex;
      justify-content: center;
      .toggle {
        display: flex;
        padding: 0.1rem 0.3rem;
        border: none;
        background: none;
        color: inherit;
        cursor: pointer;
        &:hover {
          background-color: rgba(230, 0, 0, 0.03);
          border-radius: 50px;
        }
        &:focus-visible {
          outline: 2px solid $roeiblik;
          outline-offset: 2px;
          border-radius: 50px;
        }
      }
    }
  }
}

.expand {
  margin: 0.5rem;
  display: flex;
  justify-content: space-between;
  column-gap: 1rem;
  overflow: hidden;
  @include tablet-small {
    display: grid;
    grid-template-columns: auto max-width;
    grid-template-areas:
      "roeiers coaches"
      "boot boot"
      "splits splits";
  }
  .rowers, .coxes, .coaches, .boat, .splits {
    display: flex;
    flex-direction: column;
    row-gap: 0.05rem;
    >:first-child {
      color: $black50;
      font-weight: bold;
      margin-bottom: 0.25rem;
    }
  }
  h3 {
    font: bold 1rem/1.4375rem $font-text;
  }
  a {
    color: inherit;
    text-decoration: none;
    &:hover, &:focus-visible {
      text-decoration: underline;
    }
    &:focus-visible {
      outline: 2px solid $roeiblik;
      outline-offset: 2px;
      border-radius: 2px;
    }
  }
  .rowers {
    grid-area: roeiers;
  }
  .coaches {
    grid-area: coaches;
  }
  .boat {
    grid-area: boot;
    @include tablet-small {
      margin-top: 1rem;
    }
  }
  .splits {
    grid-area: splits;
    @include tablet-small {
      margin-top: 1rem;
    }
  }
}

.expand-enter-active, .expand-leave-active {
  transition: max-height 0.3s ease;
}

.expand-enter-from, .expand-leave-to {
  max-height: 0;
}

.expand-enter-to, .expand-leave-from {
  max-height: 500px;
}

.preliminary {
  border-left: 1px solid rgba(0, 0, 0, 0.05);
  margin-left: 1rem;
  margin-right: 2rem;
  margin-top: 1rem!important;
  .top-label, .entry {
    display: none!important;
  }
  .title {
    margin-top: initial!important;
    >:first-child {
      font-size: 1.1rem;
      font-weight: bold;
      padding-left: 1rem;
    }
  }
  .role {
    visibility: hidden;
  }
  .bottom-label {
    display: flex;
    column-gap: 2rem;
  }
  .rules, .notes {
    margin-left: 2rem;
    font-size: 0.9rem;
  }
  .result {
    font-size: 1.1rem!important;
    font-weight: bold!important;
  }
  .time {
    font-size: 0.85rem;
    min-width: max-content;
  }
}

.rules, .notes {
  display: flex;
  justify-content: end;
  color: $black50;
}
</style>
