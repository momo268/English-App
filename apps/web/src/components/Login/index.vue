<template>
  <div
    v-if="isShowLogin"
    class="fixed inset-0 z-40 bg-zinc-950/45 backdrop-blur-sm"
    @click="hide"
  ></div>
  <Transition name="fade">
    <div
      v-if="isShowLogin"
      class="fixed inset-30 flex items-center justify-center z-50"
    >
      <div
        class="flex h-[700px] w-[1200px] overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-2xl shadow-zinc-950/25"
      >
        <!-- 左侧 3D 模型区域 -->
        <ModelViewer @changeType="changeType" />

        <!-- 右侧登录表单区域 -->
        <div class="flex flex-1 flex-col justify-center bg-[#fbfaf7] px-12 py-10">
          <LoginForm v-if="loginType === 'login'" />
          <RegisterForm v-if="loginType === 'register'" />
          <div class="mt-6 text-center">
            <div
              class="flex items-center justify-center gap-4 text-sm text-zinc-500"
            >
              <span
                class="cursor-pointer transition-colors hover:text-teal-700"
                >忘记密码？</span
              >
              <span class="text-zinc-300">|</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import LoginForm from "./LoginForm.vue";
import RegisterForm from "./RegisterForm.vue";
import { ref, inject, watch, onMounted, onUnmounted, defineAsyncComponent } from "vue";
import { IS_SHOW_LOGIN } from "./type";
import type { LoginType } from "./type";
import { useLogin } from "@/hooks/useLogin";
const isShowLogin = inject(IS_SHOW_LOGIN, ref(false));
const { hide } = useLogin();
const loginType = ref<LoginType>("login");
// 只有打开登录框时才下载 3D 模型组件，避免拖慢其他页面。
const ModelViewer = defineAsyncComponent(() => import("./ModelViewer.vue"));
watch(isShowLogin, (open) => {
  if (open) loginType.value = 'login';
});
//1. pinia
//2. event bus
//3. provide/inject
const changeType = (url: LoginType) => {
  loginType.value = url;
};
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape") {
    hide();
  }
};
onMounted(() => window.addEventListener("keydown", handleKeydown));
onUnmounted(() => window.removeEventListener("keydown", handleKeydown));
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
