<template lang="pug">
.component-wrapper
  .content
    span testt
    .rowers
      table
        thead
          tr
            th
    //-     tbody
    //-       tr(v-for="rower in props.teamMembers.filter(member => !member.isCoach && !member.isCox)" :key="rower.person.personId")
    //-         td {{rower.fullName}}
    //- .coaches
</template>

<script setup lang="ts">
// import type { TeamMember } from "~/types/KNRB";

// const props = defineProps<{
//   teamMembers: TeamMember[];
// }>();
</script>