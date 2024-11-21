<template lang="pug">
.footer-wrapper 
  .element-wrapper
    .element-body 
      .footer-content
        NuxtLink Roeiblik
        .source 
          span Source: Time-Team Regatta Systems 
          a(href="https://time-team.nl/") https://time-team.nl/
          span .
</template>

<style lang="scss" scoped>
.footer-wrapper {
  grid-area: 'footer';
  height: 7rem;
  background-color: white;
}

.footer-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(230, 0, 0, 1);
  font-family: "Racing Sans One";
  font-size: 32px;
  a {
    color: rgba(230, 0, 0, 1);
    text-decoration: none;
  }
  > .source {
  margin-top: 1rem;
  color: black;
  font-size: 13px;
  > a {
    color: black;
  }
}
}
</style>