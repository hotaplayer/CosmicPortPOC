<template>
  <q-page class="flex column bg-primary justify-between text-white">
    <h4 class="q-ml-lg">Welcome back!</h4>
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

      <div class="q-my-lg text-blue-7">Forget password</div>

      <q-btn
        no-caps
        label="Login"
        class="q-mb-sm q-py-md full-width gradient round-border-md"
        :loading="isLoading"
        @click="login"
      >
        <template v-slot:loading>
          <q-spinner class="q-mr-md" /> Logging in...
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
  name: "AuthLoginPage",

  setup() {
    const email = ref("");
    const password = ref("");

    const router = useRouter();
    const quasar = useQuasar();
    const aaStore = useAAStore();
    const { isLoading } = storeToRefs(aaStore);

    const login = async () => {
      console.log("Call API!", email.value, password.value);
      const res = await aaStore.login(email.value, password.value);
      if (res === false) {
        quasar.notify({
          message: "Failed to login. Something goes wrong.",
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
      login,
    };
  },
});
</script>
