<template>
  <div class="flex justify-start q-mx-lg q-my-md">
    <img src="~assets/profile.png" height="50" />
    <div class="flex column q-ml-md justify-center items-start">
      <div class="q-px-xs text-subtitle2">{{ username }}</div>
      <q-btn no-caps dense class="text-caption text-grey" @click="copy">
        {{ aaStore.formatWallet(walletAddress, 7) }}
      </q-btn>
    </div>
    <q-space />
    <div class="flex justify-end items-center">
      <q-btn round>
        <q-avatar size="30px">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Ethereum-icon-purple.svg/768px-Ethereum-icon-purple.svg.png"
          />
        </q-avatar>
      </q-btn>
      <q-btn
        round
        flat
        icon="settings"
        class="q-ml-sm"
        @click="$router.push('/settings')"
      />
    </div>
  </div>
</template>
<script>
import { useAAStore } from "src/stores/aa-store";

export default {
  name: "HomeHeader",

  props: {
    username: {
      type: String,
      default: "user1@cosmicport.network",
    },
    walletAddress: {
      type: String,
      default: "0x1234567890abcdefghijkLvM",
    },
  },

  methods: {
    copy: function () {
      navigator.clipboard.writeText(this.walletAddress).then(() => {
        this.$q.notify({
          message: "Copied!",
          color: "dark",
          position: "top",
          timeout: 500,
        });
      });
    },
  },

  setup() {
    const aaStore = useAAStore();

    return {
      aaStore,
    };
  },
};
</script>
