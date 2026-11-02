<template lang="pug">
//- "Alleen winsten": a checkbox for screen readers and the keyboard (Tab, then Space or Enter),
//- drawn with the same icons as before. v-model as before; class and style stay on the wrapper,
//- other attributes (such as aria-label) go to the button.
.component-wrapper(:class="$attrs.class" :style="$attrs.style")
  .element-wrapper
    button.element-content(
      type="button"
      role="checkbox"
      :aria-checked="modelValue ? 'true' : 'false'"
      v-bind="buttonAttrs($attrs)"
      @click="toggleChecked"
    )
      span.content
        nuxt-icon(:name="modelValue ? 'checkbox/checkbox checked' : 'checkbox/checkbox empty'" aria-hidden="true")
        span Alleen winsten
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false });

// Props for the checkbox
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true, // Ensure the parent passes a value
  },
});

// Emit events when the checkbox changes
const emit = defineEmits(['update:modelValue']);

// `label` has never been a prop here (the text is fixed); keep it off the button.
const buttonAttrs = ({ class: _class, style: _style, label: _label, ...rest }: Record<string, unknown>) => rest;

// Toggle the checkbox state
function toggleChecked() {
  emit('update:modelValue', !props.modelValue);
}
</script>

<style lang="scss" scoped>
.element-content {
  // Undo the browser's button styling, so it looks exactly like the old <div>.
  margin: 0;
  padding: 0;
  border: 0;
  font: inherit;
  color: inherit;
  text-align: inherit;
  background: none;
  appearance: none;
  cursor: pointer;
  border-radius: 5px;

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
.nuxt-icon {
  display: flex;
  align-items: center;
}
</style>
