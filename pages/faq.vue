<template lang="pug">
//- Headings: h1 for the page, h2 per tool, h3 per question; they keep the sizes they had.
.page-wrapper
  .element-wrapper
    .element-body
      .content
        h1.page-title Vaak gestelde vragen
        section.compobeter(aria-labelledby="faq-compobeter")
          h2.section-title#faq-compobeter Compobeter
          .questions
            .question
              h3 Wat zijn dit voor resultaten?
              .answer
                span Roeiblik haalt alle Time-Team-vermeldingen van een persoon op via Time-Team. Time-Team maakt zelf geen onderscheid tussen competitie, wedstrijd, klasserend of niet-klasserend. Deze website is afhankelijk van Time-Team en maakt daarom ook geen onderscheid.
                br
                br
                span Klasserende resultaten vind je met #[NuxtLink(to="/knrb") KNRBeter], dat de uitslagen van de KNRB doorzoekt. De KNRB heeft daarvoor ook een eigen #[a(href="https://roeievenementen.knrb.nl/person-search") website].
            .question
              h3 Waarom sta ik er twee keer in?
              span In Time-Team bestaan er dan twee verschillende versies van dezelfde persoon. Dit zijn vaak bijvoorbeeld een competitie- en een niet-competitieversie. Hoewel beide versies dezelfde naam delen, worden ze in Time-Team als twee afzonderlijke personen beschouwd, en is er geen mogelijkheid om met zekerheid vast te stellen dat het om dezelfde persoon gaat.
            .question
              h3 Er staan meerdere verenigingen bij mijn naam, ook als ik daar niet lid van ben.
              span Time-Team registreert niet van welke vereniging iemand lid is, maar alleen voor welke vereniging er wordt gestart.
              span Om te verduidelijken of de juiste persoon is gevonden, worden deze verenigingen onder de naam weergegeven.
        section.knrbeter(aria-labelledby="faq-knrbeter")
          h2.section-title#faq-knrbeter KNRBeter
          .questions
            .question
              h3 Wat zijn dit voor resultaten?
              span KNRBeter toont de klasserende wedstrijdresultaten die de KNRB via Foys publiceert: per wedstrijd de velden, ronden en plaatsen. Compo's en niet-klasserende wedstrijden staan er niet in; die vind je met #[NuxtLink(to="/time-team") Compobeter].
        section.algemeen(aria-labelledby="faq-algemeen")
          h2.section-title#faq-algemeen Algemeen
          .questions
            .question
              h3 Hoe actueel zijn de resultaten?
              span Roeiblik haalt de resultaten op bij Time-Team en de KNRB op het moment dat je zoekt, en bewaart een opgevraagd resultaat een paar minuten. Een nieuwe uitslag staat daardoor na hooguit een kwartier ook op Roeiblik.
            .question
              h3 Wanneer telt een race als winst?
              span Een inschrijving telt als winst als de ploeg eerste werd in de race die het veld besliste: de A-finale, of zonder finale de laatste ronde waarna niets meer volgt, zoals een head of een tijdrace. Een eerste plaats in een voorwedstrijd, herkansing, halve finale of B-finale telt niet, net als een race zonder tijd (DNS, DNF, DSQ) of buiten mededinging; bij losse afstanden zonder eindklassement, zoals een vierkamp, alleen als de ploeg op elke afstand eerste werd.
            .question
              h3 Ik wil niet op Roeiblik te vinden zijn.
              span Lees op de #[NuxtLink(to="/privacy") privacypagina] hoe je je persoonspagina laat verbergen.
</template>

<script setup lang="ts">
useHead({
  title: 'FAQ',
  meta: [
    { name: 'description', content: 'Vaak gestelde vragen over Roeiblik, Compobeter en KNRBeter.' },
  ],
});
</script>

<style lang="scss" scoped>
.content {
  padding: 3.5rem 0 1rem;
}

// The sizes these headings had as h2 and h3.
.page-title {
  font-size: 2.5rem;
  @include tablet-small {
    font-size: 2rem;
  }
  @include mobile {
    font-size: 2.5rem;
  }
}
.section-title {
  font: bold 1.125rem/1.5625rem $font-text;
}
section + section {
  margin-top: 3rem;
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
