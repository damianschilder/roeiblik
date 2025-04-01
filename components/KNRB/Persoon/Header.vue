<template lang="pug">
.component-wrapper
  .element-wrapper
    .element-body
      .header
        .left
          span {{person.yearOfBirth}}
          .name
            h2 {{person.fullName}}
          .points
            .point
              span.header Scull
              span.digit {{person.totalSweepingPoints}}
            .point
              span.header Boord
              span.digit {{person.totalScullingPoints}}
        KNRBPersoonWinsTable( :person="person")

</template>

<script setup lang="ts">
import type { Person } from "~/types/KNRB";

const props = defineProps<{
  person: Person;
}>();
</script>

<style lang="scss" scoped>
.component-wrapper {
}

.element-wrapper {
  padding: 3.5rem 0 2rem;
  border-bottom: 1px solid rgba(0,0,0,.1);
  min-height: 5.875rem;
}

.header {
  display: flex;
  justify-content: space-between;
  column-gap: 1rem;
  @include mobile {
    flex-direction: column;
  }
}

.left {
  display: flex;
  flex-direction: column;
  @include mobile {
    align-items: center;
  }
  .name {
    display: flex;
    justify-content: space-between;
    column-gap: 1rem;
    @include mobile {
      text-align: center;
    }
  }
  .points {
    margin-top: 0.25rem;
    display: flex;
    column-gap: 1rem;
    @include mobile {
      justify-content: center;
      margin-bottom: 0.5rem;
    }
    .point {
      display: flex;
      flex-direction: column;
      align-items: center;
      .header {
        font-weight: bold;
        color: $black50;
      }
      .digit {
        font-size: 1.25rem;
      }
    }
  }
}
</style>
