<template>
  <div
    v-if="isShowLogin"
    class="fixed inset-0 z-40 bg-zinc-950/45 backdrop-blur-sm"
    @click="hide"
  ></div>
  <Transition name="fade">
    <div
      v-if="isShowLogin"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      @click.self="hide"
    >
      <div
        class="relative flex h-[min(700px,calc(100dvh-2rem))] w-[min(1100px,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-2xl shadow-zinc-950/25"
      >
        <button
          type="button"
          class="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/80 text-zinc-400 backdrop-blur transition-colors hover:bg-zinc-100 hover:text-zinc-700"
          aria-label="关闭登录窗口"
          @click="hide"
        >
          <el-icon :size="17"><Close /></el-icon>
        </button>

        <!-- 左侧 3D 模型区域（小屏隐藏，避免挤压表单） -->
        <ModelViewer @changeType="changeType" />

        <!-- 右侧登录表单区域 -->
        <div
          class="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto bg-[#fbfaf7] px-5 py-10 sm:px-8 lg:px-12"
        >
          <div class="mb-6 flex rounded-xl bg-zinc-100 p-1 lg:hidden">
            <button
              type="button"
              class="h-9 flex-1 rounded-lg text-sm font-medium transition-colors"
              :class="loginType === 'login' ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-500'"
              @click="changeType('login')"
            >
              登录
            </button>
            <button
              type="button"
              class="h-9 flex-1 rounded-lg text-sm font-medium transition-colors"
              :class="loginType === 'register' ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-500'"
              @click="changeType('register')"
            >
              注册
            </button>
          </div>

          <LoginForm v-if="loginType === 'login'" />
          <RegisterForm v-if="loginType === 'register'" />
          <div v-if="loginType === 'login'" class="mt-6 text-center">
            <div
              class="flex items-center justify-center gap-4 text-sm text-zinc-500"
            >
              <span
                class="cursor-pointer transition-colors hover:text-teal-700"
                >忘记密码？</span
              >
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
import { Close } from "@element-plus/icons-vue";
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
