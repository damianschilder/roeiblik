<template lang="pug">
.component-wrapper
  nuxt-icon(name="help")
  .info
  </template>

  
<style lang="scss" scoped>
.component-wrapper {
  display: flex;
  position: relative;
  column-gap: 0.25rem;
  color: $neutral-variant50;
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