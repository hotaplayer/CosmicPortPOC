<template>
  <q-page class="flex column text-white bg-primary">
    <h4 class="q-ml-lg q-mt-md">Receive</h4>
    <div>
      <div class="flex flex-center">
        <img src="~assets/receive_qr.png" style="width: 85vw" />
        <div
          class="flex justify-between items-center q-mt-md"
          style="width: 85vw"
        >
          <q-btn
            no-caps
            class="q-py-md round-border-md bg-dark"
            icon-right="content_copy"
            :label="aaStore.formatWallet(walletAddress)"
            @click="copy"
          />
          <q-btn rounded class="q-py-md bg-dark" icon="share" />
        </div>
      </div>
    </div>
  </q-page>
</template>
<script>
import { ref } from "vue";
import { useQuasar } from "quasar";
import { useAAStore } from "src/stores/aa-store";

export default {
  name: "ActionReceivePage",
  setup() {
    const walletAddress = ref(localStorage.getItem("wa"));
    const quasar = useQuasar();
    const aaStore = useAAStore();

    const copy = () => {
      navigator.clipboard.writeText(walletAddress.value).then(() => {
        quasar.notify({
          message: "Copied!",
          color: "dark",
          position: "top",
          timeout: 500,
        });
      });
    };

    const formatWallet = (input) => {
      return (
        input.substring(0, 13) + "..." + input.substring(input.length - 10)
      );
    };

    return {
      aaStore,
      walletAddress,
      copy,
      formatWallet,
    };
  },
};
</script>
