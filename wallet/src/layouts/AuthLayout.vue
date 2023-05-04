<template>
  <q-layout view="lHh Lpr lFf">
    <q-header>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="arrow_back"
          aria-label="Back"
          @click="$router.go(-1)"
        />

        <q-toolbar-title class="text-center">
          <img
            alt="CosmicPort logo"
            src="~assets/logo.svg"
            style="width: 120px"
          />
        </q-toolbar-title>

        <q-btn flat dense round disable />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "AuthLayout",

  setup() {},
});
</script>
