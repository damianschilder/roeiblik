<template lang="pug">
  .component-wrapper
    .background
      .element-wrapper
        .element-body
          .content
            .left
              h2 {{ rowerStore.rower.displayname }}
              .clubs
                transition-group(name="fade" tag="div" class="club-group")
                  .club(v-if="rowerStore.rower.unique_clubs" v-for="club in rowerStore.rower.unique_clubs" :key="club.id")
                    img(:src="`https://cdn.time-team.nl/assets/club_blade/img/crop/${club.id}.png`")
                    span {{ club.name }}
                UiInfo
                  slot 
                    .help
                      span Waarom zie ik meerdere verenigingen?
                      span De bron bevat geen informatie over bij welke vereniging je zit, alleen onder welke vereniging je voor wedstrijden bent ingeschreven in het verleden.
            .right
              transition(name="fade")
                UiOverviewTable(v-if="rowerStore && rowerStore.rower.roleCounts")
  </template>
  
  <script setup lang="ts">
  const rowerStore = useRowersStore();
  const runtimeConfig = useRuntimeConfig();

  // Function to format the date to "5 June 2022"
function formatDate(dateInput: string | string[]): string {
  let dateString: string;

  // Handle if dateInput is an array
  if (Array.isArray(dateInput) && dateInput.length > 0) {
    dateString = dateInput[0]; // Use the first date in the array
  } else if (typeof dateInput === 'string') {
    dateString = dateInput;
  } else {
    return 'Invalid Date';
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return 'Invalid Date'; // Handle cases where the date cannot be parsed
  }

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
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
              .clubs {
                display: flex;
                .club {
                  display: flex;
                  align-items: center;
                  column-gap: 0.5rem;
                  margin-bottom: 0.1rem;
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
  }
  

.help {
  text-align: left;
  display: flex;
  width: 30rem;
  row-gap: 0.25rem;
  font-weight: normal;
  color: black;
  flex-direction: column;
  @include tablet-small {
    width: 20rem;
  }
  @include mobile {
    width: 13rem;
  }
  >:first-child {
    font-weight: bold;
    color: $neutral50;
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
  