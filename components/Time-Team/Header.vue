<template lang="pug">
  .component-wrapper
    .background
      .element-wrapper
        .element-body
          .content
            .left
              h1 {{ profile.person.displayname }}
              .clubs
                transition-group(name="fade" tag="div" class="club-group")
                  .club(v-for="club in profile.clubs" :key="club.id")
                    img(
                      :src="club.blade || `https://cdn.time-team.nl/assets/club_blade/img/crop/${club.id}.png`"
                      alt=""
                      @error="handleImageError($event)")
                    span {{ club.name }}
              p.first-sign(v-if="profile.firstRace") {{ firstRaceText }}
            .right
              transition(name="fade")
                Time-TeamWinsTable(v-if="rowerStore.personStatus === 'done'")
  </template>

  <script setup lang="ts">
  import { formatRaceDate } from '@/stores/rowers';
  import type { TtProfile } from '~/types/Timeteam';

  const rowerStore = useRowersStore();
  const profile = computed(() => rowerStore.rower as TtProfile);

  // One text line, so the spaces between its parts survive the template compiler.
  const firstRaceText = computed(() => {
    const first = profile.value.firstRace;
    if (!first) return '';
    const date = formatRaceDate(first.date) || 'datum onbekend';
    return `Eerste race: ${date}, ${[first.entry, first.event].filter(Boolean).join(' | ')}`;
  });

  // A club without a blade image: hide the broken image, keep the name.
  function handleImageError(event: Event): void {
    (event.target as HTMLImageElement).style.visibility = 'hidden';
  }
  </script>

  <style lang="scss" scoped>
  .component-wrapper {
    .background {
      padding: 3.5rem 0 2rem;
      min-height: 5.875rem;
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
              // The person's name is the page's main heading, at the size it always had.
              h1 {
                font-size: 2.5rem;
                @include tablet-small {
                  font-size: 2rem;
                }
                @include mobile {
                  font-size: 2.5rem;
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

  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.5s ease-in-out;
  }

  .fade-enter-from, .fade-leave-to {
    opacity: 0;
  }

  .first-sign {
    opacity: 0.5;
    @include mobile {
      text-align: center;
      margin-bottom: 1rem;
    }
  }
  </style>
