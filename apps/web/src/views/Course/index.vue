<template>
  <div class="min-h-[60vh] bg-[#f7f6f1]">
    <div class="w-[1200px] max-w-full mx-auto px-4 pt-12 pb-24">
      <!-- 标题 -->
      <header class="mb-10 text-center">
        <p
          class="text-[11px] font-semibold text-teal-700 tracking-[0.3em] uppercase"
        >
          Vocabulary Courses
        </p>
        <h1 class="mt-3 text-3xl font-semibold text-zinc-950 tracking-tight sm:text-4xl">
          精选课程
        </h1>
        <p class="mt-3 text-zinc-500 text-sm max-w-md mx-auto">
          一次购买，长期有效 · 覆盖高考、考研、四六级、托福雅思等
        </p>
        <span class="mx-auto mt-6 block h-px w-12 bg-teal-700/60"></span>
      </header>

      <el-tabs v-model="currentTab" class="course-tabs" @tab-change="handleTabChange">
        <el-tab-pane name="list" label="精选课程"></el-tab-pane>
        <el-tab-pane name="my">
          <template #label>
            <span class="inline-flex items-center gap-1">
              我的课程
              <el-icon v-if="!userStore.user?.id"><Lock /></el-icon>
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>

      <!-- 课程卡片 3 列 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <article
          v-for="item in list"
          :key="item.id"
          class="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white transition-all duration-300 hover:border-zinc-300 hover:shadow-[0_20px_50px_-32px_rgba(24,24,27,0.28)]"
        >
          <div class="relative aspect-4/3 bg-zinc-100 overflow-hidden">
            <img
              :src="imageSrc(item.url)"
              :alt="item.name"
              class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            />
            <div
              class="absolute top-3 left-3 rounded-md bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 backdrop-blur"
            >
              词汇
            </div>
          </div>
          <div class="p-5 flex-1 flex flex-col">
            <h2 class="text-base font-semibold text-zinc-900 line-clamp-1">
              {{ item.name }}
            </h2>
            <p
              class="mt-2 text-sm text-zinc-500 line-clamp-2 leading-relaxed flex-1"
            >
              {{ item.description }}
            </p>
            <div
              class="mt-4 flex items-center justify-between gap-3 border-t border-zinc-100 pt-4"
            >
              <span class="truncate text-xs text-zinc-400"
                >讲师 {{ item.teacher }}</span
              >
              <span class="shrink-0 text-xl font-semibold tracking-tight text-zinc-950"
                >¥{{ item.price }}</span
              >
            </div>
            <div class="mt-4 flex gap-2">
              <button
                type="button"
                @click="openPay(item)"
                class="rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 cursor-pointer"
                :class="currentTab === 'my' ? 'flex-1' : 'w-full'"
              >
                {{ currentTab === "list" ? "购买课程" : "学习课程" }}
              </button>
              <button
                v-if="currentTab === 'my'"
                type="button"
                @click="openReview(item)"
                class="shrink-0 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:text-zinc-950 cursor-pointer"
              >
                复习
              </button>
            </div>
          </div>
        </article>
      </div>
      <el-empty v-if="list.length === 0" description="暂无课程" />
    </div>
    <CoursePay v-model="payVisible" :course="selectedCourse" />
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import type { CourseList } from "@en/common/course";
import { getCourseList, getMyCourse } from "@/apis/course";
import { uploadUrl } from "@/apis";
import CoursePay from "./components/Pay.vue";
import type { Course } from "@en/common/course";
import { useLogin } from "@/hooks/useLogin";
import { useUserStore } from "@/stores/user";
import { useSocket } from "@/hooks/useSocket";
import { useRouter } from "vue-router";
import { Lock } from "@element-plus/icons-vue";

const router = useRouter();
const userStore = useUserStore();
const currentTab = ref("list");
const { login, requireLogin } = useLogin();
const list = ref<CourseList>([]);
const payVisible = ref<boolean>(false);
const selectedCourse = ref<Course | null>(null); //选中的课程
const { connect, disconnect } = useSocket();

const getList = async () => {
  if (currentTab.value === "list") {
    const res = await getCourseList();
    list.value = res.data;
  } else {
    const res = await getMyCourse();
    list.value = res.data;
  }
};

// 未登录点“我的课程”：先弹登录框，登录成功后切过去；取消则留在精选课程
const handleTabChange = async (name: string | number) => {
  if (name === "my" && !userStore.user?.id) {
    const ok = await requireLogin();
    if (!ok) {
      currentTab.value = "list";
      return;
    }
  }
  currentTab.value = String(name);
  await getList();
};

// 打开支付弹框
const openPay = async (course: Course) => {
  const ok = await login();
  if (!ok) return;
  if (currentTab.value === "list") {
    payVisible.value = true;
    selectedCourse.value = course;
  } else {
    router.push(`/learn/index/${course.id}/${course.name}`);
  }
};

// 今日复习：只对“我的课程”开放
const openReview = async (course: Course) => {
  const ok = await login();
  if (!ok) return;
  router.push(`/review/index/${course.id}/${course.name}`);
};

// 退出登录时：断开 socket，并把“我的课程”切回精选课程
watch(
  () => userStore.user?.id,
  (id) => {
    if (id) {
      connect();
    } else {
      disconnect();
      if (currentTab.value === "my") {
        currentTab.value = "list";
        getList();
      }
    }
  },
  { immediate: true },
);

const imageSrc = (url: string) => {
  return uploadUrl + url;
};
onMounted(() => {
  getList();
});
</script>

<style scoped>
.course-tabs :deep(.el-tabs__header) {
  margin-bottom: 2rem;
}
.course-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background-color: #e4e4e7;
}
.course-tabs :deep(.el-tabs__item) {
  height: 40px;
  margin-right: 2rem;
  padding: 0 2px;
  font-size: 14px;
  font-weight: 500;
  color: #71717a;
}
.course-tabs :deep(.el-tabs__item:hover),
.course-tabs :deep(.el-tabs__item.is-active) {
  color: #18181b;
}
.course-tabs :deep(.el-tabs__item.is-active) {
  font-weight: 600;
}
.course-tabs :deep(.el-tabs__active-bar) {
  height: 2px;
  background-color: #0f766e;
}
</style>
