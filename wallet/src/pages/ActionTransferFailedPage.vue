<template>
  <q-page class="flex column items-center text-white bg-primary">
    <img src="~assets/failed.png" height="80" />
    <div class="text-h5 text-white q-mt-md">Transfer Failed!</div>
    <div class="text-caption text-grey q-my-md">
      Exceed the transaction limit.
    </div>

    <div
      class="flex column justify-start bg-dark round-border-md q-mt-md q-pa-md"
      style="width: 90vw"
    >
      <div class="flex justify-between items-center q-my-sm">
        <div class="text-subtitle2 text-grey">From</div>
        <div class="text-subtitle2 text-white">
          {{ aaStore.formatWallet(walletAddress, 6) }}
        </div>
      </div>

      <div class="flex justify-between items-center q-my-sm">
        <div class="text-subtitle2 text-grey">To</div>
        <div class="text-subtitle2 text-white">
          {{ aaStore.formatWallet(toAddress, 6) }}
        </div>
      </div>

      <div class="flex justify-between items-center q-my-sm">
        <div class="text-subtitle2 text-grey">Payment Method</div>
        <div class="text-subtitle2 text-white">Transfer</div>
      </div>

      <div class="flex justify-between items-center q-my-sm">
        <div class="text-subtitle2 text-grey">Time</div>
        <div class="text-subtitle2 text-white">{{ txnDateTime }}</div>
      </div>

      <div class="flex justify-between items-center q-my-sm">
        <div class="text-subtitle2 text-grey">Amount</div>
        <div class="text-subtitle2 text-white">{{ toAmount }}</div>
      </div>

      <div class="flex justify-between items-center q-my-sm">
        <div class="text-subtitle2 text-grey">Gas</div>
        <div class="text-subtitle2 text-white">{{ ethGas }}</div>
      </div>

      <div class="flex justify-between items-center q-my-sm">
        <div class="text-subtitle2 text-grey">Total</div>
        <div class="text-subtitle2 text-white">
          {{ Number(toAmount) + Number(ethGas) }}
        </div>
      </div>

      <div class="flex justify-between items-center q-my-sm">
        <div class="text-subtitle2 text-grey">Payment Status</div>
        <q-badge color="red-7" label="Failed" />
      </div>
    </div>

    <q-space />

    <q-btn
      no-caps
      outline
      label="Change the limits"
      class="gradient q-pa-md round-border-md"
      style="width: 90vw"
      :loading="isLoading"
      :disable="isLoading"
      @click="$router.push({ name: 'threshold' })"
    />

    <q-btn
      no-caps
      label="Retry"
      class="gradient q-ma-md q-pa-md round-border-md"
      style="width: 90vw"
      :loading="isLoading"
      :disable="isLoading"
      @click="approveTxn"
    />

    <k-y-c-dialog
      ref="faceIdDialog"
      :is-success="isSuccess"
      @complete="retry"
    />
  </q-page>
</template>

<script>
import { onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";
import { useAAStore } from "src/stores/aa-store";
import KYCDialog from "src/components/KYCDialog.vue";
import { storeToRefs } from "pinia";

export default {
  name: "ActionTransferFailedPage",

  components: {
    KYCDialog,
  },

  setup() {
    const isSuccess = ref(false);
    const faceIdDialog = ref(null);
    const walletAddress = ref(localStorage.getItem("wa"));
    const txnHash = ref(null);
    let txnDateTime = new Date(Date.now());
    txnDateTime = txnDateTime.toString().substring(4, 24);

    const quasar = useQuasar();
    const router = useRouter();
    const aaStore = useAAStore();
    const { toAddress, toAmount, ethGas, isLoading } = storeToRefs(aaStore);

    onMounted(async () => {});

    const approveTxn = async () => {
      faceIdDialog.value.open();
    };

    const retry = async () => {
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
      const res = await aaStore.sendTxn();
      if (res === false) {
        quasar.notify({
          message: "Exceed transaction limit...",
          color: "dark",
          position: "top",
          timeout: 10000,
        });
        faceIdDialog.value.close();
        return;
      }
      const { transactionHash } = res;
      faceIdDialog.value.close();
      router.push({ name: "completed", params: { txnHash: transactionHash } });
    };

    return {
      aaStore,
      faceIdDialog,
      ethGas,
      isLoading,
      isSuccess,
      toAddress,
      toAmount,
      txnDateTime,
      txnHash,
      walletAddress,
      approveTxn,
      retry,
    };
  },
};
</script>
