<template>
  <div>
    <p>hello from markdown</p>
    <pre v-if="!error">{{ content }}</pre>
    <pre v-else>{{ error }}</pre>
  </div>
</template>

<script>
function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }

  var error = new Error(response.statusText || response.status);
  error.response = response;
  throw error;
}

function getText(response) {
  return response.text();
}

export default {
  name: "markdown",
  data() {
    return {
      content: null,
      error: null
    };
  },
  beforeRouteEnter(to, from, next) {
    fetch(to.path)
      .then(checkStatus)
      .then(getText)
      .then(response => {
        next(vm => vm.setData(null, response));
      })
      .catch(error => {
        next(vm => vm.setData(error, null));
      });
  },
  // when route changes and this component is already rendered,
  // the logic will be slightly different.
  beforeRouteUpdate(to, from, next) {
    this.content = null;
    fetch(to.path)
      .then(checkStatus)
      .then(getText)
      .then(response => {
        this.setData(null, response);
        next();
      })
      .catch(error => {
        this.setData(error, null);
        next();
      });
  },
  methods: {
    setData(err, content) {
      if (err) {
        this.error = err.toString();
      } else {
        this.content = content;
      }
    }
  }
  //   mounted: function() {
  //     console.log("mounted",this.$route.path);
  //   },
  //   updated: function() {
  //       console.log("updated",this.$route.path);
  //   }
};
</script>
