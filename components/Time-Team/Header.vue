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
                  .club(v-if="rowerStore.rower.unique_clubs" v-for="club in rowerStore.rower.unique_clubs" :key="club.id" )
                    img(
                      :src="`https://cdn.time-team.nl/assets/club_blade/img/crop/${club.id}.png`"
                      @error="handleImageError($event)")
                    span {{ club.name }}
              .first-sign( v-if="rowerStore.rower.firstRace")
                span Eerste race: 
                span.date  {{formatDate(rowerStore.rower.firstRace.date)}}, 
                span {{rowerStore.rower.firstRace.entry_name}} | 
                span {{rowerStore.rower.firstRace.event_code}}, 
                //- NuxtLink( to="/faq")
                //-   UiInfo( v-if="rowerStore.rower.unique_clubs && rowerStore.rower.unique_clubs.length > 1")
            .right
              transition(name="fade")
                Time-TeamWinsTable(v-if="rowerStore && rowerStore.rower.roleCounts")
  </template>
  
  <script setup lang="ts">
  const rowerStore = useRowersStore();
  const runtimeConfig = useRuntimeConfig();

// Handle broken image error
function handleImageError(event: Event): void {
  const imgElement = event.target as HTMLImageElement;
  imgElement.style.visibility = 'hidden'; // Hide the broken image
}

  // Function to format the date to "5 June 2022"
  function formatDate(dateInput: string | string[]): string {
  let dateString: string;
  if (Array.isArray(dateInput) && dateInput.length > 0) {
    dateString = dateInput[0];
  } else if (typeof dateInput === 'string') {
    dateString = dateInput;
  } else {
    return undefined;
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return undefined;
  }
  return date.toLocaleDateString('nl-NL', {
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
      /* background-color: rgba(230, 0, 0, 0.05); */
      border-bottom: 1px solid $black10;
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
              max-width: initial;
              flex-direction: column;
            }
            .left {
              display: flex;
              flex-direction: column;
              h2 {
                @include mobile {
                  text-align: center;
                  margin-bottom: 0.2rem;
                }
              }
              .clubs {
                display: flex;
                margin-bottom: 1rem;
                @include mobile {
                  justify-content: center;

                }
                .club-group {
                  @include mobile {
                    justify-content: center;
                    margin-right: 0.5rem;
                    display: flex;
                    flex-wrap: wrap;
                    column-gap: 1rem;
                  }
                }
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
                    color: black50;
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
    color: $black50;
  }
}

.info {
  right: 0;
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

  .first-sign {
    /* font-weight: bold; */
    opacity: 0.5;
    @include mobile {
      text-align: center;
      margin-bottom: 1rem;
    }
  }
  </style>
  