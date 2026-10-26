<template>
  <RouterView />
  <Search />
  <Login />
</template>

<script setup lang="ts">
import { RouterView } from "vue-router";
import Search from "./components/Search/index.vue";
import Login from "./components/Login/index.vue";
import { provide, ref, onMounted, onUnmounted } from "vue";
import { IS_SHOW_LOGIN, REQUIRE_LOGIN_EVENT } from "./components/Login/type";

const isShowLogin = ref(false);
provide(IS_SHOW_LOGIN, isShowLogin); // 是否显示登录框 并且扩展为全局调用 默认不显示

// 401/接口层需要登录时，通过事件打开登录框（不依赖组件上下文）
const handleRequireLogin = () => {
  isShowLogin.value = true;
};
onMounted(() => window.addEventListener(REQUIRE_LOGIN_EVENT, handleRequireLogin));
onUnmounted(() =>
  window.removeEventListener(REQUIRE_LOGIN_EVENT, handleRequireLogin),
);
</script>
