<template>
  <header
    class="sticky top-0 z-10 flex h-[76px] items-center justify-center border-b border-zinc-200/80 bg-white/95 backdrop-blur"
  >
    <div class="mx-auto flex h-full w-[1200px] max-w-full items-center gap-2 px-3 sm:gap-3 sm:px-4">
      <button
        type="button"
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-700 transition-colors hover:bg-teal-50 hover:text-teal-800 lg:hidden"
        aria-label="打开导航菜单"
        @click="menuOpen = true"
      >
        <span class="flex w-5 flex-col gap-[5px]">
          <span class="h-px w-5 rounded-full bg-current" />
          <span class="h-px w-5 rounded-full bg-current" />
          <span class="h-px w-5 rounded-full bg-current" />
        </span>
      </button>

      <RouterLink
        to="/"
        class="flex shrink-0 items-center gap-2.5 rounded-xl transition-opacity hover:opacity-80 sm:gap-3"
        aria-label="回到首页"
      >
        <span
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-teal-800 text-2xl font-bold text-white"
        >
          E
        </span>
        <span class="text-lg font-semibold tracking-[-0.03em] text-zinc-950 sm:text-[22px]">
          English App
        </span>
      </RouterLink>

      <nav
        class="ml-2 hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex xl:ml-4"
      >
        <button
          v-for="route in routes"
          :key="route.path"
          type="button"
          :class="isActive(route.path)"
          :title="route.name"
          :aria-label="route.name"
          class="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-[#fbfaf7] hover:text-teal-800"
          @click="gotoPath(route.path)"
        >
          <el-icon :size="16">
            <component :is="route.icon" />
          </el-icon>
          <span>{{ route.name }}</span>
        </button>
      </nav>

      <div
        class="ml-auto hidden shrink-0 items-center gap-2 rounded-full bg-teal-50 px-2.5 py-1.5 text-teal-800 xl:flex"
        title="已学单词"
      >
        <el-icon :size="15"><Sunny /></el-icon>
        <span class="text-sm font-semibold tabular-nums">{{ userStore.getUser?.wordNumber ?? 0 }}</span>
      </div>
      <div
        class="hidden shrink-0 items-center gap-2 rounded-full bg-amber-100 px-2.5 py-1.5 text-amber-700 xl:flex"
        title="连续打卡"
      >
        <el-icon :size="15"><Star /></el-icon>
        <span class="text-sm font-semibold tabular-nums">{{ userStore.getUser?.dayNumber ?? 0 }}</span>
      </div>

      <el-popover :width="340" trigger="click" popper-class="profile-popover">
        <template #reference>
          <button
            type="button"
            class="ml-auto flex shrink-0 items-center gap-2 rounded-full border border-zinc-200 bg-white p-0.5 pr-2 transition-colors hover:border-teal-200 hover:bg-teal-50/40 sm:ml-2 sm:pr-3"
            aria-label="个人中心"
          >
            <img class="h-9 w-9 rounded-full object-cover sm:h-10 sm:w-10" :src="avatar" />
            <span class="hidden max-w-[8rem] truncate text-sm font-medium text-zinc-800 sm:inline">
              {{ userStore.getUser?.name ?? "游客" }}
            </span>
          </button>
        </template>
        <Profile />
      </el-popover>
    </div>

    <el-drawer
      v-model="menuOpen"
      direction="ltr"
      size="min(320px, 86vw)"
      :with-header="false"
      :append-to-body="true"
      class="mobile-nav-drawer"
    >
      <div class="flex h-full flex-col bg-[#fbfaf7]">
        <div class="flex items-center justify-between border-b border-zinc-200/80 px-5 py-4">
          <RouterLink to="/" class="flex items-center gap-3" @click="menuOpen = false">
            <span
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-800 text-2xl font-bold text-white"
            >
              E
            </span>
            <span class="text-lg font-semibold tracking-[-0.03em] text-zinc-950">English App</span>
          </RouterLink>
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-200/70 hover:text-zinc-900"
            aria-label="关闭菜单"
            @click="menuOpen = false"
          >
            <el-icon :size="17"><Close /></el-icon>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-3 py-4">
          <p class="px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">导航</p>
          <nav class="mt-2 space-y-1">
            <button
              v-for="route in routes"
              :key="route.path"
              type="button"
              :class="isActive(route.path)"
              class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors hover:bg-teal-50 hover:text-teal-800"
              @click="handleMenuNavigate(route.path)"
            >
              <el-icon :size="18">
                <component :is="route.icon" />
              </el-icon>
              <span class="flex-1">{{ route.name }}</span>
              <span
                v-if="route.isAuth && !userStore.getUser"
                class="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-normal text-zinc-400"
              >
                需登录
              </span>
            </button>
          </nav>

          <div class="mt-6 grid grid-cols-2 gap-2 px-1">
            <div class="rounded-xl border border-zinc-200/80 bg-white px-3 py-3">
              <p class="text-[11px] text-zinc-400">已学单词</p>
              <p class="mt-1 text-lg font-semibold tabular-nums text-zinc-950">
                {{ userStore.getUser?.wordNumber ?? 0 }}
              </p>
            </div>
            <div class="rounded-xl border border-zinc-200/80 bg-white px-3 py-3">
              <p class="text-[11px] text-zinc-400">连续打卡</p>
              <p class="mt-1 text-lg font-semibold tabular-nums text-zinc-950">
                {{ userStore.getUser?.dayNumber ?? 0 }}
                <span class="text-[11px] font-normal text-zinc-400">天</span>
              </p>
            </div>
          </div>
        </div>

        <div class="border-t border-zinc-200/80 px-5 py-4">
          <p class="text-[11px] text-zinc-400">English App · 每天学一点</p>
        </div>
      </div>
    </el-drawer>
  </header>
</template>

<script setup lang="ts">
import {
  Sunny,
  Star,
  HomeFilled,
  Notebook,
  MagicStick,
  Reading,
  Setting,
  Collection,
  Close,
} from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
import { watch, ref } from "vue";
import { useUserStore } from "@/stores/user";
import Profile from "../Profile/index.vue";
import { useAvatar } from "@/hooks/useAvatar";
import { useLogin } from "@/hooks/useLogin";

const { avatar } = useAvatar();
const userStore = useUserStore();
const router = useRouter();
const { requireLogin } = useLogin();
const currentPath = ref("");
const menuOpen = ref(false);
const routes = [
  { path: "/", name: "主页", icon: HomeFilled, isAuth: false },
  { path: "/chat/index", name: "AI", icon: MagicStick, isAuth: true },
  { path: "/word-book/index", name: "词库", icon: Notebook, isAuth: false },
  { path: "/courses/index", name: "课程", icon: Reading, isAuth: false },
  { path: "/wrong-book/index", name: "错词本", icon: Collection, isAuth: true },
  { path: "/setting/index", name: "设置", icon: Setting, isAuth: true },
];
const isActive = (path: string) => {
  const active =
    currentPath.value === path ||
    (path === "/word-book/index" && currentPath.value.startsWith("/word-book/"));
  return active
    ? "bg-teal-50 text-teal-800 hover:bg-teal-100/70"
    : "text-zinc-500 hover:bg-teal-50 hover:text-teal-800";
};
watch(
  () => router.currentRoute.value,
  (newVal) => {
    currentPath.value = newVal.path;
    menuOpen.value = false;
  },
  { immediate: true },
);

const gotoPath = async (path: string) => {
  const isAuth = routes.find((route) => route.path === path)?.isAuth ?? false;
  if (isAuth) {
    await requireLogin(() => {
      router.push(path);
    });
  } else {
    router.push(path);
  }
};

const handleMenuNavigate = async (path: string) => {
  menuOpen.value = false;
  await gotoPath(path);
};
</script>

<style scoped>
:global(.mobile-nav-drawer .el-drawer__body) {
  padding: 0;
}
:global(.profile-popover) {
  max-width: calc(100vw - 24px);
}
</style>
