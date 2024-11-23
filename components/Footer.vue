<template lang="pug">
.footer-wrapper 
  .element-wrapper
    .element-body 
      .footer-content
        NuxtLink Roeiblik
        .source 
          span Bron: Time-Team Regatta Systems 
          a(href="https://time-team.nl/") https://time-team.nl/
          span .
</template>

<style lang="scss" scoped>
.footer-wrapper {
  grid-area: 'footer';
  height: 7rem;
  background-color: #332B2B;
}

.footer-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(230, 0, 0, 1);
  color: white;
  font-family: "Racing Sans One";
  text-align: center;
  font-size: 32px;
  a {
    text-decoration: none;
  }
  > .source {
  margin-top: 1rem;
  font-size: 13px;
  > a {
    color: white;
  }
}
}
</style>