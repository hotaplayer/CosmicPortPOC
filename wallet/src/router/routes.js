const routes = [
  {
    path: "/",
    component: () => import("layouts/BaseLayout.vue"),
    children: [
      {
        name: "home",
        path: "",
        component: () => import("pages/HomePage.vue"),
      },
      {
        name: "welcome",
        path: "welcome",
        component: () => import("pages/WelcomePage.vue"),
      },
    ],
  },
  {
    path: "/auth",
    component: () => import("layouts/AuthLayout.vue"),
    children: [
      {
        name: "login",
        path: "login",
        component: () => import("pages/AuthLoginPage.vue"),
        props: { name: true },
      },
      {
        name: "signup",
        path: "signup",
        component: () => import("pages/AuthSignupPage.vue"),
        props: { title: "logo" },
      },
    ],
  },

  {
    path: "/action",
    component: () => import("layouts/ActionLayout.vue"),
    children: [
      {
        name: "buy",
        path: "buy",
        component: () => import("pages/ActionBuyPage.vue"),
      },
      {
        name: "transfer",
        path: "transfer",
        component: () => import("pages/ActionTransferPage.vue"),
      },
      {
        name: "receive",
        path: "receive",
        component: () => import("pages/ActionReceivePage.vue"),
      },
      {
        name: "completed",
        path: "completed/:txnHash",
        props: true,
        component: () => import("pages/ActionTransferCompletedPage.vue"),
      },
      {
        name: "failed",
        path: "failed",
        component: () => import("pages/ActionTransferFailedPage.vue"),
      },
    ],
  },

  {
    path: "/settings",
    component: () => import("layouts/ActionLayout.vue"),
    children: [
      {
        name: "settings",
        path: "",
        component: () => import("pages/SettingsPage.vue"),
        children: [],
      },
      {
        name: "threshold",
        path: "threshold",
        component: () => import("pages/SettingsThresholdPage.vue"),
      },
      {
        name: "change_pwd",
        path: "change_pwd",
        component: () => import("pages/SettingsChangePwdPage.vue"),
      },
      {
        name: "guardians",
        path: "guardians",
        component: () => import("pages/SettingsGuardiansPage.vue"),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
