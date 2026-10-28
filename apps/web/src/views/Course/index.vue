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

      <div v-if="currentTab === 'my'" class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p class="text-xs text-zinc-500">
          已加入 {{ list.length }} 门课程，自定义课程会显示在这里。
        </p>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-sm"
          @click="openImport"
        >
          <el-icon :size="16"><Upload /></el-icon>
          导入课程
        </button>
      </div>

      <!-- 课程卡片 3 列 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <article
          v-for="item in list"
          :key="item.id"
          class="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white transition-all duration-300 hover:border-zinc-300 hover:shadow-[0_20px_50px_-32px_rgba(24,24,27,0.28)]"
        >
          <div
            v-if="item.isCustom"
            class="relative flex aspect-4/3 flex-col justify-between overflow-hidden bg-[#101312] p-5 text-white"
          >
            <div class="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(15,118,110,0.5),transparent_55%)]" />
            <div class="relative flex items-center justify-between">
              <span class="rounded-md bg-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-100">
                自定义课程
              </span>
              <el-icon :size="20" class="text-teal-200"><Notebook /></el-icon>
            </div>
            <div class="relative">
              <p class="text-[11px] uppercase tracking-[0.2em] text-white/50">Vocabulary</p>
              <p class="mt-1 text-lg font-semibold tracking-tight">{{ item.wordCount || 0 }} 个单词</p>
            </div>
          </div>
          <div v-else class="relative aspect-4/3 bg-zinc-100 overflow-hidden">
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
                >{{ item.isCustom ? '自定义' : `讲师 ${item.teacher}` }}</span
              >
              <span
                v-if="currentTab === 'list'"
                class="shrink-0 text-xl font-semibold tracking-tight text-zinc-950"
              >
                {{ item.isCustom ? '免费' : `¥${item.price}` }}
              </span>
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
            <div v-if="item.isCustom" class="mt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                class="text-xs text-zinc-500 transition-colors hover:text-teal-700"
                @click="renameCourse(item)"
              >
                重命名
              </button>
              <button
                type="button"
                class="text-xs text-zinc-400 transition-colors hover:text-red-600"
                @click="deleteCourse(item)"
              >
                删除
              </button>
            </div>
          </div>
        </article>
      </div>
      <el-empty
        v-if="list.length === 0"
        :description="currentTab === 'my' ? '还没有课程，点击右上角导入课程' : '暂无课程'"
      />
    </div>
    <CoursePay v-model="payVisible" :course="selectedCourse" />
    <ImportDialog
      v-model="importVisible"
      type="course"
      @success="onImported"
    />
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { CourseList } from "@en/common/course";
import { getCourseList, getMyCourse, removeMyCourse, updateMyCourse } from "@/apis/course";
import { uploadUrl } from "@/apis";
import CoursePay from "./components/Pay.vue";
import ImportDialog from "@/views/WordBook/components/ImportDialog.vue";
import type { Course } from "@en/common/course";
import { useLogin } from "@/hooks/useLogin";
import { useUserStore } from "@/stores/user";
import { useSocket } from "@/hooks/useSocket";
import { useRouter, useRoute } from "vue-router";
import { Lock, Notebook, Upload } from "@element-plus/icons-vue";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const currentTab = ref("list");
const { login, requireLogin } = useLogin();
const list = ref<CourseList>([]);
const payVisible = ref<boolean>(false);
const importVisible = ref(false);
const selectedCourse = ref<Course | null>(null); //选中的课程
const { connect, disconnect, getSocket } = useSocket();

const getList = async () => {
  if (currentTab.value === "list") {
    const res = await getCourseList();
    list.value = res.data;
  } else {
    const res = await getMyCourse();
    list.value = res.data;
  }
};

let refreshTimer: ReturnType<typeof setTimeout> | null = null;
// 支付回调可能晚于弹窗关闭，稍后再补一次列表，避免已购课程残留在精选课程
const refreshListSoon = () => {
  if (currentTab.value !== "list") return;
  getList();
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => {
    if (currentTab.value === "list") getList();
  }, 1200);
};
const onPaymentSuccess = () => refreshListSoon();
const onWindowFocus = () => {
  if (currentTab.value === "list" && userStore.user?.id) refreshListSoon();
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

// 支付弹窗关闭后刷新列表：已购买课程应从精选课程移除
watch(payVisible, (open) => {
  if (!open) refreshListSoon();
});

const openImport = async () => {
  const ok = await login();
  if (!ok) return;
  currentTab.value = "my";
  await getList();
  importVisible.value = true;
};

const onImported = async () => {
  currentTab.value = "my";
  await getList();
};

const renameCourse = async (course: Course) => {
  try {
    const result = await ElMessageBox.prompt("输入新的课程名称", "重命名课程", {
      inputValue: course.name,
      inputValidator: (value) => Boolean(value?.trim()) || "名称不能为空",
      confirmButtonText: "保存",
      cancelButtonText: "取消",
    });
    const res = await updateMyCourse(course.id, { name: result.value.trim() });
    if (res.success) {
      ElMessage.success("已重命名");
      await getList();
    }
  } catch {
    // 取消不处理
  }
};

const deleteCourse = async (course: Course) => {
  try {
    await ElMessageBox.confirm(
      `确定删除“${course.name}”吗？课程中的单词和学习记录会一起删除。`,
      "删除课程",
      {
        type: "warning",
        confirmButtonText: "删除",
        cancelButtonText: "取消",
      },
    );
    const res = await removeMyCourse(course.id);
    if (res.success) {
      ElMessage.success("已删除");
      await getList();
    }
  } catch {
    // 取消不处理
  }
};

// 退出登录时：断开 socket，并把“我的课程”切回精选课程
watch(
  () => userStore.user?.id,
  (id) => {
    if (id) {
      connect();
      getSocket()?.on("paymentSuccess", onPaymentSuccess);
    } else {
      getSocket()?.off("paymentSuccess", onPaymentSuccess);
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
  window.addEventListener("focus", onWindowFocus);
  if (route.query.tab === "my" && userStore.user?.id) {
    currentTab.value = "my";
  }
  getList();
});

onBeforeUnmount(() => {
  window.removeEventListener("focus", onWindowFocus);
  if (refreshTimer) clearTimeout(refreshTimer);
  getSocket()?.off("paymentSuccess", onPaymentSuccess);
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
