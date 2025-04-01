<template lang="pug">
  .layout-wrapper
    Navbar
    .slot-wrapper
      slot
    Footer
    //- Add the Cookie Consent Banner here
    CookieConsentBanner(v-if="!cookieAccepted")
  </template>
  
  <script setup lang="ts">
  // Import the banner component (Nuxt might auto-import, but explicit is safer)
  // You can add other layout-specific logic here if needed
  const cookieAccepted = ref(true);

// Check if the user has already accepted cookies on component mount
onMounted(() => {
  if (localStorage.getItem('cookieConsent') === 'true') {
    cookieAccepted.value = true;
  } else {
    cookieAccepted.value = false;
  }
});
  </script>
  
  <style lang="scss" scoped>
  // Your existing styles remain unchanged
  .layout-wrapper {
    display: grid;
    min-height: calc(100vh + 7rem); // Ensure the wrapper spans the full viewport height
    grid-template-columns: 100%;
    grid-template-areas:
      'navbar'
      'nuxt'
      'footer';
    grid-template-rows: 75px 1fr 7rem; // Use 1fr to let the content area grow
    // Make sure $beige is defined in your global styles or imported
    background-color: $beige;
  }
  
  .slot-wrapper {
    grid-area: nuxt;
    padding-bottom: 5rem; // Optional spacing before footer
    height: 100%; // Ensure it takes up the available space
  }
  
  // Note: The actual positioning of the CookieConsentBanner (e.g., fixed to bottom)
  // should be handled within the CookieConsentBanner.vue component's own styles.
  // Adding it here ensures it's part of the layout DOM structure.
  </style>