<template lang="pug">
.component-wrapper
  .element-wrapper
    .element-body
      table
        caption.visually-hidden Winsten en vermeldingen per rol
        thead
          tr
            td
            th(scope="col") Winsten
            th(scope="col") Totaal
        tbody
          tr(v-for="role in rows" :key="role")
            th(scope="row") {{ rowLabel(role) }}
            td {{ rowerStore.totalWins[role] }}
            td {{ rowerStore.roleCounts[role] }}
</template>

<script setup lang="ts">
import { roleLabel } from '@/stores/rowers';
import type { TtRole } from '~/types/Timeteam';

const rowerStore = useRowersStore();
// The order the table has always had: Roeier, Stuur, Coach. Entries whose role is still being
// looked up in the background, and entries settled without one, each get a row of their own while
// there are any, so the totals add up to every entry and every win. The "pending" row shrinks into
// the role rows as the fill goes on.
type Row = TtRole | 'pending' | 'unknown';
const TT_ROLES_IN_TABLE: TtRole[] = ['Rower', 'Cox', 'Coach'];
const rows = computed<Row[]>(() => [
  ...TT_ROLES_IN_TABLE,
  ...(rowerStore.roleCounts.pending > 0 ? ['pending' as const] : []),
  ...(rowerStore.roleCounts.unknown > 0 ? ['unknown' as const] : []),
]);

function rowLabel(row: Row): string {
  if (row === 'pending') return 'Rol laden…';
  if (row === 'unknown') return 'Rol onbekend';
  return roleLabel(row);
}
</script>

<style lang="scss" scoped>
table {
  text-align: center;
}
.element-body {
  @include mobile {
    display: flex;
    justify-content: center;
  }
  padding: 0;
}

thead th {
  color: $black50;
  font-weight: bold;
}

// Row labels are headers for screen readers, plain text to the eye (as before).
tbody th {
  font-weight: normal;
  color: inherit;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
</style>
