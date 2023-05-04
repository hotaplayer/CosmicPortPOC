<template>
  <q-page class="flex column text-white bg-primary">
    <h4 class="q-ml-lg q-mt-md">Guardians</h4>
    <div class="q-mx-lg q-mb-lg text-caption text-grey">
      Guardians are available to assist you in recovering your account through
      the use of email_based social recovery if you happen to forget your
      password.
    </div>
    <gas-warning />
    <div
      class="flex items-center bg-dark q-mx-md q-mb-md q-pa-md round-border-sm"
    >
      <div class="flex column">
        <div class="text-subtitle2 text-grey">Your account</div>
        <div class="text-subtitle2">
          {{ username }}
        </div>
      </div>
      <q-space />
      <q-icon name="check_circle" color="green-7" size="sm" />
    </div>
    <div
      v-for="(guardian, index) in guardians"
      :key="guardian"
      class="flex items-center bg-dark q-mx-md q-mb-md q-pa-md round-border-sm"
    >
      <div class="flex column">
        <div class="text-subtitle2 text-grey">Guardian {{ index + 1 }}</div>
        <div class="text-subtitle2">{{ guardian }}</div>
      </div>
      <q-space />
      <q-icon name="delete_forever" color="red-7" size="sm" />
    </div>
    <div class="flex column bg-dark q-mx-md q-mb-md q-pa-md round-border-sm">
      <div class="text-subtitle2">New Guardian</div>
      <q-input
        v-model="newGuardian"
        outlined
        dark
        color="white"
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
            label="Add"
            :disable="isLoading"
            :loading="isLoading"
            @click="addGuardians"
          />
        </template>
      </q-input>
    </div>

    <k-y-c-dialog
      ref="faceIdDialog"
      :is-success="isSuccess"
      @complete="faceIdDialog.close()"
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
  name: "SettingsGuardiansPage",

  components: {
    GasWarning,
    KYCDialog,
  },

  setup() {
    const faceIdDialog = ref(null);
    const isSuccess = ref(false);
    const newGuardian = ref("");
    const username = ref(localStorage.getItem("un"));

    const quasar = useQuasar();
    const aaStore = useAAStore();
    const { guardians, isLoading } = storeToRefs(aaStore);

    onMounted(async () => {
      if (guardians.value.length > 0) return;
      const res = await aaStore.fetchGuardians();
      if (res === false) {
        quasar.notify({
          message: "Error when fetching guardians...",
          color: "dark",
          position: "top",
          timeout: 500,
        });
        return;
      }
      aaStore.setGuardians(res);
    });

    const addGuardians = async () => {
      if (!!!newGuardian.value) return;
      faceIdDialog.value.open();
      const res = await aaStore.updateGuardian(newGuardian.value);
      if (res === false) {
        quasar.notify({
          message: "Error when adding guardians...",
          color: "dark",
          position: "top",
          timeout: 1000,
        });
        return;
      }
      let newGuardians = [newGuardian.value, ...guardians.value];
      aaStore.setGuardians(newGuardians);
      faceIdDialog.value.close();
    };

    return {
      aaStore,
      faceIdDialog,
      guardians,
      isLoading,
      isSuccess,
      newGuardian,
      username,
      addGuardians,
    };
  },
};
</script>
