<template>
  <div>
    <!-- <div class="flex flex-center q-mt-md">
      <q-icon name="error" color="white" size="100px" />
    </div> -->
    <div class="flex column text-white q-mb-md">
      <h6 class="q-mb-sm">Send Token</h6>
      <div class="flex justify-between items-center q-my-sm">
        <q-btn outline disable class="round-border-md">
          <div class="flex items-center">
            <img
              height="20"
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Ethereum-icon-purple.svg/768px-Ethereum-icon-purple.svg.png"
            />
            <div>ETH</div>
          </div>
        </q-btn>
        <h6 class="q-ma-none">{{ amount }} ETH</h6>
      </div>
      <div class="flex justify-between items-center">
        <div class="text-grey text-subtitle2">To address</div>
        <q-btn
          flat
          dense
          no-caps
          class="q-py-sm round-border-sm bg-dark"
          icon-right="content_copy"
          :label="toAddress"
          @click="$emit('copy')"
        />
      </div>
    </div>

    <div class="text-white q-mb-md">
      <div class="flex items-center text-h6 q-my-sm">
        Gas Fee<q-badge class="q-ml-sm" color="green-7" label="estimation" />
      </div>
      <div class="flex justify-between items-center q-my-sm">
        <q-btn outline disable class="round-border-md">
          <div class="flex items-center">
            <img
              height="20"
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Ethereum-icon-purple.svg/768px-Ethereum-icon-purple.svg.png"
            />
            <div>ETH</div>
          </div>
        </q-btn>
        <h6 class="q-ma-none">{{ ethGas }} ETH</h6>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: "TransactionDetails",
  props: {
    amount: {
      type: String || Number,
    },
    ethGas: {
      type: String || Number,
    },
    toAddress: {
      type: String,
    },
  },
};
</script>
