<template>
  <q-page class="flex column text-white bg-primary">
    <h4 class="q-ml-lg q-mt-md">Settings</h4>
    <div
      class="flex items-center bg-dark q-mx-md q-mb-md q-pa-md round-border-sm"
      @click="$router.push({ name: 'threshold' })"
    >
      <div class="flex column">
        <div class="text-subtitle2">Transaction settings</div>
        <div class="text-caption">
          All the transaction limits are under your control.
        </div>
      </div>
      <q-space />
      <q-icon name="arrow_forward" size="sm" />
    </div>
    <div
      class="flex items-center bg-dark q-mx-md q-mb-md q-pa-md round-border-sm"
      @click="$router.push({ name: 'change_pwd' })"
    >
      <div class="flex column">
        <div class="text-subtitle2">Change password</div>
        <div class="text-caption">Keep your account safe.</div>
      </div>
      <q-space />
      <q-icon name="arrow_forward" size="sm" />
    </div>
    <div
      class="flex items-center bg-dark q-mx-md q-mb-md q-pa-md round-border-sm"
      @click="$router.push({ name: 'guardians' })"
    >
      <div class="flex column">
        <div class="flex">
          <div class="text-subtitle2">Guardians</div>
          <q-badge rounded class="q-ml-sm" color="green-5">Recommend</q-badge>
        </div>
        <div class="text-caption">
          Set the guardians for account social recovery.
        </div>
      </div>
      <q-space />
      <q-icon name="arrow_forward" size="sm" />
    </div>
    <q-space />
    <q-btn
      no-caps
      outline
      color="red"
      label="Logout"
      class="q-ma-md q-pa-md round-border-md"
      @click="logout"
    />
  </q-page>
</template>
<script>
export default {
  name: "SettingsPage",

  setup() {
    const logout = () => {
      localStorage.removeItem("un");
      localStorage.removeItem("rm");
      localStorage.removeItem("wa");
      window.location.reload();
    };

    return {
      logout,
    };
  },
};
</script>
