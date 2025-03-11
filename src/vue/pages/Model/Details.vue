<template>
  <Orders :context="context" />
</template>

<script>
import Orders from "@controleonline/ui-crm/src/vue/components/Model/Details.vue";

export default {
  components: {
    Orders,
  },

  data() {
    return {
      context: "proposal",
    };
  },
  created() {},
};
</script>
