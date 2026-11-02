<template lang="pug">
//- The label says the current order ("Recentste eerst"); a click reverses it. A real <button>,
//- with the attributes (such as @click) passed on to it; class and style stay on the wrapper.
.component-wrapper(:class="$attrs.class" :style="$attrs.style")
  .element-wrapper
    button.element-content(type="button" :aria-label="label ? `Sortering: ${label}` : 'Sortering omdraaien'" v-bind="buttonAttrs($attrs)")
      nuxt-icon(name="sort" aria-hidden="true")
      span {{label}}
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false });

defineProps({
  label: String,
})

const buttonAttrs = ({ class: _class, style: _style, ...rest }: Record<string, unknown>) => rest;
</script>

<style lang="scss" scoped>
.element-content {
  // Undo the browser's button styling, so it looks exactly like the old <div>.
  margin: 0;
  font: inherit;
  color: inherit;
  text-align: inherit;
  background: none;
  appearance: none;

  display: flex;
  column-gap: 0.5rem;
  padding: 0.25rem;
  height: fit-content;
  border: 1px solid rgba(0, 0, 0, 0.05);
  cursor: pointer;
  border-radius: 5px;
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
}
:deep(svg) {
  align-self: center;
  height: 1.1rem;
  width: 1.1rem;
}
.nuxt-icon {
  display: flex;
  align-items: center;
}
</style>
