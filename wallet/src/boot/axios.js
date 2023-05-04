import { boot } from "quasar/wrappers";
import axios from "axios";

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)
const api = axios.create({
  baseURL: "https://81.69.8.95:443",
});

// Add a request interceptor
api.interceptors.request.use(
  function (config) {
    // Set the access token into headers if logged in
    if (!!localStorage.getItem("rm"))
      config.headers["Authorization"] = localStorage.getItem("rm");
    return config;
  },
  function (error) {
    // Set the isLoading to true
    return Promise.resolve(error.response.data);
  }
);

export default boot(({ app }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api

  app.config.globalProperties.$axios = axios;
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  app.config.globalProperties.$api = api;
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API
});

export { api };
