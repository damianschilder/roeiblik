<template lang="pug">
.navbar-wrapper
  .element-wrapper
      .element-body 
        .navbar-content
          NuxtLink( to="/") Roeiblik
</template>

<style lang="scss">
.navbar-wrapper {
  grid-area: 'navbar';
  height: 75px;
  background-color: white;
  filter: drop-shadow(0px 4px 1px rgba(0, 0, 0, 0.25));
}

.element-wrapper{
  height: 100%;
}

.navbar-content {
  height: 100%;
  display: flex;
  align-items: center;
  font-family: "Racing Sans One";
  font-size: 32px;
  color: $seed;
  @include mobile {
    justify-content: center;
  }
  a {
  color: $seed;
  text-decoration: none;
  }
}
</style>