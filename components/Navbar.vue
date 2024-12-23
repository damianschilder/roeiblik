<template lang="pug">
.navbar-wrapper
  .element-wrapper
    .navbar-content
      NuxtLink.title( to="/") Roeiblik
      .middle
        NuxtLink.big(to="/Time-Team")
          span Compobeter
          nuxt-icon(name="person search")
        NuxtLink.big(to="/KNRB/statistieken")
          span Statistieken
          nuxt-icon(name="leaderboard")
      .right
        NuxtLink.small(to="/faq") FAQ
        //- span |
        //- NuxtLink.small(to="/contact") Contact
</template>

<style lang="scss" scoped>
.navbar-wrapper {
  grid-area: 'navbar';
  height: 70px;
  position: sticky;
  top: 0;
  // background-color: rgba(15, 0, 0, .15);  
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
}
.title {
    color: $roeiblik;
    font-family: "Racing Sans One";
    text-decoration: none;
    font-size: 2rem;
}

.middle {
  display: flex;
  column-gap: 2rem;
}
.right {
  display: flex;
  column-gap: 0.5rem;
  span {
    color: $black50;
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
  }
}

a {
  :hover {
    color: $roeiblik;
  }
}
</style>