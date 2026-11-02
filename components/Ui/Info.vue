<template lang="pug">
//- A help icon that shows its slot content in a small popup: on hover, on click or tap, and from
//- the keyboard (Tab to the button, Enter or Space; Escape closes it).
.component-wrapper(
  @mouseenter="open = true"
  @mouseleave="open = false"
  @focusout="onFocusOut"
  @keydown.esc="open = false"
)
  button.trigger(type="button" :aria-label="label" :aria-expanded="open ? 'true' : 'false'" :aria-controls="id" @click="open = !open")
    nuxt-icon(name="help" aria-hidden="true")
  .info(:id="id" :class="{ show: open }")
    slot
</template>

<script setup lang="ts">
defineProps({
  label: { type: String, default: 'Meer informatie' },
});

const id = useId();
const open = ref(false);

function onFocusOut(event: FocusEvent) {
  const next = event.relatedTarget as Node | null;
  if (!next || !(event.currentTarget as HTMLElement).contains(next)) open.value = false;
}
</script>

<style lang="scss" scoped>
.component-wrapper {
  display: flex;
  position: relative;
  column-gap: 0.25rem;
  color: $neutral-variant50;
  > .trigger {
    margin: 0;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    line-height: 0;
    cursor: pointer;
    border-radius: 50%;
  }
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
    z-index: 10;
  }
  > .show {
    visibility: initial;
    opacity: 1;
  }
}
</style>
