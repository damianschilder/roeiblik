<template lang="pug">
.component-wrapper
  .element-wrapper
    .element-body
      .left
        h2 {{fullName}}
</template>

<script setup lang="ts">
import type { Person } from "~/types/KNRB";

const props = defineProps<{
  fullName: Person['fullName'];
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
</style>
