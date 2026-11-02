<template lang="pug">
header.navbar-wrapper
  .element-wrapper
    nav.navbar-content(aria-label="Hoofdmenu")
      NuxtLink.title( to="/") Roeiblik
      .middle
        NuxtLink.big(to="/time-team")
          span Compobeter
          nuxt-icon(name="person search" aria-hidden="true")
        NuxtLink.big(to="/knrb")
          span KNRBeter
          nuxt-icon(name="person search" aria-hidden="true")
      .right
        NuxtLink.small(to="/faq") FAQ
      //- Phones: the links above do not fit beside the logo, so a menu button opens them in a panel.
      //- A <details> element: it opens without JavaScript too, and tells screen readers whether it is open.
      details.phone-menu(ref="menu" @keydown.esc="closeMenu(true)")
        summary.menu-button
          nuxt-icon.icon-open(name="menu" aria-hidden="true")
          nuxt-icon.icon-close(name="close" aria-hidden="true")
          span.visually-hidden Menu
        .menu-panel(@click="closeMenu(false)")
          NuxtLink.big(to="/time-team")
            span Compobeter
            nuxt-icon(name="person search" aria-hidden="true")
          NuxtLink.big(to="/knrb")
            span KNRBeter
            nuxt-icon(name="person search" aria-hidden="true")
          NuxtLink.big(to="/faq") FAQ
</template>

<script setup lang="ts">
// The phone menu closes when a link in it is chosen, on another page, on Escape and on a tap
// outside it.
const menu = ref<HTMLDetailsElement | null>(null);

function closeMenu(refocus: boolean) {
  if (!menu.value?.open) return;
  menu.value.open = false;
  if (refocus) menu.value.querySelector('summary')?.focus();
}

function onTapOutside(event: Event) {
  if (menu.value?.open && !menu.value.contains(event.target as Node)) closeMenu(false);
}

const route = useRoute();
watch(() => route.fullPath, () => closeMenu(false));
onMounted(() => document.addEventListener('click', onTapOutside));
onBeforeUnmount(() => document.removeEventListener('click', onTapOutside));
</script>

<style lang="scss" scoped>
.navbar-wrapper {
  grid-area: 'navbar';
  height: 70px;
  position: sticky;
  top: 0;
  z-index: 999;
  backdrop-filter: blur(7px);

}

.element-wrapper{
  height: 100%;
}

.navbar-content {
  position: relative; // anchors the phone menu
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  width: 100%;
  padding: 0 1rem;
  @include mobile {
    justify-content: center;
  }
}
.title {
    color: $roeiblik;
    font-family: $font-brand;
    text-decoration: none;
    font-size: 2rem;
    width: 7.625rem;
}

.middle {
  display: flex;
  column-gap: 2rem;
  @include mobile {
    display: none;
  }
}
.right {
  display: flex;
  justify-content: end;
  column-gap: 0.5rem;
  width: 7.625rem;
  span {
    color: $black50;
  }
  @include mobile {
    display: none;
  }
}

.big {
  display: flex;
  column-gap: 0.25rem;
  text-decoration: none;
  font-weight: bold;
  color: $black80;
  &:hover {
    text-decoration: underline;
    color: $roeiblik-text;
  }
}
.small {
  text-decoration: none;
  color: $black50;
  font-size: 0.9rem;
  &:hover {
    color: $black;
    text-decoration: underline;
  }@include mobile {
    display: none;
  }
}

a {
  :hover {
    color: $roeiblik-text;
  }
}

// Phones only. Absolutely placed, so the logo stays in the middle.
.phone-menu {
  display: none;
  @include mobile {
    display: block;
    position: absolute;
    right: 0.5rem;
  }
}
.menu-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem; // a 44px tap target
  height: 2.75rem;
  border-radius: 5px;
  color: $black80;
  cursor: pointer;
  list-style: none;
  &::-webkit-details-marker {
    display: none;
  }
  &:hover, &:active {
    background-color: $black5;
  }
  .nuxt-icon {
    display: flex;
  }
  :deep(svg) {
    width: 1.75rem;
    height: 1.75rem;
  }
}
.icon-close,
.phone-menu[open] .icon-open {
  display: none !important;
}
.phone-menu[open] .icon-close {
  display: flex !important;
}
// The panel in the style of the homepage buttons: beige, a thin border and the red edge.
.menu-panel {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  display: flex;
  flex-direction: column;
  min-width: 12rem;
  padding: 0.5rem 0;
  background-color: $beige;
  border: 1px solid $black20;
  border-radius: 5px;
  filter: drop-shadow(1px 1px 0px $roeiblik);
  .big {
    align-items: center;
    padding: 0.75rem 1.25rem;
    font-size: 1.125rem;
  }
}
</style>
