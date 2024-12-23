<template lang="pug">
//- .beta
//-   NuxtLink(to="/faq") Veel gestelde vragen
.page-wrapper
  .presentation
    //- UiSearch
    //- .button 
    //-   span Statistieken nu uit
    //-   nuxt-icon(name="new releases")
    .text
      h1 Roeiblik
    .buttons
      NuxtLink.compobeter(to="/Time-Team")
        span Compobeter
        nuxt-icon(name="person search" style="style-one")
      NuxtLink.statistieken(to="/KNRB/statistieken")
        span Statistieken
        nuxt-icon(name="leaderboard")
</template>

<style lang="scss" scoped>
.page-wrapper {
  display: flex;
  flex-direction: column;
//  padding: 3rem 0 0;
 height: 100%;
}


.text {
  display: flex;
  flex-direction: column;
  margin-top: 1rem;
  h1 {
    text-align: center;
    color: $seed;
    font-family: "Racing Sans One";
    text-decoration: none;
    font-size: 5.5rem;
  }
  span {
    color: white;
    align-self: center;
    font-size: 1.25rem;
    font-size: 5;
    max-width: 70%;
  }
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

.presentation {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: calc(60vh);
}

.button {
  display: flex;
  align-items: center;
  column-gap: 0.5rem;
  align-self: center;
  background-color: rgba(23, 218, 162, 0.25);
  width: max-content;
  font-size: 0.9rem;
  padding: 0.5rem 0.25rem;
  color: rgba(23, 218, 162, 1);
  border-radius: 5px;
  outline: rgba(23, 218, 162, 1) solid 1px;
  :deep(svg) {
    height: 1.2rem;
    width: 1.2rem;
    margin-bottom: 0;
  }
}

.compobeter, .statistieken {
  display: flex;
  align-items: center;
  column-gap: 0.5rem;
  align-self: center;
  font-size: 2rem;
  width: max-content;
  cursor: pointer;
  text-decoration: none;
  border: 1px solid $black20;
  background-color: $beige;
  padding: 0.75rem 1.25rem;
  filter: drop-shadow(1px 1px 0px $roeiblik);
  border-radius: 5px;
  color: black;
  :deep(svg) {
    height: 2rem;
    width: 2rem;
    margin-bottom: 0;
    align-self: center;;
  }
  &:hover {
    background-color: $roeiblik;
    color: white;
  }
}

.buttons {
  align-self: center;
  display: flex;
  column-gap: 5rem;
  margin-top: 5rem;
  @include mobile {
    flex-direction: column;
    row-gap: 2rem;
  }
}
.nuxt-icon {
  display: flex;
  :deep(svg) {
    align-self: center;;
  }
}
</style>