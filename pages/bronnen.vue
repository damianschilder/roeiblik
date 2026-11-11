<template lang="pug">
//- The source list, with the project sentence: guides/sources.md in quiet-functionalism. One list
//- on one page of its own, linked from the navbar and the footer. Anchors by name, not number, so
//- a new source breaks no link. A source that states no licence says so.
.page-wrapper
  .element-wrapper
    .element-body
      .content
        h1.page-title Bronnen
        p.intro De uitslagen op Roeiblik zijn niet van Roeiblik. Ze komen van deze bronnen en gaan over de roeiers, stuurlieden en coaches zelf.
        ol.sources
          li#ref-time-team
            strong Time-Team Regatta Systems
            span #[a(href="https://time-team.nl/") time-team.nl]. De uitslagen in #[NuxtLink(to="/time-team") Compobeter]. Licentie: geen vermeld.
          li#ref-knrb
            strong KNRB (Koninklijke Nederlandsche Roeibond)
            span #[a(href="https://roeievenementen.knrb.nl/") roeievenementen.knrb.nl], via Foys. De uitslagen in #[NuxtLink(to="/knrb") KNRBeter]. Licentie: geen vermeld.
        .questions
          .question
            h2 Wat doet Roeiblik ermee?
            span Roeiblik haalt de uitslagen op bij de bron op het moment dat je zoekt, zet die van één persoon bij elkaar en telt zelf de overwinningen (zie de #[NuxtLink(to="/faq") vragen]). Wie daarom vraagt, verbergt Roeiblik (zie #[NuxtLink(to="/privacy") privacy]). Roeiblik is niet verbonden aan Time-Team of de KNRB, heeft met hen geen afspraak en wordt niet door hen gesteund. Voor wat Roeiblik laat zien, is Roeiblik verantwoordelijk.
          .question
            h2 Verdient Roeiblik hieraan?
            span Nee. Roeiblik is een niet-commercieel, open-source project van Damian Schilder: geen advertenties, geen accounts, geen betaalde functies. De code staat op #[a(href="https://github.com/damianschilder/roeiblik") GitHub] onder de MIT-licentie. Die licentie geldt alleen voor de code, niet voor de uitslagen. Roeiblik verkoopt geen gegevens en telt geen bezoekers. Wat je in de zoekbalk typt, gaat naar Time-Team of de KNRB, want daar wordt gezocht.
</template>

<script setup lang="ts">
useHead({
  title: 'Bronnen',
  meta: [
    { name: 'description', content: 'Van wie de uitslagen op Roeiblik zijn: Time-Team en de KNRB. Wat Roeiblik ermee doet, en dat het een niet-commercieel, open-source project is.' },
  ],
});
</script>

<style lang="scss" scoped>
.content {
  padding: 3.5rem 0 1rem;
}

// The same sizes as the h1 on /privacy and /faq.
.page-title {
  font-size: 2.5rem;
  @include tablet-small {
    font-size: 2rem;
  }
  @include mobile {
    font-size: 2.5rem;
  }
}

.intro {
  margin-top: 1.5rem;
}

.sources {
  display: flex;
  flex-direction: column;
  row-gap: 1rem;
  margin-top: 1.5rem;
  padding-left: 1.5rem;
  list-style: decimal;
  li {
    padding-left: 0.25rem;
  }
  strong {
    display: block;
  }
}

.questions {
  display: flex;
  flex-direction: column;
  row-gap: 2rem;
  margin-top: 3rem;
  .question {
    display: flex;
    flex-direction: column;
    row-gap: 0.25rem;
    >:first-child {
      font: inherit;
      font-weight: bold;
      color: $black50;
    }
  }
}
</style>
