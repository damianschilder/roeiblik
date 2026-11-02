<template lang="pug">
.page-wrapper
  .presentation
    .text
      h1 Roeiblik
    //- Each tool: its tags, the link, and a line about it (linked to the link by aria-describedby).
    .buttons
      .button.compobeter2
        .tags
          span.tag.compo Comporoeien
          span.tag.wedstro Wedstrijdroeien
        NuxtLink.compobeter(to="/time-team" aria-describedby="uitleg-compobeter")
          span Compobeter
          nuxt-icon(name="person search" aria-hidden="true")
        .info
          nuxt-icon(name="info" aria-hidden="true")
          .info-text#uitleg-compobeter
            | Doorzoek #[span.bold Time-Team] op compo- en wedstrijdresultaten van personen.
      .button.knrbeter2
        .tags
          span.tag.wedstro Wedstrijdroeien
        NuxtLink.statistieken(to="/knrb" aria-describedby="uitleg-knrbeter")
          span KNRBeter
          nuxt-icon(name="person search" aria-hidden="true")
        .info
          nuxt-icon(name="info" aria-hidden="true")
          .info-text#uitleg-knrbeter
            | Doorzoek de #[span.bold KNRB] op klasserende wedstrijdresultaten van personen.
//- No title of its own: the tab reads just "Roeiblik" (title and description from nuxt.config).
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
    font-family: $font-brand;
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

.presentation {
  display: flex;
  flex-direction: column;
  justify-content: center;
  // height: calc(60vh);
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
  color: $orange-text;
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