<template>
  <q-page class="flex column text-white bg-primary">
    <h4 class="q-ml-lg q-mt-md">Change Password</h4>
    <gas-warning />
    <div class="flex column bg-dark q-mx-md q-mb-md q-pa-md round-border-sm">
      <div class="text-subtitle2">Current password</div>
      <q-input
        v-model="currPwd"
        outlined
        dark
        color="white"
        class="q-mt-sm text-white"
        bg-color="secondary"
        debounce="300"
        :disable="isLoading"
      />
    </div>
    <div class="flex column bg-dark q-mx-md q-mb-md q-pa-md round-border-sm">
      <div class="text-subtitle2">New password</div>
      <q-input
        v-model="newPwd"
        outlined
        dark
        color="white"
        class="q-mt-sm text-white"
        bg-color="secondary"
        debounce="300"
        :disable="isLoading"
      />
    </div>
    <div class="flex column bg-dark q-mx-md q-mb-md q-pa-md round-border-sm">
      <div class="text-subtitle2">Retype new password</div>
      <q-input
        v-model="repeatNewPwd"
        outlined
        dark
        color="white"
        class="q-mt-sm text-white"
        bg-color="secondary"
        debounce="300"
        :disable="isLoading"
      />
    </div>

    <q-space />
    <q-btn
      no-caps
      label="Save"
      class="gradient q-ma-md q-pa-md round-border-md"
      @click="faceIdDialog.open()"
    />

    <k-y-c-dialog
      ref="faceIdDialog"
      :is-success="isSuccess"
      @complete="updatePwd"
    />
  </q-page>
</template>
<script>
import { onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import { useAAStore } from "src/stores/aa-store";
import GasWarning from "src/components/GasWarning.vue";
import KYCDialog from "src/components/KYCDialog.vue";
import { storeToRefs } from "pinia";

export default {
  name: "SettingsChangePwdPage",

  components: {
    GasWarning,
    KYCDialog,
  },

  setup() {
    const currPwd = ref("");
    const newPwd = ref("");
    const repeatNewPwd = ref("");
    const faceIdDialog = ref(null);
    const isSuccess = ref(false);

    const quasar = useQuasar();
    const aaStore = useAAStore();
    const { isLoading } = storeToRefs(aaStore);

    const updatePwd = async () => {
      isSuccess.value = false;
      const getKYCRes = await aaStore.getKYC();
      if (getKYCRes === false) {
        quasar.notify({
          message: "Error for KYC API...",
          color: "dark",
          position: "top",
          timeout: 500,
        });
        faceIdDialog.value.close();
        // Error handling
        return;
        // // For mock, just ignore the error and continue
        // getKYCRes = { authCode: "abc", expiration: new Date().getTime(), seqNo: "def1234" }
      }
      isSuccess.value = true;
      const { authCode, expiration, seqNo } = getKYCRes;

      const genProofRes = await aaStore.genProof(
        authCode,
        localStorage.getItem("xx"),
        expiration,
        seqNo
      );
      if (genProofRes === false) {
        quasar.notify({
          message: "Error for generating proof...",
          color: "dark",
          position: "top",
          timeout: 500,
        });
        faceIdDialog.value.close();
        return;
        // // For mock, just ignore the error and continue
        // getKYCRes = { proof: "abc", publicSignals: "" }
      }
      const { proof, publicSignals } = genProofRes;
      aaStore.setProofs(proof, publicSignals);

      const res = await aaStore.updatePwd();
      if (res === false) {
        quasar.notify({
          message: "Failed to update password",
          color: "dark",
          position: "top",
          timeout: 1000,
        });
        return;
      }
      localStorage.setItem("xx", newPwd.value);
    };

    return {
      currPwd,
      faceIdDialog,
      isLoading,
      isSuccess,
      newPwd,
      repeatNewPwd,
      updatePwd,
    };
  },
};
</script>
