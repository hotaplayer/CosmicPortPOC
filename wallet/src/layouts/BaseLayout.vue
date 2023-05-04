<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "AuthLayout",

  setup() {
    const addToHomeScreenImpression = (event) => {
      //will not work for chrome, untill fixed
      event.userChoice.then((choiceResult) => {
        console.log(`User clicked ${choiceResult}`);
      });
      //This is to prevent `beforeinstallprompt` event that triggers again on `Add` or `Cancel` click
      window.removeEventListener(
        "beforeinstallprompt",
        addToHomeScreenImpression
      );
    };

    window.addEventListener("beforeinstallprompt", addToHomeScreenImpression);
  },
});
</script>
