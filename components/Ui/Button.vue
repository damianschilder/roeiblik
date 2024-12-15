<template lang="pug">
.component-wrapper 
  .button(:class="{ active }")
    nuxt-icon(name="filter")
    span {{label}}
</template>
    
<script setup lang="ts">

defineProps({
  label: String,
  active: Boolean,
})

</script>
  
<style lang="scss" scoped>
.button {
  display: flex;
  column-gap: 0.25rem;
  padding: 0.5rem;
  width: max-content;
  filter: drop-shadow(1px 2px 1px rgba(0, 0, 0, 0.05));
  height: fit-content;
  background-color: white;

  border: 1px solid rgba(0, 0, 0, 0.05);
  cursor: pointer;
  border-radius: 5px;
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
}
:deep(svg) {
height: 1.1rem;
width: 1.1rem;
}

.active {
  :deep(svg) {
    color: $seed;
    height: 1.1rem;
    width: 1.1rem;
  }
}
</style>
      