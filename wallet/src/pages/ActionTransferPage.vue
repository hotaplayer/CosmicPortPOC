<template>
  <q-page class="flex column text-white bg-primary">
    <h4 class="q-ml-lg q-mt-md">Transfer</h4>

    <div class="flex column bg-dark q-mx-md q-mb-md q-pa-md round-border-sm">
      <div class="flex justify-between items-center">
        <div class="text-subtitle2 text-grey">Send to</div>
        <q-icon
          v-show="isVerified === true"
          name="check_circle"
          color="green-7"
          size="xs"
        />
        <q-icon
          v-show="isVerified === false"
          name="cancel"
          color="red-5"
          size="xs"
        />
      </div>
      <q-input
        outlined
        dark
        color="white"
        v-model="toAddress"
        class="q-mt-sm text-white"
        bg-color="secondary"
        debounce="300"
        @update:model-value="verifyAddress"
      />
    </div>

    <div
      v-if="isVerified === true"
      class="flex column bg-dark q-mx-md q-mb-md q-pa-md round-border-sm"
    >
      <div class="flex justify-between items-center">
        <div class="text-subtitle2 text-grey">Asset</div>
      </div>
      <div class="flex justify-between items-center q-mt-sm">
        <q-btn outline class="round-border-md">
          <div class="flex items-center">
            <img
              height="20"
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Ethereum-icon-purple.svg/768px-Ethereum-icon-purple.svg.png"
            />
            <div>ETH</div>
          </div>
        </q-btn>
        <h5 class="q-ma-none">
          {{ !!balance ? balance.toFixed(5) : balance }}
        </h5>
      </div>
    </div>

    <div
      v-if="isVerified === true"
      class="flex column bg-dark q-mx-md q-mb-md q-pa-md round-border-sm"
    >
      <div class="flex justify-between items-center">
        <div class="text-subtitle2 text-grey">Amount</div>
      </div>
      <q-input
        outlined
        dark
        color="white"
        v-model="amount"
        class="q-mt-sm text-white text-h6"
        bg-color="secondary"
      >
        <template v-slot:append>
          <q-btn no-caps dense flat label="Use max" @click="setAmount('max')" />
        </template>
      </q-input>
    </div>

    <q-space />

    <q-btn
      no-caps
      label="Next"
      class="gradient q-ma-md q-pa-md round-border-md"
      :loading="isLoading"
      @click="simulateTxn"
    >
      <template v-slot:loading>
        <q-spinner class="q-mr-md" /> Loading...
      </template>
    </q-btn>

    <base-dialog ref="approveTxnDialog" title="Transaction Details">
      <template #body>
        <div class="flex column justify-between full-height">
          <transaction-details
            :amount="amount"
            :eth-gas="ethGas"
            :to-address="aaStore.formatWallet(toAddress)"
          />

          <div class="flex column bg-secondary q-my-md q-pa-md round-border-sm">
            <h6 class="q-ma-none text-grey">Pre-sign Checking</h6>
            <div class="flex row justify-between items-center q-mt-md">
              <q-icon name="check_circle" color="blue-7" size="md" />

              <div class="text-subtitle2 text-white" style="max-width: 70vw">
                Transaction may be failed if it exceeds the limit you set in
                settings.
                <span class="text-blue-7" @click="$router.push('/settings')">
                  Update the transaction limit
                </span>
              </div>
            </div>
          </div>

          <q-space />

          <q-btn
            no-caps
            label="Approve"
            class="gradient text-white q-pa-md round-border-md"
            @click="approveTxn"
          />
        </div>
      </template>
    </base-dialog>

    <k-y-c-dialog
      ref="faceIdDialog"
      :is-success="isSuccess"
      @complete="execKYC"
    />
  </q-page>
</template>
<script>
import { ref } from "vue";
import { useQuasar } from "quasar";
import { useAAStore } from "src/stores/aa-store";
import { useRouter } from "vue-router";
import BaseDialog from "src/components/BaseDialog.vue";
import KYCDialog from "src/components/KYCDialog.vue";
import TransactionDetails from "src/components/TransactionDetails.vue";
import { storeToRefs } from "pinia";

export default {
  name: "ActionTransferPage",

  components: {
    BaseDialog,
    KYCDialog,
    TransactionDetails,
  },

  setup() {
    const isVerified = ref(null);
    const isSuccess = ref(false);
    const toAddress = ref("");
    const amount = ref(0);
    const approveTxnDialog = ref(null);
    const faceIdDialog = ref(null);

    const quasar = useQuasar();
    const router = useRouter();
    const aaStore = useAAStore();
    const { balance, ethGas, isLoading } = storeToRefs(aaStore);

    const approveTxn = async () => {
      approveTxnDialog.value.close();
      faceIdDialog.value.open();
    };

    const copy = () => {
      navigator.clipboard.writeText(toAddress.value).then(() => {
        quasar.notify({
          message: "Copied!",
          color: "dark",
          position: "top",
          timeout: 500,
        });
      });
    };

    const execKYC = async () => {
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
          message: "Error when approving transaction...",
          color: "dark",
          position: "top",
          timeout: 500,
        });
        router.push({ name: "failed" });
        return;
      }
      const { transactionHash } = res;
      faceIdDialog.value.close();
      router.push({ name: "completed", params: { txnHash: transactionHash } });
    };

    const simulateTxn = async () => {
      approveTxnDialog.value.open();
    };

    const setAmount = (val) => {
      if (val === "max") {
        amount.value = balance.value;
      }
    };

    const verifyAddress = () => {
      if (toAddress.value.substring(0, 2) === "0x") isVerified.value = true;
      else if (toAddress.value === "") isVerified.value = null;
      else isVerified.value = false;
    };

    return {
      aaStore,
      amount,
      approveTxnDialog,
      balance,
      faceIdDialog,
      isLoading,
      isSuccess,
      isVerified,
      ethGas,
      toAddress,
      approveTxn,
      copy,
      execKYC,
      simulateTxn,
      setAmount,
      verifyAddress,
    };
  },
};
</script>
