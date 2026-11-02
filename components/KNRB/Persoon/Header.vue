<template lang="pug">
.component-wrapper
  .element-wrapper
    .element-body
      .header
        .left
          span.meta(v-if="person.yearOfBirth || person.club")
            span(v-if="person.yearOfBirth") {{ person.yearOfBirth }}
            span.club(v-if="person.club") {{ person.club }}
          .name
            h1 {{ person.fullName }}
          dl.points
            .point
              dt.header Scull
              dd.digit {{ person.totalScullingPoints }}
            .point
              dt.header Boord
              dd.digit {{ person.totalSweepingPoints }}
</template>

<script setup lang="ts">
import type { Person } from "~/types/KNRB";

defineProps<{
  person: Person;
}>();
</script>

<style lang="scss" scoped>
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
  .meta {
    display: flex;
    column-gap: 0.5rem;
    .club {
      color: $black50;
    }
  }
  .name {
    display: flex;
    justify-content: space-between;
    column-gap: 1rem;
    @include mobile {
      text-align: center;
    }
    // The page's one h1, at the size the name always had (the h2 sizes from app.scss).
    h1 {
      font-size: 2.5rem;
      @include tablet-small {
        font-size: 2rem;
      }
      @include mobile {
        font-size: 2.5rem;
      }
    }
  }
  .points {
    margin: 0.25rem 0 0;
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
        margin: 0;
        font-size: 1.25rem;
      }
    }
  }
}
</style>
