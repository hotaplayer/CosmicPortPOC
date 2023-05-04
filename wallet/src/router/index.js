import { route } from "quasar/wrappers";
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from "vue-router";
import routes from "./routes";

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === "history"
    ? createWebHistory
    : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(
      process.env.MODE === "ssr" ? void 0 : process.env.VUE_ROUTER_BASE
    ),
  });

  Router.beforeEach((to, from, next) => {
    // Instead of having to check every route record
    // for login session, we do in here

    // Redirect if the user is not logged in yet
    if (
      to.name != "login" &&
      to.name != "signup" &&
      to.name != "welcome" &&
      !!!localStorage.getItem("wa")
    ) {
      // this route requires auth, check if logged in
      // if not, redirect to login page.
      next({
        name: "welcome",
      });
    }

    // Preventing user to go back to login page
    if (
      (to.name === "login" || to.name === "signup" || to.name === "welcome") &&
      !!localStorage.getItem("wa")
    ) {
      next({
        name: from.name,
      });
    }

    // Else
    next();
  });

  return Router;
});
