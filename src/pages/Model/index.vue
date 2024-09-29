<template>
  <Contracts :context="context" />
</template>

<script>
import Contracts from "@controleonline/ui-crm/src/components/Model/Table";

export default {
  components: {
    Contracts,
  },

  computed: {},

  data() {
    return {
      context: "contract",
    };
  },

  methods: {},
};
</script>
