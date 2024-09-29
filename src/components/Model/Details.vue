<template>
  <DefaultDetail :configs="configs" :id="contractId" />
</template>

<script>
import { mapActions, mapGetters } from "vuex";
import DefaultDetail from "@controleonline/ui-default/src/components/Default/Common/DefaultDetail.vue";
import getConfigs from "./Configs";

export default {
  components: { DefaultDetail },
  props: {
    context: {
      required: false,
      default: "contract",
    },
  },
  data() {
    return {
      contractId: null,
    };
  },
  created() {
    this.contractId = decodeURIComponent(this.$route.params.id);
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
