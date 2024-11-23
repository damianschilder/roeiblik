<template lang="pug">
  .component-wrapper 
    .element-wrapper
      .element-content(@click="toggleChecked")
        .content
          nuxt-icon(:name="modelValue ? 'checkbox/checkbox checked' : 'checkbox/checkbox empty'")
          span Alleen winsten
  </template>
    
  <script setup lang="ts">
  import { defineProps, defineEmits } from "vue";
  
  // Props for the checkbox
  const props = defineProps({
    modelValue: {
      type: Boolean,
      required: true, // Ensure the parent passes a value
    },
  });
  
  // Emit events when the checkbox changes
  const emit = defineEmits(['update:modelValue']);
  
  // Toggle the checkbox state
  function toggleChecked() {
    emit('update:modelValue', !props.modelValue); // Access modelValue via props
  }
  </script>
    
  <style lang="scss" scoped>
  .element-content {
    .content {
      padding: 0.25rem;
      border: 1px solid rgba(0, 0, 0, 0.05);
      border-radius: 5px;
      display: flex;
      align-items: center;
      column-gap: 0.4rem;
      cursor: pointer;
      transition: background-color 0.2s ease;
  
      &:hover {
        background-color: rgba(0, 0, 0, 0.05);
      }
    }
  }

  :deep(svg) {
  height: 1.1rem;
  width: 1.1rem;
}
  </style>
  