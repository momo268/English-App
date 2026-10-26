<template>
  <div ref="homeRef" class="mx-auto w-[1200px] max-w-full px-4 pb-24 pt-10">
    <!-- 背景区域 -->
    <div class="relative flex justify-between overflow-hidden rounded-[24px] p-9">
      <div class="absolute inset-0 bg-[#101312]" />
      <div
        class="absolute inset-0"
        style="background: radial-gradient(circle at 78% 18%, rgba(20, 184, 166, 0.22), transparent 55%)"
      />
      <div class="relative z-10 p-8">
        <span
          class="inline-flex items-center rounded-full border border-teal-400/25 bg-teal-400/10 px-4 py-2 text-sm text-teal-100"
          >坚持 5 天打卡学习</span
        >
        <h1
          class="mt-8 max-w-xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl"
        >
          通过跟 AI 对话，<br class="hidden sm:block" />提高你的英语水平
        </h1>
        <p class="mt-5 text-base leading-7 text-zinc-400">
          超 1,000,000 学员的选择，提升您的英语能力
        </p>
        <div class="mt-10 flex flex-wrap items-center gap-3">
          <button
            @click="showLogin"
            class="h-11 cursor-pointer rounded-xl bg-[#f7f6f1] px-6 text-sm font-semibold text-zinc-950 transition-colors hover:bg-white"
          >
            立即学习
          </button>
          <button
            @click="router.push('/courses/index')"
            class="h-11 cursor-pointer rounded-xl border border-white/20 px-6 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            查看课程
          </button>
        </div>
      </div>
      <div class="relative z-10 hidden p-8 lg:block">
        <Hologram />
      </div>
    </div>

    <!-- 描述区域 -->
    <div class="mx-auto max-w-3xl px-4 py-16 text-center">
      <p
        class="text-[11px] font-semibold uppercase tracking-[0.3em] text-teal-700"
      >
        Why Us
      </p>
      <h2
        class="text-why mt-3 text-3xl font-semibold tracking-tight text-zinc-950"
      >
        为什么选择我们?
      </h2>
      <p class="text-why-content mt-4 text-base leading-7 text-zinc-500">
        我们经过科学的验证，AI 学习英语的效果比传统学习方式更好，更高效。
      </p>
    </div>

    <!-- 数据统计区域 -->
    <div
      class="grid grid-cols-2 divide-y divide-zinc-200 border-y border-zinc-200 py-10 sm:grid-cols-4 sm:divide-x sm:divide-y-0 sm:py-12"
    >
      <div
        v-for="item in stats"
        :key="item.label"
        class="px-4 py-5 text-center"
      >
        <div class="flex items-baseline justify-center gap-1">
          <span
            class="stat-number text-4xl font-semibold tracking-tight text-zinc-950"
            >{{ item.value }}</span
          >
          <span class="text-xl font-medium text-teal-700">{{
            item.suffix
          }}</span>
        </div>
        <div class="mt-2 text-sm text-zinc-500">{{ item.label }}</div>
      </div>
    </div>

    <div class="relative mb-6 py-20 text-center">
      <!-- 装饰性光晕背景 -->
      <div
        class="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-200/20 blur-3xl"
      />
      <div class="relative z-10">
        <span
          class="text-core mb-4 inline-block rounded-full bg-teal-50 px-4 py-1.5 text-sm font-medium text-teal-700"
          >✨ 核心优势</span
        >
        <h2
          class="core-title text-3xl font-semibold tracking-tight text-zinc-950"
        >
          重新定义英语学习方式
        </h2>
        <p
          class="core-content mx-auto mt-4 max-w-2xl text-base leading-7 text-zinc-500"
        >
          融合前沿 AI
          技术与语言学研究，打造沉浸式学习体验，让每一分钟的学习都更有价值
        </p>
      </div>
    </div>

    <div
      class="cards-container grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
      style="perspective: 1000px"
    >
      <div
        v-for="(item, index) in abouts"
        :key="item.title"
        class="about-card group relative cursor-pointer overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-7 transition-all duration-500 hover:-translate-y-1 hover:border-teal-200 hover:shadow-[0_24px_60px_-36px_rgba(15,118,110,0.35)]"
        :style="{ animationDelay: `${index * 100}ms` }"
      >
        <!-- 装饰性背景图案 -->
        <div
          class="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-teal-50 blur-2xl transition-all duration-700 group-hover:scale-150 group-hover:bg-teal-100/80"
        />
        <div
          class="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-[#f7f6f1]"
        />

        <!-- 图标区域 -->
        <div
          class="relative z-10 mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-teal-50 text-2xl transition-all duration-300 group-hover:scale-110 group-hover:bg-teal-100"
        >
          {{ item.icon }}
        </div>

        <!-- 内容区域 -->
        <div class="relative z-10">
          <h3 class="text-xl font-semibold text-zinc-950">
            {{ item.title }}
          </h3>
          <p class="mt-3 text-sm leading-6 text-zinc-500">
            {{ item.content }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Hologram from "./components/Hologram.vue";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { onMounted, onUnmounted, reactive, ref } from "vue";
import { useLogin } from "@/hooks/useLogin";
import { useRouter } from "vue-router";
const { requireLogin } = useLogin();
const router = useRouter();
const homeRef = ref<HTMLElement | null>(null);
let animations: gsap.Context | undefined;
gsap.registerPlugin(ScrollTrigger);
const stats = reactive([
  { value: 0, suffix: "+", label: "累计学员", target: 1000000 },
  { value: 0, suffix: "+", label: "精品课程", target: 500 },
  { value: 0, suffix: "%", label: "学员满意度", target: 98 },
  { value: 0, suffix: "+", label: "学习时长(小时)", target: 5000000 },
]);
const abouts = [
  {
    icon: "🖼️",
    title: "AI情境学习",
    content:
      "沉浸式场景模拟，让你在真实语境中自然习得英语，告别枯燥的死记硬背。",
  },
  {
    icon: "🧠",
    title: "智能对话练习",
    content: "AI 实时纠错反馈，个性化对话训练，24小时随时练习口语表达。",
  },
  {
    icon: "🎤",
    title: "科学词汇记忆",
    content: "基于艾宾浩斯遗忘曲线，智能安排复习计划，让单词真正记住。",
  },
];

const initProject = () => {
  //数字滚动动画
  stats.forEach((item) => {
    gsap.to(item, {
      value: item.target, //目标值
      duration: 2, //持续时间
      snap: { value: 1 }, // 数字始终显示整数，避免动画过程中出现长小数。
      ease: "power2.inOut", //过度动画
    });
  });
  //卡片过度
  const cards = gsap.utils.toArray(".about-card") as HTMLElement[];
  cards.forEach((card, index) => {
    gsap.fromTo(
      card,
      {
        opacity: 0,
        y: 40,
        scale: 0.98,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
        delay: index * 0.08,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".cards-container",
          start: "top 75%",
        },
      },
    );
  });
  //文字过度
  gsap.fromTo(
    ".text-why",
    {
      opacity: 0,
      y: 60,
    },
    {
      opacity: 1,
      y: 0,
    },
  );
  gsap.fromTo(
    ".text-why-content",
    {
      opacity: 0,
      y: 60,
    },
    {
      opacity: 1,
      y: 0,
    },
  );
  //核心优势文字过度
  gsap.fromTo(
    ".text-core",
    {
      opacity: 0,
      y: 60,
    },
    {
      opacity: 1,
      y: 0,
      scrollTrigger: {
        trigger: ".text-core",
        start: "top 70%",
      },
    },
  );
  gsap.fromTo(
    ".core-title",
    {
      opacity: 0,
      y: 60,
    },
    {
      opacity: 1,
      y: 0,
      scrollTrigger: {
        trigger: ".core-title",
        start: "top 70%",
      },
    },
  );
  gsap.fromTo(
    ".core-content",
    {
      opacity: 0,
      y: 60,
    },
    {
      opacity: 1,
      y: 0,
      scrollTrigger: {
        trigger: ".core-content",
        start: "top 70%",
      },
    },
  );
};

const showLogin = () => {
  // 登录成功后进入 AI 对话页；取消则留在首页
  requireLogin(() => {
    router.push("/chat/index");
  });
};
onMounted(() => {
  // 将本页动画集中管理，离开首页时一起清理。
  animations = gsap.context(initProject, homeRef.value!);
});
onUnmounted(() => animations?.revert());
</script>
