<template lang="pug">
  .component-wrapper 
    .button(:class="props.style")
      nuxt-icon(:name="icon")
      span {{ label }}
  </template>
        
  <script setup lang="ts">
  import { computed } from 'vue';
  
  const props = defineProps({
    label: String,
    icon: String,
    active: Boolean,
    style: {
      type: String,
      default: 'style-one'
    } // Add the style prop
  });
  
  // Dynamically compute the class to include the style prop
  const computedClass = computed(() => props.style || '');
  </script>
      
  <style lang="scss" scoped>
  .button {
    display: flex;
  align-items: center;
  column-gap: 0.5rem;
  align-self: center;
  font-size: 2rem;
  background-color: rgba(23, 218, 162, 0.25);
  width: max-content;
  padding: 0.75rem 1.25rem;
  color: rgba(23, 218, 162, 1);
  border-radius: 5px;
  :deep(svg) {
    height: 2rem;
    width: 2rem;
    margin-bottom: 0;
    align-self: center;;
  }
  }

  .active {
    :deep(svg) {
      color: $seed;
      height: 1.1rem;
      width: 1.1rem;
    }
  }
  
  .style-one {
    box-shadow: 1px 1px 0px rgba(255, 83, 66, 1);
    background-color: rgba(255, 83, 66, 0.25);
    color: white;
    &:hover {
      background-color: white;
    }
  }
  
  .style-two {
    box-shadow: 1px 1px 0px rgba(255, 121, 0, 1);
    background-color: rgba(255, 121, 0, 0.25);
    color: white;
  }
  </style
  