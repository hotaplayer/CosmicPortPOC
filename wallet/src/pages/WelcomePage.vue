<template>
  <q-page class="flex column flex-center bg-cosmic text-white">
    <h4>Get Started</h4>
    <q-btn
      no-caps
      label="Create a new wallet"
      class="q-mb-sm q-py-md gradient round-border-md"
      style="width: 60vw"
      @click="$router.push('/auth/signup')"
    />
    <q-btn
      no-caps
      label="I have a CosmicPort wallet"
      class="q-mt-sm round-border-md"
      style="width: 60vw"
      @click="$router.push('/auth/login')"
    />
    <p class="q-my-lg text-grey">Or continue with</p>
    <div class="flex row justify-between" style="width: 60vw">
      <q-btn no-caps class="bg-dark round-border-md" style="width: 47%">
        <div class="flex items-center q-gutter-md">
          <img
            height="15"
            src="https://www.freepnglogos.com/uploads/google-logo-png/google-logo-png-suite-everything-you-need-know-about-google-newest-0.png"
          />
          <div>Google</div>
        </div>
      </q-btn>
      <q-btn no-caps class="bg-dark round-border-md" style="width: 47%">
        <div class="flex items-center q-gutter-md">
          <img
            height="20"
            src="https://freepngimg.com/thumb/apple/70214-apple-format-grey-logo-macintosh-icon.png"
          />
          <div>Apple</div>
        </div>
      </q-btn>
    </div>
  </q-page>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "WelcomePage",
});
</script>
