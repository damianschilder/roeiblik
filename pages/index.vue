<template lang="pug">
.beta
  NuxtLink(to="/faq") Veel gestelde vragen
.page-wrapper
  UiSearch
</template>

<style lang="scss" scoped>
.page-wrapper {
  display: flex;
  flex-direction: column;
 padding: 3rem 0 0;
 height: 100%;
}

.beta {
  display: none;
  justify-content: center;
  align-items: center;
  padding: 0.5rem 0.5rem;
  font-size: 0.9rem;
  background-color: rgba(230, 0, 0, 0.10);;
  a {
    color: #663333;

  }
  @include mobile {
    display: flex;
  }
}
</style>