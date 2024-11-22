<template lang="pug">
.component-wrapper(@mouseenter="toggleHover(true)" @mouseleave="toggleHover(false)" @click="toggleHover(!hover)")
  nuxt-icon(name="info")
  .info(:class="{ show: hover }" @click.stop)
    slot
  </template>
  



  
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

// Reactive state for tooltip visibility
const hover = ref(false);

// Function to toggle hover state
const toggleHover = (state: boolean) => {
  hover.value = state;
};

// Function to close the tooltip when clicking outside
const closeHover = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.component-wrapper')) {
    hover.value = false;
  }
};

// Lifecycle hooks to manage the outside click listener
onMounted(() => {
  document.addEventListener('click', closeHover);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', closeHover);
});
</script>




  
<style lang="scss" scoped>
.component-wrapper {
  display: flex;
  position: relative;
  column-gap: 0.25rem;
  &:deep(.nuxt-icon svg) {
    height: fit-content;
    width: 1.2rem;
    &:hover {
      color: red;
    }
  }
  > .info {
    padding: 1rem;
    border-radius: 5px;
    // top: 24px;
    left: 1.5rem;
    position: absolute;
    visibility: hidden;
    opacity: 0;
    display: flex;
    flex-direction: column;
    row-gap: 0.5rem;
    width: max-content;
    background-color: white;
    filter: drop-shadow(0px 2px 2px rgba(0, 0, 0, 0.15));
    transition: visibility 0.2s, opacity 0.2s;
  }
  > .show {
    visibility: initial;
    opacity: 1;
  }
}
</style>