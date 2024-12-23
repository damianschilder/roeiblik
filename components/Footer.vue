<template lang="pug">
.footer-wrapper 
  .element-wrapper
    .element-body 
      .footer-content
        NuxtLink.title Roeiblik
        .source 
          span Bron: Time-Team Regatta Systems 
          a(href="https://time-team.nl/") https://time-team.nl/
          span .
</template>

<style lang="scss" scoped>
.footer-wrapper {
  grid-area: 'footer';
  height: 7rem;
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
  font-family: "Racing Sans One";
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
  }
}
}
</style>