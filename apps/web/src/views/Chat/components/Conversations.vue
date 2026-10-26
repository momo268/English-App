<template>
  <aside
    class="w-[240px] shrink-0 rounded-2xl border border-zinc-200/80 bg-white p-3"
  >
    <div
      class="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400"
    >
      对话模式
    </div>
    <p
      v-if="!chatMode.length"
      class="px-3 py-6 text-xs leading-6 text-zinc-400"
    >
      暂无可用对话模式
    </p>
    <button
      type="button"
      @click="changeActive(value)"
      :class="
        active === value.id
          ? 'bg-teal-50 font-medium text-zinc-950'
          : 'text-zinc-600 hover:bg-[#f7f6f1] hover:text-zinc-950'
      "
      class="flex w-full cursor-pointer items-center rounded-xl px-3 py-2.5 text-left text-sm transition-colors"
      v-for="value in chatMode"
      :key="value.id"
    >
      {{ value.label }}
    </button>
  </aside>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { ChatModeList, ChatMode } from "@en/common/chat";
import { getChatMode } from "@/apis/chat";
const emits = defineEmits(["onGetRole"]);
const chatMode = ref<ChatModeList>([]); //消息模式列表
const active = ref<string | null>(null); //当前激活的id
//切换消息模式
const changeActive = (value: ChatMode) => {
  active.value = value.id;
  emits("onGetRole", value.role); //派发role
};
//获取消息模式列表
const getChatModeList = async () => {
  const res = await getChatMode();
  chatMode.value = res.data;
  const first = res.data[0];
  if (first) {
    active.value = first.id; //默认选中第一个
    emits("onGetRole", first.role); //派发role
  }
};
onMounted(() => {
  getChatModeList();
});
</script>
