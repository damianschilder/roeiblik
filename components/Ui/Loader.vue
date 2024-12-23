<template lang="pug">
.component-wrapper
  .loader
</template>

<style lang="scss">
.loader {
  border: 2px solid $neutral90;
  border-top: 2px solid $neutral80;
  border-radius: 50%;
  width: 15px;
  height: 15px;
  animation: spin 1.5s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>