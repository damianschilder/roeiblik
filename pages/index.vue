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
      .button.compobeter2
        .tags
          span.tag.compo Comporoeien
          span.tag.wedstro Wedstrijdroeien
        NuxtLink.compobeter(to="/Time-Team")
          span Compobeter
          nuxt-icon(name="person search" style="style-one")
        .info
          nuxt-icon(name="info")
          .info-text
            span Doorzoek 
            span.bold Time-Team 
            span op compo- en wedstrijdresultaten van personen.
      .button.knrbeter2
        .tags
          span.tag.wedstro Wedstrijdroeien
        NuxtLink.statistieken(to="/KNRB")
          span KNRBeter
          nuxt-icon(name="person search" style="style-one")
        .info
          nuxt-icon(name="info")
          .info-text
            span Doorzoek de 
            span.bold KNRB 
            span op klasserende wedstrijdresultaten van personen.
      .button.statistieken2
        .tags
          span.tag.wedstro Wedstrijdroeien
        NuxtLink.statistieken(to="/KNRB/statistieken")
          span Statistieken
          nuxt-icon(name="leaderboard")
        .info
          nuxt-icon(name="info")
          .info-text
            span Landelijkse statistieken van de 
            span.bold KNRB 
            span per veld.
</template>

<style lang="scss" scoped>
.page-wrapper {
  display: flex;
  flex-direction: column;
//  padding: 3rem 0 0;
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
  flex-direction: column;
  row-gap: 0.5rem;
}

.compobeter2 {
  max-width: 263.25px;
}

.knrbeter2 {
  max-width: 227.25px
}

.bold {
  font-weight: bold;
}

.statistieken2 {
  max-width: 255.627px
}

.tags {
  display: flex;
  column-gap: 0.5rem;
}
.tag {
  padding: 0.25rem 0.5rem;
  width: max-content;
  border-radius: 5px;
  font-size: 0.75rem;
}
.info {
  display: flex;
  column-gap: 0.5rem;
  font-size: 0.9rem;
  .nuxt-icon {
    display: flex;
    flex-direction: column;
  }
  :deep(svg) {
    height: 1.25rem;
    width: 1.25rem;
    margin-bottom: 0;
    align-self: start;
  }
}
.compo {
  outline: 1px solid $orange;
  color: $orange;
}

.wedstro {
  outline: 1px solid #9800E0;
  color: #9800E0;
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
  @include tablet-small {
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

.compobeter {
  background-color: $roeiblik;
  color: white;
  &:hover {
    background-color: initial;
    color: black;
    filter: drop-shadow(0px 0px 0px $black);
  }
}
</style>