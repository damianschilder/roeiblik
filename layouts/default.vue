<template lang="pug">
.layout-wrapper 
  Navbar
  .slot-wrapper
    slot
  Footer
</template>

<style lang="scss" scoped>
.layout-wrapper {
  display: grid;
  min-height: calc(100vh + 7rem); // Ensure the wrapper spans the full viewport height
  grid-template-columns: 100%;
  grid-template-areas:
    'navbar'
    'nuxt'
    'footer';
  grid-template-rows: 75px 1fr 7rem; // Use 1fr to let the content area grow
}

.slot-wrapper {
  grid-area: nuxt;
  padding-bottom: 5rem; // Optional spacing before footer
  height: 100%; // Ensure it takes up the available space
}
</style>