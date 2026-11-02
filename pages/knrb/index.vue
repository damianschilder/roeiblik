<template lang="pug">
  .page-wrapper
    .content
      KNRBSearch
  </template>

  <script setup lang="ts">
  useHead({
    title: 'Doorzoek KNRB',
    meta: [
      { name: 'description', content: 'Doorzoek de KNRB op klasserende resultaten.' },
    ],
  });
  </script>
  
  <style lang="scss" scoped>
  // At least 60% of the screen, search box in the middle. A min-height rather than a height: with
  // results the content is taller, and a fixed height let it spill upwards, under the menu bar.
  .content {
    min-height: 60vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  </style>