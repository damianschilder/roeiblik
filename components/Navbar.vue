<template lang="pug">
.navbar-wrapper
  .element-wrapper
      .element-body 
        .navbar-content
          .left
          NuxtLink.title( to="/") Roeiblik
          .right
            NuxtLink.faq(to="/faq") FAQ
</template>

<style lang="scss">
.navbar-wrapper {
  grid-area: 'navbar';
  height: 75px;
  background-color: white;
  filter: drop-shadow(0px 4px 1px rgba(0, 0, 0, 0.25));
}

.element-wrapper{
  height: 100%;
}

.navbar-content {
  height: 100%;
  display: flex;
  align-items: center;
  font-size: 32px;
  justify-content: space-between;

  .left {
    display: none;
  }

  .right {
    display: flex;
    align-items: center;
    
    .faq {
      font-weight: bold;
      font-size: 1.2rem;
      text-decoration: none;
      color: $neutral50;
      letter-spacing: .15rem;

      &:hover {
        color: $seed;
      }
    }
  }

  .title {
    color: $seed;
    font-family: "Racing Sans One";
    text-decoration: none;
  }

  // Mobile-specific adjustments
  @include mobile {
    justify-content: center; // Centers all content

    .left,
    .right {
      display: none; // Hide the other elements
    }

    .title {
      display: block; // Ensure the title is visible
      text-align: center; // Explicitly center the text
    }
  }
}

</style>