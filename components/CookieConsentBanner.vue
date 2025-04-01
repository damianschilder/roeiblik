<template lang="pug">
.cookie-consent-banner( v-if="!cookieAccepted" )
  .content
    .text
      span.roeiblik Roeiblik 
      span gebruikt cookies om uw gebruikerservaring te verbeteren. Door "Accepteer Cookies" te klikken, gaat u akkoord met ons gebruik van cookies.
    .button(@click="acceptCookies") Accepteer Cookies
</template>

<script setup>
import { ref, onMounted } from 'vue';

// Use runtime config to access public variables
const config = useRuntimeConfig();
const gtagId = config.public.gtagId;

const cookieAccepted = ref(false);

// Check if the user has already accepted cookies on component mount
onMounted(() => {
  if (localStorage.getItem('cookieConsent') === 'true') {
    cookieAccepted.value = true;
    loadGtag();
  } else {
  }
});

// Function to handle cookie acceptance
function acceptCookies() {
  cookieAccepted.value = true;
  localStorage.setItem('cookieConsent', 'true');
  loadGtag();
}

// Function to dynamically load the Google Analytics (gtag) script
function loadGtag() {
  // Prevent duplicate script injection
  if (document.getElementById('gtag-script')) {
    return;
  }
  
  
  // Load the gtag.js script asynchronously
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gtagId}`;
  script.id = 'gtag-script';
  script.onload = () => {
  };
  document.head.appendChild(script);
  
  // Inject the initialization code for gtag
  const inlineScript = document.createElement('script');
  inlineScript.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${gtagId}');
  `;
  document.head.appendChild(inlineScript);
}
</script>

<style lang="scss" scoped>
.cookie-consent-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: black;
  color: white;
  text-align: center;
  z-index: 1000;
  padding: 1rem 1rem;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  .button {
    outline: none;
    margin-top: 1rem;
    background: $roeiblik;
    border-radius: 5px;
    padding: 0.5rem 1rem;
    cursor: pointer;
    border: 1px solid $roeiblik;
    &:hover {
      background: white;
      color: $roeiblik;
    }
  }
  .roeiblik {
    color: $roeiblik;
    font-family: "Racing Sans One";
  }
}
</style>
