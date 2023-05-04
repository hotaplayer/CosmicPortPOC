<template>
  <div>
    <q-dialog
      v-model="isShowing"
      :maximized="false"
      position="bottom"
      persistent
    >
      <q-card class="bg-dark">
        <q-card-section style="max-height: 100vh" class="scroll">
          <vue3-lottie
            :animation-data="faceIdJson"
            style="height: 200px"
            :loop="1"
            @onComplete="$emit('complete')"
          />
          <div
            v-if="isSuccess !== true"
            class="text-h5 text-white text-center q-mb-md"
          >
            Face Recognition
          </div>
          <div v-else class="text-h5 text-white text-center q-mb-md">
            Success
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>
<script>
import { defineComponent, ref } from "vue";
import { Vue3Lottie } from "vue3-lottie";
import faceIdJson from "src/assets/faceid.json";

export default defineComponent({
  components: {
    Vue3Lottie,
  },
  props: {
    title: {
      type: String,
      default: "Alert",
    },

    isSuccess: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const isShowing = ref(false);
    const close = () => {
      isShowing.value = false;
    };
    const open = () => {
      isShowing.value = true;
    };

    return {
      // Variables
      faceIdJson,
      isShowing,
      // Functions
      close,
      open,
    };
  },
});
</script>
<style></style>
