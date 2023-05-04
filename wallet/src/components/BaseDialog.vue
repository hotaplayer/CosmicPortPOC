<template>
  <div>
    <q-dialog v-model="isShowing" :maximized="true" persistent>
      <q-card class="bg-dark">
        <q-card-section class="row items-center q-pb-none text-white">
          <div class="text-h5 text-bold">{{ title }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section style="max-height: 100vh" class="scroll">
          <slot name="body">
            {{ message }}
          </slot>
        </q-card-section>

        <q-inner-loading :showing="isLoading" color="primary" />
      </q-card>
    </q-dialog>
  </div>
</template>
<script>
import { defineComponent, ref } from "vue";
import { useAAStore } from "src/stores/aa-store";
import { storeToRefs } from "pinia";

export default defineComponent({
  props: {
    title: {
      type: String,
      default: "Alert",
    },
    message: {
      type: String,
      default: "Something went wrong...",
    },
  },
  setup() {
    const aaStore = useAAStore();
    const { isLoading } = storeToRefs(aaStore);

    const isShowing = ref(false);
    const close = () => {
      isShowing.value = false;
    };
    const open = () => {
      isShowing.value = true;
    };

    return {
      // Variables
      isLoading,
      isShowing,
      // Functions
      close,
      open,
    };
  },
});
</script>
<style></style>
