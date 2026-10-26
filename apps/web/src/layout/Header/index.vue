<template>
  <header
    class="sticky top-0 z-10 flex h-20 items-center justify-center border-b border-zinc-200/80 bg-white"
  >
    <div class="mx-auto flex h-full w-[1200px] max-w-full items-center gap-2 px-3 sm:gap-3 sm:px-4">
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-teal-800 px-2 py-1 text-2xl font-bold text-white"
      >
        E
      </div>
      <div class="hidden shrink-0 text-2xl font-bold sm:block">English App</div>
      <nav
        class="flex min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto [scrollbar-width:none] sm:gap-1 [&::-webkit-scrollbar]:hidden"
      >
        <template v-for="route in routes" :key="route.path">
          <div
            @click="gotoPath(route.path)"
            :class="isActive(route.path)"
            :title="route.name"
            :aria-label="route.name"
            class="flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-[10px] px-2 py-1"
          >
            <el-icon>
              <component :is="route.icon" />
            </el-icon>
            <span class="hidden lg:inline">{{ route.name }}</span>
          </div>
        </template>
      </nav>
      <div
        class="hidden shrink-0 items-center gap-2 rounded-full bg-teal-50 px-2 py-1 text-teal-800 lg:flex"
      >
        <el-icon>
          <Sunny />
        </el-icon>
        <span class="font-bold text-sm">{{
          userStore.getUser?.wordNumber ?? 0
        }}</span>
      </div>
      <div
        class="hidden shrink-0 items-center gap-2 rounded-full bg-amber-200 px-2 py-1 text-amber-700 lg:flex"
      >
        <el-icon>
          <Star />
        </el-icon>
        <span class="font-bold text-sm">{{
          userStore.getUser?.dayNumber ?? 0
        }}</span>
      </div>
      <el-popover :width="340">
        <template #reference>
          <div
            class="flex shrink-0 cursor-pointer items-center gap-2 border-l border-zinc-200 pl-3 sm:pl-4"
          >
            <img class="ml-1 mr-1 h-10 w-10 rounded-full sm:ml-2 sm:mr-2" :src="avatar" />
            <span class="hidden text-sm font-bold sm:inline">{{
              userStore.getUser?.name ?? "游客"
            }}</span>
          </div>
        </template>
        <Profile />
      </el-popover>
    </div>
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
  Calendar,
  Collection,
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
const routes = [
  { path: "/", name: "主页", icon: HomeFilled, isAuth: false }, //不需要登录
  { path: "/chat/index", name: "AI", icon: MagicStick, isAuth: true }, //需要登录
  { path: "/word-book/index", name: "词库", icon: Notebook, isAuth: false }, //不需要登录
  { path: "/courses/index", name: "课程", icon: Reading, isAuth: false }, //不需要登录
  { path: "/plan/index", name: "计划", icon: Calendar, isAuth: true }, //需要登录
  { path: "/wrong-book/index", name: "错词本", icon: Collection, isAuth: true }, //需要登录
  { path: "/setting/index", name: "设置", icon: Setting, isAuth: true }, //需要登录
];
const isActive = (path: string) => {
  return currentPath.value === path
    ? "bg-teal-50 text-teal-800"
    : "text-zinc-500 hover:bg-teal-50 hover:text-teal-800";
};
watch(
  () => router.currentRoute.value,
  (newVal) => {
    currentPath.value = newVal.path;
  },
  {
    immediate: true,
  },
);

const gotoPath = async (path: string) => {
  const isAuth = routes.find((route) => route.path === path)?.isAuth ?? false;
  // 需要登录的入口：登录成功后自动跳转；取消则留在当前页
  if (isAuth) {
    await requireLogin(() => {
      router.push(path);
    });
  } else {
    router.push(path);
  }
};
</script>
