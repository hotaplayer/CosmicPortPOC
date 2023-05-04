<template>
  <q-page class="flex column bg-primary justify-between text-white">
    <h4 class="q-ml-lg">Becoming CosmicPorter!</h4>
    <div
      class="q-pa-md bg-secondary"
      style="border-top-right-radius: 30px; border-top-left-radius: 30px"
    >
      <div class="q-mt-lg">Email</div>
      <q-input
        v-model="email"
        dark
        placeholder="Enter your email"
        color="white"
        :disable="isLoading"
      >
        <template v-slot:prepend>
          <q-icon name="email" color="white" />
        </template>
      </q-input>
      <div class="q-mt-lg">Password</div>
      <q-input
        v-model="password"
        dark
        placeholder="Enter your password"
        type="password"
        color="white"
        :disable="isLoading"
      >
        <template v-slot:prepend>
          <q-icon name="lock" color="white" />
        </template>
      </q-input>
      <div class="q-mt-lg">Retype Password</div>
      <q-input
        v-model="repassword"
        dark
        placeholder="Retype your password"
        type="password"
        color="white"
        :disable="isLoading"
      >
        <template v-slot:prepend>
          <q-icon name="lock" color="white" />
        </template>
      </q-input>

      <q-btn
        no-caps
        label="Signup"
        class="q-mt-xl q-mb-sm q-py-md full-width gradient round-border-md"
        :loading="isLoading"
        @click="signup"
      >
        <template v-slot:loading>
          <q-spinner class="q-mr-md" /> Signing up...
        </template>
      </q-btn>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref } from "vue";
import { useQuasar } from "quasar";
import { useAAStore } from "src/stores/aa-store";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";

export default defineComponent({
  name: "AuthSignupPage",

  setup() {
    const email = ref("");
    const password = ref("");
    const repassword = ref("");

    const router = useRouter();
    const quasar = useQuasar();
    const aaStore = useAAStore();
    const { isLoading } = storeToRefs(aaStore);

    const signup = async () => {
      const res = await aaStore.signup(email.value, password.value);
      if (res === false) {
        quasar.notify({
          message: "Failed to signup. Something goes wrong.",
          color: "dark",
          position: "top",
          timeout: 500,
        });
        return;
      }

      const { walletAddress, token } = res;
      localStorage.setItem("un", email.value);
      localStorage.setItem("wa", walletAddress);
      localStorage.setItem("rm", token);
      localStorage.setItem("xx", password.value);

      router.push("/");
    };

    return {
      email,
      isLoading,
      password,
      repassword,
      signup,
    };
  },
});
</script>
