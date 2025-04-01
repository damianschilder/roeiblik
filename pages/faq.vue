<template lang="pug">
.page-wrapper
  .element-wrapper
    .element-body
      .content
        h2 Vaak gestelde vragen
        .compobeter
          h3 Compobeter
          .questions
            .question
              span wat zijn dit voor resultaten?
              .answer
                span Roeiblik haalt alle Time-Team-vermeldingen van een persoon op via Time-Team. Time-Team maakt zelf geen onderscheid tussen competitie, wedstrijd, klasserend of niet-klasserend.
                span Deze website is afhankelijk van Time-Team en maakt daarom ook geen onderscheid.
                br
                br
                span Voor klasserende resultaten heeft KNRB tegenwoordig een eigen 
                a(href="https://roeievenementen.knrb.nl/person-search") website
                span .
            .question
              span Waarom sta ik er twee keer in?
              span In Time-Team bestaan er dan twee verschillende versies van dezelfde persoon. Dit zijn vaak bijvoorbeeld een competitie- en een niet-competitieversie. Hoewel beide versies dezelfde naam delen, worden ze in Time-Team als twee afzonderlijke personen beschouwd, en is er geen mogelijkheid om met zekerheid vast te stellen dat het om dezelfde persoon gaat.
            .question
              span Er staan meerdere verenigingen bij mijn naam, ook als ik daar niet lid van ben.
              span Time-Team registreert niet van welke vereniging iemand lid is, maar alleen voor welke vereniging er wordt gestart.
              span Om te verduidelijken of de juiste persoon is gevonden, worden deze verenigingen onder de naam weergegeven.
</template>

<script setup lang="ts">
useHead({
  title: 'FAQ',
  meta: [
    { name: 'description', content: 'Vaak gestelde vragen.' },
  ],
});
</script>

<style lang="scss" scoped>
.content {
  padding: 3.5rem 0 1rem;
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
      font-weight: bold;
      color: $black50;
    }
  }
}
</style>