<template lang="pug">
footer.footer-wrapper
  .element-wrapper
    .element-body
      .footer-content
        NuxtLink.title(to="/") Roeiblik
        //- The project sentence and the sources: guides/sources.md in quiet-functionalism.
        .source
          | Roeiblik is een niet-commercieel, open-source project. De uitslagen komen van Time-Team en de KNRB.
          br
          | #[NuxtLink(to="/bronnen") Bronnen] · #[NuxtLink(to="/privacy") Privacy]
</template>

<style lang="scss" scoped>
.footer-wrapper {
  grid-area: 'footer';
  min-height: 7rem; // grows when the sentence wraps on a phone
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 1.5rem 0;
}

.title {
  color: $roeiblik;
}
.footer-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: $font-brand;
  color: $black50;
  text-align: center;
  font-size: 32px;
  a {
    text-decoration: none;
  }
  > .source {
  margin-top: 1rem;
  font-size: 13px;
  > a {
    color: $black50;
    &:hover {
      text-decoration: underline;
    }
  }
}
}
</style>
