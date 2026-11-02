<template lang="pug">
header.navbar-wrapper
  .element-wrapper
    nav.navbar-content(aria-label="Hoofdmenu")
      NuxtLink.title( to="/") Roeiblik
      .middle
        NuxtLink.big(to="/time-team")
          span Compobeter
          nuxt-icon(name="person search" aria-hidden="true")
        NuxtLink.big(to="/knrb")
          span KNRBeter
          nuxt-icon(name="person search" aria-hidden="true")
      .right
        NuxtLink.small(to="/faq") FAQ
</template>

<style lang="scss" scoped>
.navbar-wrapper {
  grid-area: 'navbar';
  height: 70px;
  position: sticky;
  top: 0;
  z-index: 999;
  backdrop-filter: blur(7px);

}

.element-wrapper{
  height: 100%;
}

.navbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  width: 100%;
  padding: 0 1rem;
  @include mobile {
    justify-content: center;
  }
}
.title {
    color: $roeiblik;
    font-family: "Racing Sans One";
    text-decoration: none;
    font-size: 2rem;
    width: 7.625rem;
}

.middle {
  display: flex;
  column-gap: 2rem;
  @include mobile {
    display: none;
  }
}
.right {
  display: flex;
  justify-content: end;
  column-gap: 0.5rem;
  width: 7.625rem;
  span {
    color: $black50;
  }
  @include mobile {
    display: none;
  }
}

.big {
  display: flex;
  column-gap: 0.25rem;
  text-decoration: none;
  font-weight: bold;
  color: $black80;
  &:hover {
    text-decoration: underline;
    color: $roeiblik;
  }
}
.small {
  text-decoration: none;
  color: $black50;
  font-size: 0.9rem;
  &:hover {
    color: $black;
    text-decoration: underline;
  }@include mobile {
    display: none;
  }
}

a {
  :hover {
    color: $roeiblik;
  }
}
</style>
