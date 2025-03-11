<template>
  <Contracts :context="context" />
</template>

<script>
import Contracts from "@controleonline/ui-crm/src/vue/components/Model/Table";

export default {
  components: {
    Contracts,
  },

  computed: {},

  data() {
    return {
      context: "proposal",
    };
  },

  methods: {},
};
</script>
