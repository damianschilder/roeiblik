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
            th(scope="row") {{ role === 'unknown' ? 'Rol onbekend' : roleLabel(role) }}
            td {{ rowerStore.totalWins[role] }}
            td {{ rowerStore.roleCounts[role] }}
</template>

<script setup lang="ts">
import { roleLabel } from '@/stores/rowers';
import type { TtRole } from '~/types/Timeteam';

const rowerStore = useRowersStore();
// The order the table has always had: Roeier, Stuur, Coach. Entries whose role could not be
// looked up get a row of their own, so the totals add up to every entry and every win.
const TT_ROLES_IN_TABLE: TtRole[] = ['Rower', 'Cox', 'Coach'];
const rows = computed<(TtRole | 'unknown')[]>(() =>
  (rowerStore.roleCounts.unknown > 0 ? [...TT_ROLES_IN_TABLE, 'unknown'] : TT_ROLES_IN_TABLE));
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
