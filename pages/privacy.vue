<template lang="pug">
.page-wrapper
  .element-wrapper
    .element-body
      .content
        h2 Privacy
        p.intro Roeiblik maakt openbare roeiuitslagen van Time-Team en de KNRB doorzoekbaar. Hier staat welke gegevens daarbij gebruikt worden en wat je rechten zijn.
        .questions
          .question
            span Wie is verantwoordelijk?
            span Roeiblik is een hobbyproject van Damian Schilder. Vragen en verzoeken kun je mailen naar #[a(href="mailto:parels.app@gmail.com") parels.app@gmail.com].
          .question
            span Welke gegevens toont Roeiblik?
            span Namen, verenigingen, geboortejaren (alleen bij de KNRB), uitslagen, tijden en ploeggenoten van roeiers, stuurlieden en coaches, zoals Time-Team en de KNRB die zelf openbaar publiceren. Roeiblik haalt ze op het moment dat je zoekt op bij Time-Team (time-team.nl) en bij de KNRB (via Foys) en bewaart ze niet in een database: een opgevraagd resultaat blijft hooguit tien minuten in het werkgeheugen van de server. De statistiekenpagina toont uitslagen per veld en per vereniging.
          .question
            span Waarom mag dat?
            span Op grond van gerechtvaardigd belang (artikel 6 lid 1 onder f AVG): roeiers, stuurlieden en coaches hun eigen en elkaars openbare wedstrijdresultaten overzichtelijk laten terugvinden. Roeiblik voegt geen gegevens toe aan wat de bron al openbaar maakt. Persoonspagina's worden niet door zoekmachines geïndexeerd, zodat je ze alleen vindt door op Roeiblik zelf te zoeken.
          .question
            span Wat legt Roeiblik over jou als bezoeker vast?
            span Niets wat jou herkenbaar maakt: Roeiblik gebruikt geen cookies, geen account en geen advertentie- of trackingdiensten. Als bezoekersaantallen gemeten worden, gebeurt dat met Cloudflare Web Analytics, zonder cookies en zonder persoonsgegevens. De hosting (Cloudflare) verwerkt technisch noodzakelijke gegevens, zoals je IP-adres, om de site te leveren en te beveiligen.
          .question
            span Ik wil niet op Roeiblik te vinden zijn.
            span Mail de link naar je persoonspagina naar #[a(href="mailto:parels.app@gmail.com") parels.app@gmail.com]. Binnen een maand verdwijnen je persoonspagina en je zoekresultaat van Roeiblik. Je naam kan dan nog in de uitslag van een ploeg staan, en bij de bron (Time-Team of de KNRB) blijft hij openbaar; daarvoor kun je bij hen terecht. Voor een kind onder de 16 kan een ouder of voogd het verzoek doen.
          .question
            span Andere rechten en klachten
            span Je kunt ook vragen welke gegevens Roeiblik over je toont, of bezwaar maken. Kom je er met ons niet uit, dan kun je een klacht indienen bij de #[a(href="https://autoriteitpersoonsgegevens.nl/") Autoriteit Persoonsgegevens].
        p.updated Laatst bijgewerkt: 2 november 2026
</template>

<script setup lang="ts">
useHead({
  title: 'Privacy',
  meta: [
    { name: 'description', content: 'Welke gegevens Roeiblik gebruikt en wat je rechten zijn.' },
  ],
});
</script>

<style lang="scss" scoped>
.content {
  padding: 3.5rem 0 1rem;
}

.intro {
  margin-top: 1.5rem;
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

.updated {
  margin-top: 3rem;
  font-size: 13px;
  color: $black50;
}
</style>
