<template lang="pug">
.footer-wrapper 
  .element-wrapper
    .element-body 
      .footer-content
        NuxtLink Roeiblik
        .source 
          //- span Source: U.S. Department of Agriculture, Agricultural Research Service. FoodData Central, 2019. 
          //- a(href="https://fdc.nal.usda.gov/") fdc.nal.usda.gov
          //- span .
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
  color: $seed;
  font-size: 13px;
  > a {
    color: $seed;
  }
}
}
</style>