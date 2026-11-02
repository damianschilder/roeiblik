<template lang="pug">
//- role="status" makes screen readers say the label (default "Laden…") when the loader appears.
.component-wrapper(role="status")
  .loader(aria-hidden="true")
  span.visually-hidden {{ label }}
</template>

<script setup lang="ts">
defineProps({
  label: { type: String, default: 'Laden…' },
});
</script>

<style lang="scss">
.loader {
  border: 2px solid $black50;
  border-top: 2px solid $black20;
  border-radius: 50%;
  width: 15px;
  height: 15px;
  animation: spin 1.5s linear infinite;
  @media (prefers-reduced-motion: reduce) {
    animation-duration: 4s;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
