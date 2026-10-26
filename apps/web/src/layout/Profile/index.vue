<template>
  <section
    class="w-80 overflow-hidden rounded-2xl border border-zinc-200/80 bg-[#fbfaf7] backdrop-blur"
    aria-label="用户资料卡"
  >
    <div class="flex items-center gap-3 px-4 pb-3 pt-3.5">
      <div
        class="grid size-11 shrink-0 place-items-center rounded-full border border-gray-200"
      >
        <img
          class="size-10 rounded-full object-cover"
          :src="avatar"
          loading="lazy"
        />
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex min-w-0 items-center gap-2">
          <div class="flex flex-col gap-1">
            <div
              class="truncate text-sm font-semibold leading-5 text-zinc-950"
              :title="displayName"
            >
              {{ displayName }}
            </div>
            <div
              v-if="bio"
              class="truncate text-xs leading-4 text-zinc-500"
              :title="bio"
            >
              {{ bio }}
            </div>
          </div>
        </div>
        <div
          v-if="!isLoggedIn"
          class="mt-1 text-xs leading-4 text-zinc-500"
        >
          登录后可同步词库进度与打卡数据
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2.5 px-4 pb-3 pt-2" v-if="isLoggedIn">
      <div
        class="rounded-xl border border-zinc-200/80 bg-[#f7f6f1] px-2.5 py-2.5"
      >
        <div class="text-xs leading-4 text-zinc-500">单词数量</div>
        <div class="mt-1 text-lg font-semibold leading-[22px] text-zinc-950">
          {{ userStore?.getUser?.wordNumber ?? 0 }}
        </div>
      </div>
      <div
        class="rounded-xl border border-amber-200/70 bg-amber-50 px-2.5 py-2.5"
      >
        <div class="text-xs leading-4 text-zinc-500">打卡天数</div>
        <div class="mt-1 text-lg font-semibold leading-[22px] text-zinc-950">
          {{ userStore?.getUser?.dayNumber ?? 0 }}
        </div>
      </div>
    </div>

    <div
      class="flex gap-2.5 border-t border-zinc-200/80 bg-white/75 px-4 pb-3.5 pt-3"
    >
      <button
        v-if="!isLoggedIn"
        class="h-9 flex-1 cursor-pointer rounded-xl bg-zinc-900 text-[13px] font-semibold text-white transition duration-150 hover:-translate-y-0.5 hover:bg-zinc-800 active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        type="button"
        @click="loginHandle"
      >
        去登录
      </button>
      <template v-else>
        <button
          class="h-9 flex-1 cursor-pointer rounded-xl border border-zinc-200 bg-white text-[13px] font-semibold text-zinc-700 transition duration-150 hover:-translate-y-0.5 hover:border-zinc-300 hover:text-zinc-950 active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          type="button"
          @click="gotoPath('/setting/index')"
        >
          个人资料
        </button>
        <button
          class="h-9 flex-1 cursor-pointer rounded-xl border border-red-200 bg-red-50 text-[13px] font-semibold text-red-700 transition duration-150 hover:-translate-y-0.5 hover:bg-red-100 active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          type="button"
          @click="logoutHandle"
        >
          退出登录
        </button>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import { computed } from "vue";
import { useAvatar } from "@/hooks/useAvatar";
import { useLogin } from "@/hooks/useLogin";
import { ElMessageBox } from "element-plus";

const { avatar } = useAvatar();
const { login, logout } = useLogin();

const router = useRouter();
const userStore = useUserStore();
const isLoggedIn = computed(() => !!userStore.getUser);
const displayName = computed(() => userStore.getUser?.name ?? "游客");
const bio = computed(() => userStore.getUser?.bio ?? "");

// 跳转页面
const gotoPath = (path: string) => {
  router.push(path);
};

// 登录
const loginHandle = () => {
  login();
};
// 退出登录
const logoutHandle = () => {
  ElMessageBox.confirm("确定退出登录吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    logout();
  });
};
</script>
