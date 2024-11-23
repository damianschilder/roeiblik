<template lang="pug">
.component-wrapper 
  .element-wrapper
    .element-content
      .content
        nuxt-icon(name="filter")
        span Filter
  </template>
    
  <script setup lang="ts">

  </script>
    
  <style lang="scss" scoped>
  .element-content {
    .content {
      padding: 0.25rem;
      border: 1px solid rgba(0, 0, 0, 0.05);
      border-radius: 5px;
      display: flex;
      column-gap: 0.5rem;
      cursor: pointer;
    }
  }
  </style>
    