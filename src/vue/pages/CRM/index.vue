<template>
  <Tasks :context="context" store="crm" />
</template>

<script>
import Tasks from "@controleonline/ui-tasks/src/vue/components/Tasks";

export default {
  components: {
    Tasks,
  },
  data() {
    return {
      context: 'relationship',
    };
  },
  computed: {
  },
  created() {
  },
  watch: {
  },
};
</script>