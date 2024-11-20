<template lang="pug">
.layout-wrapper 
  Navbar
  .slot-wrapper
    slot
    //- UiTable.table
    //- UiTableV2.table
  Footer
  .noMobile
    h2 Aminoprofile
    span will be available on mobile soon.
</template>

<style lang="scss" scoped>
.layout-wrapper {
  display: grid;
  min-height: 100vh; // Ensure the wrapper spans the full viewport height
  grid-template-columns: 100%;
  grid-template-areas:
    'navbar'
    'nuxt'
    'footer';
  grid-template-rows: 75px 1fr 112px; // Use 1fr to let the content area grow
}

.slot-wrapper {
  grid-area: nuxt;
  padding-bottom: 5rem; // Optional spacing before footer
  height: 100%; // Ensure it takes up the available space
  > .table {
    margin-top: 5rem;
  }
}

.noMobile {
  display: none;
  position: absolute;
  width: 100%;
  flex-direction: column;
  height: 100%;
  justify-content: center;
  align-items: center;
  color: white;
  > h2 {
    font-family: "Young Serif";
  }
}

</style>