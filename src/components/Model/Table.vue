<template>
  <DefaultTable :configs="configs" />
</template>

<script>
import { mapActions, mapGetters } from "vuex";
import getConfigs from "./Configs";

export default {
  components: {},
  props: {
    context: {
      required: false,
      default: "contract",
    },
  },
  computed: {
    ...mapGetters({
      myCompany: "people/currentCompany",
    }),
    configs() {
      let config = getConfigs(
        this.context,
        this.myCompany,
        this.$components,
        this.$store
      );
      return config;
    },
  },
};
</script>
