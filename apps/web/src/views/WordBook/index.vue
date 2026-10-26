<template>
  <div class="mx-auto w-[1200px] max-w-full px-4 pb-20 pt-10">
    <header class="border-b border-zinc-200 pb-8">
      <p
        class="text-[11px] font-semibold uppercase tracking-[0.3em] text-teal-700"
      >
        Word Library
      </p>
      <div class="mt-3 flex flex-wrap items-end justify-between gap-5">
        <div>
          <div class="flex items-center gap-2">
            <el-icon class="text-teal-700" :size="20">
              <Reading />
            </el-icon>
            <h1 class="text-3xl font-semibold tracking-tight text-zinc-950">
              词库列表
            </h1>
          </div>
          <p class="mt-3 max-w-3xl text-sm leading-6 text-zinc-500">
            词典来源：牛津、柯林斯、BNC、FRQ、高考、中考、GRE、TOEFL、IELTS、大学英语六级、大学英语四级、考研
          </p>
        </div>
        <span class="text-xs text-zinc-400">共 {{ total }} 个词条</span>
      </div>
    </header>

    <section class="mt-6 rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5">
      <div class="flex flex-wrap items-center gap-3">
        <el-input
          @keyup.enter="searchWord"
          class="w-full sm:w-80"
          v-model="query.word"
          placeholder="请输入单词"
          :prefix-icon="Search"
        />
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
          <el-checkbox v-model="query.gk">高考</el-checkbox>
          <el-checkbox v-model="query.zk">中考</el-checkbox>
          <el-checkbox v-model="query.gre">GRE</el-checkbox>
          <el-checkbox v-model="query.toefl">TOEFL</el-checkbox>
          <el-checkbox v-model="query.ielts">IELTS</el-checkbox>
          <el-checkbox v-model="query.cet6">六级</el-checkbox>
          <el-checkbox v-model="query.cet4">四级</el-checkbox>
          <el-checkbox v-model="query.ky">考研</el-checkbox>
        </div>
        <el-button class="btn-ink h-10 px-5" @click="searchWord"
          >搜索</el-button
        >
      </div>
    </section>

    <div
      v-loading="loading"
      class="mt-6 grid min-h-40 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      <article
        class="group flex min-h-[210px] flex-col rounded-2xl border border-zinc-200/80 bg-white p-5 transition-all duration-200 hover:border-teal-200 hover:shadow-[0_20px_50px_-38px_rgba(15,118,110,0.35)]"
        v-for="item in list"
        :key="item.id"
      >
        <div class="flex items-start justify-between gap-3">
          <h2 class="text-lg font-semibold tracking-tight text-zinc-950">
            {{ item.word }}
          </h2>
          <button
            type="button"
            aria-label="播放发音"
            class="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg text-teal-700 transition-colors hover:bg-teal-50"
            @click="playAudio(item.word)"
          >
            <el-icon :size="17"><VideoPlay /></el-icon>
          </button>
        </div>
        <p class="mt-1 text-xs tracking-wide text-zinc-400">
          {{ item.phonetic }}
        </p>
        <p
          class="mt-3 line-clamp-2 whitespace-pre-line text-sm leading-6 text-zinc-600"
        >
          {{ formatText(item.definition) }}
        </p>
        <p
          class="mt-1 line-clamp-2 whitespace-pre-line text-sm leading-6 text-zinc-500"
        >
          {{ formatText(item.translation) }}
        </p>
        <div class="mt-auto flex flex-wrap gap-1.5 pt-4">
          <span
            v-for="tag in wordTags(item)"
            :key="tag"
            class="rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-700"
          >
            {{ tag }}
          </span>
        </div>
      </article>
    </div>

    <el-empty
      v-if="!loading && !error && list.length === 0"
      description="没有找到相关单词"
    />
    <p
      v-if="error"
      role="status"
      class="mt-6 text-center text-sm text-zinc-500"
    >
      {{ error }}
    </p>
    <el-pagination
      class="mt-10 flex justify-center"
      background
      v-model:current-page="query.page"
      v-model:page-size="query.pageSize"
      :total="total"
      @current-change="getList"
      @size-change="getList"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { getWordBookList } from "@/apis/word-book";
import type { Word, WordQuery, WordList } from "@en/common/word";
import { Reading, Search, VideoPlay } from "@element-plus/icons-vue";
import { useAudio } from "@/hooks/useAudio";

const { playAudio } = useAudio({});
const total = ref<WordList["total"]>(0);
const list = ref<WordList["list"]>([]);
const loading = ref(false);
const error = ref('');
let requestId = 0;
const query = ref<WordQuery>({
  page: 1,
  pageSize: 12,
  word: "",
  gk: false,
  zk: false,
  gre: false,
  toefl: false,
  ielts: false,
  cet6: false,
  cet4: false,
  ky: false,
});
const formatText = (text?: string) =>
  text
    ? text
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/\\r/g, "")
        .replace(/\\n/g, "\n")
        .replace(/\r\n?/g, "\n")
    : "";
const wordTags = (item: Word) =>
  [
    item.gk && "高考",
    item.zk && "中考",
    item.gre && "GRE",
    item.toefl && "TOEFL",
    item.ielts && "IELTS",
    item.cet6 && "六级",
    item.cet4 && "四级",
    item.ky && "考研",
  ].filter((tag): tag is string => Boolean(tag));

const searchWord = () => {
  query.value.page = 1; //重置一下页数
  getList(); //重新获取列表
};

const getList = async () => {
  const id = ++requestId;
  loading.value = true;
  error.value = '';
  try {
    const res = await getWordBookList({ ...query.value });
    if (id !== requestId) return;
    if (res.success) {
      total.value = res.data.total;
      list.value = res.data.list;
    } else {
      error.value = res.message || '加载失败，请重新搜索';
    }
  } catch {
    if (id === requestId) error.value = '加载失败，请重新搜索';
  } finally {
    if (id === requestId) loading.value = false;
  }
};

onMounted(() => {
  getList();
});
onUnmounted(() => { requestId += 1; });
</script>
