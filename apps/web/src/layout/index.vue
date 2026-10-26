<template>
  <Header v-if="!isFocus" />
  <Content />
</template>
<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import Header from "./Header/index.vue";
import Content from "./Content/index.vue";

const route = useRoute();
const isFocus = computed(() => route.meta.focus === true);
</script>
