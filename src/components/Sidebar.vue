<template>
  <div>
    <form 
      class="bd-search d-flex align-items-center" 
      @submit.prevent="performSearch">
      <input
        class="form-control mr-sm-2"
        type="search"
        placeholder="Search"
        aria-label="Search"
        v-model="term"
      >
    </form>
    <nav class="collapse bd-links"></nav>
  </div>
</template>

<script>
export default {
  name: "sidebar",
  data() {
    return {
      term: null
    };
  },
  methods: {
    performSearch: function() {
      // emit event
      // this.$emit("search", this.term);
      // or redirect
      this.$router.push("/search/" + this.term);
    }
  }
};
</script>
