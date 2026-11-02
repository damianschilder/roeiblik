<template lang="pug">
//- A real <button>: reachable with Tab, works with Enter and Space. class and style stay on the
//- wrapper (where callers' styling has always gone); everything else, such as @click or
//- aria-expanded, lands on the button itself.
.component-wrapper(:class="$attrs.class" :style="$attrs.style")
  button.button(type="button" :class="{ active }" v-bind="buttonAttrs($attrs)")
    nuxt-icon(:name="icon" aria-hidden="true")
    span {{label}}
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false });

defineProps({
  label: String,
  icon: String,
  active: Boolean,
})

const buttonAttrs = ({ class: _class, style: _style, ...rest }: Record<string, unknown>) => rest;
</script>

<style lang="scss" scoped>
.button {
  // Undo the browser's button styling, so it looks exactly like the old <div>.
  margin: 0;
  font: inherit;
  color: inherit;
  text-align: inherit;
  appearance: none;

  display: flex;
  column-gap: 0.25rem;
  padding: 0.5rem;
  width: max-content;
  filter: drop-shadow(1px 2px 1px rgba(0, 0, 0, 0.05));
  height: fit-content;
  background-color: white;

  border: 1px solid rgba(0, 0, 0, 0.05);
  cursor: pointer;
  border-radius: 5px;
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
}
:deep(svg) {
height: 1.1rem;
width: 1.1rem;
}

.active {
  :deep(svg) {
    color: $seed;
    height: 1.1rem;
    width: 1.1rem;
  }
}
</style>
