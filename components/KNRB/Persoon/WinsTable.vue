<template lang="pug">
.component-wrapper 
  .element-wrapper
    .element-body
      table(v-if="person")
        tr
          th
          th Winsten
          th Totaal
        tr
          td Roeier
          td {{person.totalWins.Rower}}
          td {{person.roleCounts.Rower}}
        tr
          td Stuur
          td {{person.totalWins.Cox}}
          td {{person.roleCounts.Cox}}
        tr
          td Coach
          td {{person.totalWins.Coach}}
          td {{person.roleCounts.Coach}}
            

</template>

<script setup lang="ts">
const props = defineProps<{
  person: Person;
}>();

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

th {
  color: $black50;
  font-weight: bold;
}
</style>