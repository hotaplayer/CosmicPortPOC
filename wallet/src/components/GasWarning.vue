<template>
  <div
    class="flex items-center bg-amber-7 q-mx-md q-mb-md q-pa-md round-border-sm"
  >
    <div class="flex row justify-between items-center">
      <q-icon name="local_gas_station" size="sm" />

      <div class="text-subtitle2 q-ml-sm" style="max-width: 70vw">
        Actions here may incur gas fee. <br />Estimation ≈
        {{ usdGas.toFixed(5) }} USD
      </div>
    </div>
  </div>
</template>
<script>
import { onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useAAStore } from "src/stores/aa-store";

export default {
  setup() {
    const aaStore = useAAStore();
    const { usdGas } = storeToRefs(aaStore);

    onMounted(async () => {
      aaStore.estimateGasFee();
    });

    return {
      usdGas,
    };
  },
};
</script>
<style lang=""></style>
