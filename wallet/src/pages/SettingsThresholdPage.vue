<template>
  <q-page class="flex column text-white bg-primary">
    <h4 class="q-ml-lg q-mt-md">Transaction Settings</h4>
    <gas-warning />
    <div
      class="flex items-center bg-dark q-mx-md q-mb-md q-pa-md round-border-sm"
    >
      <div class="flex column">
        <div class="text-subtitle2">Daily limit</div>
        <div class="text-caption">The transaction limit per day.</div>
      </div>
      <q-space />
      <q-btn
        no-caps
        flat
        :loading="isLoading && isChangingTxnLimit === false"
        class="q-py-md round-border-md bg-dark"
        :label="`${dailyLimit} ETH`"
      >
        <q-icon right size="xs" name="edit" />
      </q-btn>
    </div>

    <div class="flex column bg-dark q-mx-md q-mb-md q-pa-md round-border-sm">
      <div class="flex items-center">
        <div class="flex column">
          <div class="text-subtitle2">Transaction Limit</div>
          <div class="text-caption">The limit per transaction.</div>
        </div>
        <q-space />
        <q-btn
          v-if="isChangingTxnLimit === false"
          no-caps
          flat
          :loading="isLoading"
          class="q-py-md round-border-md bg-dark"
          :label="`${Number(txnLimit).toFixed(3)} ETH`"
          @click="changingTxnLimit"
        >
          <q-icon right size="xs" name="edit" />
        </q-btn>
        <q-btn
          v-else
          rounded
          flat
          icon="close"
          text-color="red-7"
          :disable="isLoading"
          @click="isChangingTxnLimit = false"
        />
      </div>
      <q-input
        v-if="isChangingTxnLimit === true"
        outlined
        dark
        color="white"
        v-model="newTxnLimit"
        class="q-mt-sm text-white"
        bg-color="secondary"
        debounce="300"
        :disable="isLoading"
      >
        <template v-slot:append>
          <q-btn
            no-caps
            dense
            flat
            label="Set"
            :disable="isLoading"
            :loading="isLoading"
            @click="faceIdDialog.open()"
          />
        </template>
      </q-input>
    </div>

    <k-y-c-dialog
      ref="faceIdDialog"
      :is-success="isSuccess"
      @complete="updateLimits"
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
  name: "SettingsThresholdPage",

  components: {
    GasWarning,
    KYCDialog,
  },

  setup() {
    const dailyLimit = ref("1");
    const faceIdDialog = ref(null);
    const isChangingTxnLimit = ref(false);
    const isSuccess = ref(false);
    const newTxnLimit = ref(null);

    const quasar = useQuasar();
    const aaStore = useAAStore();
    const { isLoading, txnLimit } = storeToRefs(aaStore);

    onMounted(async () => {
      if (!!txnLimit.value) return;
      const res = await aaStore.fetchLimits();
      const { threshold } = res;
      aaStore.setLimits(threshold);
    });

    const changingTxnLimit = () => {
      newTxnLimit.value = txnLimit.value.toFixed(3);
      isChangingTxnLimit.value = true;
    };

    const updateLimits = async () => {
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
        return;
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
      }
      const { proof, publicSignals } = genProofRes;
      aaStore.setProofs(proof, publicSignals);

      const res = await aaStore.updateLimits(newTxnLimit.value);
      if (res === false) {
        quasar.notify({
          message: "Error for update limits...",
          color: "dark",
          position: "top",
          timeout: 500,
        });
        faceIdDialog.value.close();
        isChangingTxnLimit.value = false;
        return;
      }
      const { threshold } = res;
      aaStore.setLimits(threshold);
      isChangingTxnLimit.value = false;
      faceIdDialog.value.close();
    };

    return {
      aaStore,
      dailyLimit,
      faceIdDialog,
      isChangingTxnLimit,
      isLoading,
      isSuccess,
      newTxnLimit,
      txnLimit,
      changingTxnLimit,
      updateLimits,
    };
  },
};
</script>
