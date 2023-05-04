<template>
  <q-page class="flex column items-center text-white bg-primary">
    <img src="~assets/success.png" height="80" />
    <div class="text-h5 text-white q-mt-md">Transfer Successfully!</div>
    <div class="text-caption text-grey q-my-md">
      Your transfer has been successfully done.
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
        <q-badge color="green-7" label="Waiting for confirmation" />
      </div>

      <div class="flex justify-between items-center q-my-sm">
        <div class="text-subtitle2 text-grey">Transaction ID</div>
        <q-btn
          flat
          dense
          no-caps
          class="q-py-sm round-border-sm bg-dark"
          icon-right="content_copy"
          :label="!!txnHash ? aaStore.formatWallet(txnHash, 5) : ''"
          @click="copy"
        />
      </div>
    </div>

    <q-space />

    <q-btn
      no-caps
      label="Done"
      class="gradient q-ma-md q-pa-md round-border-md"
      style="width: 90vw"
      :loading="isLoading"
      :disable="isLoading"
      @click="acknowledgeTxn"
    />
  </q-page>
</template>

<script>
import { onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";
import { useRoute } from "vue-router";
import { useAAStore } from "src/stores/aa-store";
import { storeToRefs } from "pinia";

export default {
  name: "ActionTransferCompletePage",

  setup() {
    const walletAddress = ref(localStorage.getItem("wa"));
    const txnHash = ref(null);
    let txnDateTime = new Date(Date.now());
    txnDateTime = txnDateTime.toString().substring(4, 24);

    const quasar = useQuasar();
    const router = useRouter();
    const route = useRoute();
    const aaStore = useAAStore();
    const { toAddress, toAmount, ethGas, isLoading } = storeToRefs(aaStore);

    onMounted(async () => {
      txnHash.value = route.params.txnHash;
      return;
    });

    const acknowledgeTxn = async () => {
      const res = await aaStore.fetchBalance();
      if (res === false) router.push({ name: "home" });
      const { eth } = res;
      aaStore.setBalance(eth);
      router.push({ name: "home" });
    };

    const copy = () => {
      navigator.clipboard.writeText(txnHash.value).then(() => {
        quasar.notify({
          message: "Copied!",
          color: "dark",
          position: "top",
          timeout: 500,
        });
      });
    };

    return {
      aaStore,
      ethGas,
      isLoading,
      toAddress,
      toAmount,
      txnDateTime,
      txnHash,
      walletAddress,
      acknowledgeTxn,
      copy,
    };
  },
};
</script>
