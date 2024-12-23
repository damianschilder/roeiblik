<template lang="pug">
.component-wrapper 
  .element-wrapper
    .element-body
      table(v-if="rowerStore.rower")
        tr
          th
          th Winsten
          th Totaal
        tr
          td Roeier
          td {{rowerStore.rower.totalWins.Rower}}
          td {{rowerStore.rower.roleCounts.Rower}}
        tr
          td Stuur
          td {{rowerStore.rower.totalWins.Cox}}
          td {{rowerStore.rower.roleCounts.Cox}}
        tr
          td Coach
          td {{rowerStore.rower.totalWins.Coach}}
          td {{rowerStore.rower.roleCounts.Coach}}
            

</template>

<script setup lang="ts">
const rowerStore = useRowersStore();
const runtimeConfig = useRuntimeConfig()


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