<template>
  <q-page class="flex column bg-stars text-white">
    <home-header :username="username" :wallet-address="walletAddress" />

    <div v-if="isLoading" class="flex column flex-center q-my-xl">
      <q-circular-progress
        indeterminate
        rounded
        size="50px"
        color="dark"
        class="q-ma-md"
      />
    </div>
    <div v-else class="flex column flex-center q-my-xl">
      <div class="text-grey text-subtitle q-mb-sm">Net worth</div>
      <h3 class="text-gradient text-weight-bold q-ma-none">
        {{ !!balance ? balance.toFixed(5) : balance }} ETH
      </h3>
    </div>

    <q-space />

    <div class="flex column flex-end q-mb-md">
      <div
        class="flex column flex-center border-gradient q-pa-lg q-mx-md q-my-sm"
        @click="$router.push('/action/buy')"
      >
        <img class="q-mx-md" src="~assets/icon_buy@2x.png" height="40" />
        <h6 class="q-ma-none">Buy</h6>
      </div>
      <div
        class="flex column flex-center border-gradient q-pa-lg q-mx-md q-my-sm"
        @click="$router.push('/action/transfer')"
      >
        <img class="q-mx-xs" src="~assets/icon_transfer@2x.png" height="40" />
        <h6 class="q-ma-none">Transfer</h6>
      </div>
      <div
        class="flex column flex-center border-gradient q-pa-lg q-mx-md q-my-sm"
        @click="$router.push('/action/receive')"
      >
        <img class="q-mx-sm" src="~assets/icon_qrcode@2x.png" height="40" />
        <h6 class="q-ma-none">Receive</h6>
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import { useAAStore } from "src/stores/aa-store";
import HomeHeader from "src/components/HomeHeader.vue";
import { storeToRefs } from "pinia";

export default defineComponent({
  name: "HomePage",

  components: {
    HomeHeader,
  },

  setup() {
    const username = ref(localStorage.getItem("un"));
    const walletAddress = ref(localStorage.getItem("wa"));

    const quasar = useQuasar();
    const aaStore = useAAStore();
    const { balance, isLoading } = storeToRefs(aaStore);

    onMounted(async () => {
      if (balance.value !== null) return;
      const res = await aaStore.fetchBalance();
      if (res === false) {
        quasar.notify({
          message: "Failed to fetch balance",
          color: "dark",
          position: "top",
          timeout: 500,
        });
        return;
      }
      const { eth } = res;
      aaStore.setBalance(eth);
    });

    return {
      balance,
      isLoading,
      walletAddress,
      username,
    };
  },
});
</script>
