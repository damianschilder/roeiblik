<template lang="pug">
//- A real <button>; attributes such as @click or aria-expanded are passed on to it.
.component-wrapper(:class="$attrs.class" :style="$attrs.style")
  .element-wrapper
    .element-content
      button.content(type="button" v-bind="buttonAttrs($attrs)")
        nuxt-icon(name="filter" aria-hidden="true")
        span Filter
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false });

const buttonAttrs = ({ class: _class, style: _style, ...rest }: Record<string, unknown>) => rest;
</script>

<style lang="scss" scoped>
.element-content {
  .content {
    // Undo the browser's button styling, so it looks exactly like the old <div>.
    margin: 0;
    font: inherit;
    color: inherit;
    text-align: inherit;
    background: none;
    appearance: none;

    padding: 0.25rem;
    border: 1px solid rgba(0, 0, 0, 0.05);
    border-radius: 5px;
    display: flex;
    column-gap: 0.5rem;
    cursor: pointer;
  }
}
</style>
