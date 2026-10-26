<template>
  <div
    class="ml-4 flex h-[750px] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white"
  >
    <div class="flex-1 overflow-y-auto px-6 py-5">
      <div
        v-if="!list?.length"
        class="flex h-full flex-col items-center justify-center text-center"
      >
        <div
          class="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700"
        >
          <el-icon :size="22"><ChatDotRound /></el-icon>
        </div>
        <h2 class="mt-4 text-lg font-semibold text-zinc-950">
          开始一段对话
        </h2>
        <p class="mt-2 max-w-xs text-sm leading-6 text-zinc-500">
          选择左侧的对话模式，输入一句话，AI 会陪你用英语聊下去。
        </p>
      </div>

      <div v-for="(item, index) in list" :key="index">
        <div
          class="mb-5 flex items-center justify-end gap-3"
          v-if="item.role === 'human'"
        >
          <div
            class="max-w-[78%] rounded-2xl rounded-tr-md bg-zinc-900 px-4 py-3 text-sm leading-6 text-white shadow-sm"
          >
            {{ item.content }}
          </div>
          <el-avatar
            :size="32"
            class="shrink-0 !bg-zinc-200 !text-xs !font-semibold !text-zinc-600"
            >你</el-avatar
          >
        </div>
        <div class="mb-5 flex items-start gap-3" v-else>
          <el-avatar
            :size="32"
            class="shrink-0 !bg-teal-700 !text-xs !font-semibold !text-white"
            >AI</el-avatar
          >
          <div class="min-w-0 max-w-[82%]">
            <div
              v-if="item.role === 'ai' && item.reasoning"
              class="mb-2 border-l-2 border-teal-200 pl-3 text-xs leading-6 text-zinc-400"
            >
              {{ item.reasoning }}
            </div>
            <div
              v-if="item.role === 'ai' && item.content !== ''"
              class="deepseek-markdown !max-w-none !rounded-2xl !rounded-tl-md !border !border-zinc-200 !bg-[#f7f6f1] !p-3 text-sm text-zinc-700"
              v-html="parseMarkdown(item.content)"
            />
          </div>
        </div>
      </div>
      <div ref="chatRef"></div>
    </div>

    <div class="border-t border-zinc-200 bg-[#fbfaf7] p-4">
      <!-- 功能选项 -->
      <div class="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
          :class="
            deepThink
              ? 'border-teal-200 bg-teal-50 text-teal-700'
              : 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50'
          "
          @click="deepThink = !deepThink"
        >
          <el-icon :size="14"><MagicStick /></el-icon>
          <span>深度思考</span>
        </button>
        <button
          type="button"
          class="inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
          :class="
            webSearch
              ? 'border-teal-200 bg-teal-50 text-teal-700'
              : 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50'
          "
          @click="webSearch = !webSearch"
        >
          <el-icon :size="14"><Connection /></el-icon>
          <span>联网搜索</span>
        </button>
      </div>
      <!-- 输入框 -->
      <div class="flex items-end gap-2">
        <el-input
          @keyup.enter="sendMessage"
          type="textarea"
          :rows="2"
          resize="none"
          v-model="message"
          placeholder="输入你想说的话，Enter 发送"
        />
        <button
          type="button"
          :disabled="!message.trim()"
          class="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-zinc-900 text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          @click="sendMessage"
        >
          <el-icon :size="18"><Position /></el-icon>
        </button>
        <button
          v-if="!isRecording"
          type="button"
          class="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-950"
          @click="startRecording"
        >
          <el-icon :size="18"><Mic /></el-icon>
        </button>
        <button
          v-else
          type="button"
          class="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100"
          @click="stopRecording"
        >
          <el-icon :size="18"><VideoPause /></el-icon>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, watch, nextTick } from "vue";
import {
  Position,
  Mic,
  VideoPause,
  MagicStick,
  Connection,
  ChatDotRound,
} from "@element-plus/icons-vue";
import type { ChatMessageList } from "@en/common/chat";
import { marked } from "marked";
import "@/assets/css/deep-seek.css";
import { useVoiceToText } from "@/hooks/useVoiceToText";
const { isRecording, start, stop } = useVoiceToText({
  lang: "zh-CN",
  continuous: true,
});
const deepThink = ref(false); //深度思考
const webSearch = ref(false); //联网搜索
const emits = defineEmits(["onSendMessage"]);
const chatRef = useTemplateRef<HTMLDivElement>("chatRef"); //读取DOM元素
const props = defineProps<{
  list?: ChatMessageList; //消息列表 后续通过props传入
}>();
const message = ref<string>(""); //发送的内容
//发送消息
const sendMessage = () => {
  if (!message.value) return;
  emits("onSendMessage", message.value, deepThink.value, webSearch.value);
  message.value = "";
};
//markdown解析HTML
const parseMarkdown = (content: string) => {
  if (!content) return "";
  return marked.parse(content);
};
//开始录音
const startRecording = () => {
  start((result) => {
    message.value = result;
  });
};
//停止录音
const stopRecording = () => {
  stop();
  sendMessage();
};
//监听消息列表，滚动到最底部
watch(
  () => props.list,
  () => {
    nextTick(() => {
      chatRef.value?.scrollIntoView({ behavior: "smooth" });
    });
  },
  {
    immediate: true,
    deep: true,
  },
);
</script>
