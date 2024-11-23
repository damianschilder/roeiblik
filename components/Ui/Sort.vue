<template lang="pug">
.component-wrapper 
  .element-wrapper
    .element-content
      nuxt-icon(name="sort")
      span {{label}}
</template>
    
<script setup lang="ts">
defineProps({
  label: String,
})
  </script>
    
  <style lang="scss" scoped>
  .element-content {
    display: flex;
    column-gap: 0.5rem;
    padding: 0.25rem;
    height: fit-content;
    border: 1px solid rgba(0, 0, 0, 0.05);
    cursor: pointer;
    border-radius: 5px;
  }
  </style>
    