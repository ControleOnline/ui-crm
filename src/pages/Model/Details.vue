<template>
  <Orders :context="context" />
</template>

<script>
import Orders from "@controleonline/ui-crm/src/components/Model/Details.vue";

export default {
  components: {
    Orders,
  },

  data() {
    return {
      context: "contract",
    };
  },
  created() {},
};
</script>
