<template lang="pug">
  .component-wrapper
    .background
      .element-wrapper
        .element-body
          .content
            .left
              h2 {{ rowerStore.rower.displayname }}
              transition(name="fade")
                .club(v-if="rowerStore.rower.allRaceCrewInfo")
                  img(:src="Object.values(rowerStore.rower.allRaceCrewInfo)[0].blades.crop")
                  span {{ Object.values(rowerStore.rower.allRaceCrewInfo)[0].club.name }}
            .right
              transition(name="fade")
                UiOverviewTable(v-if="rowerStore && rowerStore.rower.roleCounts")
  </template>
  
  <script setup lang="ts">
  const rowerStore = useRowersStore();
  const runtimeConfig = useRuntimeConfig();
  </script>
  
  <style lang="scss" scoped>
  .component-wrapper {
    .background {
      padding: 3.5rem 0 2rem;
      min-height: 5.875rem;
      background-color: rgba(230, 0, 0, 0.05);
      .element-wrapper {
        .element-body {
          display: flex;
          justify-content: center;
          .content {
            max-width: 70%;
            flex: 1;
            display: flex;
            justify-content: space-between;
            column-gap: 1rem;
            @include mobile {
              max-width: initial
            }
            .left {
              display: flex;
              flex-direction: column;
              h1 {
                margin-bottom: 1rem;
              }
              .club {
                display: flex;
                align-items: center;
                column-gap: 0.5rem;
                img {
                  width: 2.7rem;
                  @include tablet-small {
                    width: 2rem;
                  }
                }
                span {
                  font-size: 1.3rem;
                  text-transform: uppercase;
                  font-weight: bold;
                  letter-spacing: .2rem;
                  color: $neutral-variant40;
                  @include tablet-small {
                    font-size: 1rem;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  
  .title {
    display: flex;
    align-items: center;
    column-gap: 0.5rem;
  }
  
  /* Transition CSS */
  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.5s ease-in-out;
  }
  
  .fade-enter-from, .fade-leave-to {
    opacity: 0;
  }
  </style>
  