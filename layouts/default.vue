<template lang="pug">
  .layout-wrapper
    //- First stop for keyboard users: jump past the menu. Only visible while it has focus.
    a.skip-link(href="#inhoud") Naar de inhoud
    Navbar
    main#inhoud.slot-wrapper
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
    background-color: $beige;
  }

  .slot-wrapper {
    grid-area: nuxt;
    padding-bottom: 5rem; // Optional spacing before footer
    height: 100%; // Ensure it takes up the available space
    min-width: 0; // let wide tables scroll inside their own box instead of widening the page
  }

  // Absolutely positioned, so it takes no row in the grid.
  .skip-link {
    position: absolute;
    left: 1rem;
    top: -10rem;
    z-index: 1000;
    padding: 0.5rem 1rem;
    border-radius: 5px;
    background-color: white;
    color: $black;
    &:focus {
      top: 1rem;
    }
  }
  </style>
