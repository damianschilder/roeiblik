<template lang="pug">
.page-wrapper
  .content
    Time-TeamSearch
</template>

<script setup lang="ts">
useHead({
  title: 'FAQ',
  meta: [
    { name: 'description', content: 'Doorzoek de Time-Team op compo- en klasserende resultaten.' },
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