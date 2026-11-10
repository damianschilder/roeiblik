<template lang="pug">
  .page-wrapper
    .content
      KNRBSearch
  </template>

  <script setup lang="ts">
  useHead({
    title: 'KNRBeter: KNRB-uitslagen per persoon',
    meta: [
      { name: 'description', content: 'Zoek een roeier, stuur of coach op naam in de klasserende uitslagen van de KNRB: per wedstrijd het veld, de ronden, de plaats, de tijd en de ploeg.' },
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