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
  .content {
    height: 60vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  </style>