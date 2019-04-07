import Vue from "vue";
import App from "./App.vue";
import router from "./router";

Vue.config.productionTip = false;

// router and IE 11 workaround. see: https://github.com/vuejs/vue-router/issues/1911
const IE11RouterFix = {
  methods: {
    hashChangeHandler: function () {
      this.$router.push(window.location.hash.substring(1, window.location.hash.length));
    },
    isIE11: function () {
      return !!window.MSInputMethodContext && !!document.documentMode;
    }
  },
  mounted: function () {
    if (this.isIE11()) { window.addEventListener('hashchange', this.hashChangeHandler); }
  },
  destroyed: function () {
    if (this.isIE11()) { window.removeEventListener('hashchange', this.hashChangeHandler); }
  }
};

new Vue({
  router,
  mixins: [IE11RouterFix],
  render: h => h(App)
}).$mount("#app");
