<template>
  <el-dialog
    :model-value="modelValue"
    :title="type === 'course' ? '导入自定义课程' : '导入我的词库'"
    width="min(680px, 94vw)"
    class="import-dialog"
    destroy-on-close
    @update:model-value="close"
  >
    <div class="space-y-5">
      <div class="rounded-2xl border border-zinc-200/80 bg-[#fbfaf7] p-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-zinc-900">
              {{ type === 'course' ? '课程模板' : '词库模板' }}
            </p>
            <p class="mt-1 text-xs leading-5 text-zinc-500">
              下载模板后按表头填写，单词为必填项，其余列可留空。支持 .xlsx / .csv，最多 5000 行。
            </p>
          </div>
          <el-button plain class="!border-zinc-300" @click="downloadTemplate">
            <el-icon class="mr-1"><Download /></el-icon>
            下载模板
          </el-button>
        </div>
      </div>

      <template v-if="step === 'select'">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1.5 block text-xs font-medium text-zinc-600">名称</span>
            <el-input v-model="name" maxlength="40" placeholder="例如：我的考研核心词" />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-xs font-medium text-zinc-600">描述（可选）</span>
            <el-input v-model="description" maxlength="120" placeholder="一句话说明" />
          </label>
        </div>

        <div
          class="cursor-pointer rounded-2xl border border-dashed bg-white px-5 py-8 text-center transition-colors"
          :class="
            dragActive
              ? 'border-teal-500 bg-teal-50/70 ring-4 ring-teal-50'
              : 'border-zinc-300 hover:border-teal-300 hover:bg-teal-50/40'
          "
          @click="fileInput?.click()"
          @dragenter.prevent="onDragEnter"
          @dragover.prevent="dragActive = true"
          @dragleave.prevent="onDragLeave"
          @drop.prevent="onDrop"
        >
          <el-icon :size="28" class="text-teal-700"><UploadFilled /></el-icon>
          <p class="mt-3 text-sm font-medium text-zinc-800">
            {{ dragActive ? '松开鼠标，导入这个文件' : file ? file.name : '点击选择文件，或拖拽文件到这里' }}
          </p>
          <p class="mt-1 text-xs text-zinc-400">
            {{ file ? formatSize(file.size) : 'XLSX / XLS / CSV，最大 5MB' }}
          </p>
          <input
            ref="fileInput"
            type="file"
            class="hidden"
            accept=".xlsx,.xls,.csv"
            @change="pickFile"
          />
        </div>

        <div class="flex justify-end gap-2">
          <el-button @click="close(false)">取消</el-button>
          <el-button class="btn-ink" :loading="previewing" :disabled="!file" @click="preview">
            下一步
          </el-button>
        </div>
      </template>

      <template v-else-if="step === 'preview' && previewData">
        <div class="grid grid-cols-3 gap-3">
          <div class="rounded-xl bg-[#fbfaf7] px-4 py-3">
            <p class="text-xs text-zinc-500">总行数</p>
            <p class="mt-1 text-xl font-semibold text-zinc-950">{{ previewData.total }}</p>
          </div>
          <div class="rounded-xl bg-[#fbfaf7] px-4 py-3">
            <p class="text-xs text-zinc-500">可导入</p>
            <p class="mt-1 text-xl font-semibold text-teal-700">{{ previewData.valid }}</p>
          </div>
          <div class="rounded-xl bg-[#fbfaf7] px-4 py-3">
            <p class="text-xs text-zinc-500">重复/跳过</p>
            <p class="mt-1 text-xl font-semibold text-amber-600">{{ previewData.duplicates }}</p>
          </div>
        </div>

        <div v-if="previewData.errors.length" class="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
          <p class="text-xs font-medium text-amber-800">以下行会被跳过</p>
          <ul class="mt-2 max-h-24 space-y-1 overflow-y-auto text-xs text-amber-700">
            <li v-for="item in previewData.errors" :key="item.row">第 {{ item.row }} 行：{{ item.message }}</li>
          </ul>
        </div>

        <div class="overflow-x-auto rounded-xl border border-zinc-200">
          <table class="min-w-full text-left text-xs">
            <thead class="bg-[#fbfaf7] text-zinc-500">
              <tr>
                <th class="px-3 py-2 font-medium">单词</th>
                <th class="px-3 py-2 font-medium">音标</th>
                <th class="px-3 py-2 font-medium">中文释义</th>
                <th v-if="type === 'course'" class="px-3 py-2 font-medium">单元</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-100 text-zinc-700">
              <tr v-for="row in previewData.rows" :key="row.row">
                <td class="px-3 py-2 font-medium text-zinc-900">{{ row.word }}</td>
                <td class="px-3 py-2">{{ row.phonetic }}</td>
                <td class="max-w-[240px] truncate px-3 py-2">{{ row.translation }}</td>
                <td v-if="type === 'course'" class="px-3 py-2">{{ row.unit }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex justify-end gap-2">
          <el-button @click="step = 'select'">上一步</el-button>
          <el-button
            class="btn-ink"
            :loading="starting"
            :disabled="previewData.valid === 0"
            @click="start"
          >
            开始导入 {{ previewData.valid }} 条
          </el-button>
        </div>
      </template>

      <template v-else-if="step === 'importing'">
        <div class="rounded-2xl border border-zinc-200/80 bg-white p-6">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-zinc-900">正在导入</p>
            <span class="text-xs text-zinc-500">{{ job?.success ?? 0 }} / {{ job?.total ?? previewData?.valid ?? 0 }}</span>
          </div>
          <el-progress
            class="mt-4"
            :percentage="progress"
            :stroke-width="8"
            color="#0f766e"
            :show-text="false"
          />
          <p class="mt-3 text-xs text-zinc-500">
            {{ job?.failed ? `${job.failed} 条跳过后会列在错误明细里` : '正在写入词条，请稍候…' }}
          </p>
        </div>
      </template>

      <template v-else-if="step === 'done'">
        <div
          v-if="job?.status === 'failed'"
          class="rounded-2xl border border-red-200 bg-red-50/60 p-6 text-center"
        >
          <div class="mx-auto grid h-11 w-11 place-items-center rounded-full bg-red-600 text-white">
            <el-icon :size="20"><Close /></el-icon>
          </div>
          <p class="mt-3 text-base font-semibold text-zinc-950">导入失败</p>
          <p class="mt-1 text-sm text-zinc-600">{{ job.message || '请稍后重试' }}</p>
          <a
            v-if="job.failed"
            :href="importErrorsUrl(job.id)"
            class="mt-3 inline-flex items-center gap-1 text-xs font-medium text-red-700 hover:text-red-800"
          >
            下载错误明细
          </a>
        </div>
        <div v-else class="rounded-2xl border border-teal-200 bg-teal-50/50 p-6 text-center">
          <div class="mx-auto grid h-11 w-11 place-items-center rounded-full bg-teal-700 text-white">
            <el-icon :size="20"><Check /></el-icon>
          </div>
          <p class="mt-3 text-base font-semibold text-zinc-950">导入完成</p>
          <p class="mt-1 text-sm text-zinc-600">
            成功 {{ job?.success ?? 0 }} 条，跳过 {{ job?.failed ?? 0 }} 条
          </p>
          <a
            v-if="job?.failed"
            :href="importErrorsUrl(job.id)"
            class="mt-3 inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800"
          >
            下载错误明细
          </a>
        </div>
        <div class="flex justify-end">
          <el-button class="btn-ink" @click="job?.status === 'failed' ? close(false) : finish()">
            {{ job?.status === 'failed' ? '关闭' : '完成' }}
          </el-button>
        </div>
      </template>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Check, Close, Download, UploadFilled } from '@element-plus/icons-vue'
import type { ImportJob, ImportPreview, ImportTarget } from '@en/common/import'
import {
  getImportJob,
  importErrorsUrl,
  importTemplateUrl,
  previewImport,
  startCourseImport,
  startWordBookImport,
} from '@/apis/import'

const props = defineProps<{
  modelValue: boolean
  type: ImportTarget
  defaultName?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: [payload: { targetId: string | null }]
}>()

const step = ref<'select' | 'preview' | 'importing' | 'done'>('select')
const fileInput = ref<HTMLInputElement | null>(null)
const file = ref<File | null>(null)
const dragActive = ref(false)
let dragDepth = 0
const name = ref('')
const description = ref('')
const previewing = ref(false)
const starting = ref(false)
const previewData = ref<ImportPreview | null>(null)
const job = ref<ImportJob | null>(null)
let timer: ReturnType<typeof setInterval> | null = null

const progress = computed(() => {
  const total = job.value?.total || previewData.value?.valid || 0
  if (!total) return 0
  return Math.min(100, Math.round(((job.value?.success ?? 0) / total) * 100))
})

watch(
  () => props.modelValue,
  (open) => {
    if (open) reset()
  },
)

const reset = () => {
  step.value = 'select'
  file.value = null
  dragActive.value = false
  dragDepth = 0
  fileInput.value && (fileInput.value.value = '')
  name.value = props.defaultName || ''
  description.value = ''
  previewData.value = null
  job.value = null
  starting.value = false
  previewing.value = false
  stopPolling()
}

const close = (value = false) => {
  stopPolling()
  emit('update:modelValue', value)
}

const acceptFile = (selected: File) => {
  const extension = selected.name.split('.').pop()?.toLowerCase()
  if (!extension || !['xlsx', 'xls', 'csv'].includes(extension)) {
    ElMessage.warning('只支持 .xlsx、.xls、.csv 文件')
    return
  }
  if (selected.size > 5 * 1024 * 1024) {
    ElMessage.warning('文件不能超过 5MB')
    return
  }
  file.value = selected
  if (!name.value) name.value = selected.name.replace(/\.[^.]+$/, '')
}

const pickFile = (event: Event) => {
  const input = event.target as HTMLInputElement
  const selected = input.files?.[0]
  if (!selected) return
  if (selected.size > 5 * 1024 * 1024 || !selected.name.match(/\.(xlsx|xls|csv)$/i)) {
    ElMessage.warning(selected.size > 5 * 1024 * 1024 ? '文件不能超过 5MB' : '只支持 .xlsx、.xls、.csv 文件')
    input.value = ''
    return
  }
  acceptFile(selected)
}

const onDragEnter = () => {
  dragDepth += 1
  dragActive.value = true
}

const onDragLeave = () => {
  dragDepth = Math.max(0, dragDepth - 1)
  if (dragDepth === 0) dragActive.value = false
}

const onDrop = (event: DragEvent) => {
  dragDepth = 0
  dragActive.value = false
  const selected = event.dataTransfer?.files?.[0]
  if (selected) acceptFile(selected)
}

const downloadTemplate = () => {
  window.open(importTemplateUrl(props.type), '_blank')
}

const preview = async () => {
  if (!file.value) return
  previewing.value = true
  try {
    const res = await previewImport(file.value, props.type)
    if (!res.success) {
      ElMessage.error(res.message || '解析失败')
      return
    }
    previewData.value = res.data
    step.value = 'preview'
  } catch {
    ElMessage.error('文件解析失败，请检查模板')
  } finally {
    previewing.value = false
  }
}

const start = async () => {
  if (!file.value || !previewData.value) return
  if (!name.value.trim()) {
    ElMessage.warning('请填写名称')
    return
  }
  starting.value = true
  try {
    const res =
      props.type === 'course'
        ? await startCourseImport(file.value, name.value.trim(), description.value.trim())
        : await startWordBookImport(file.value, name.value.trim(), description.value.trim())
    if (!res.success) {
      ElMessage.error(res.message || '导入失败')
      return
    }
    step.value = 'importing'
    job.value = {
      id: res.data.jobId,
      type: props.type,
      status: 'pending',
      fileName: file.value.name,
      targetId: null,
      total: previewData.value.valid,
      success: 0,
      failed: previewData.value.total - previewData.value.valid,
      message: null,
      errors: null,
      createdAt: '',
      updatedAt: '',
    }
    poll(res.data.jobId)
  } catch {
    ElMessage.error('导入失败，请稍后再试')
  } finally {
    starting.value = false
  }
}

const poll = (id: string) => {
  stopPolling()
  timer = setInterval(async () => {
    try {
      const res = await getImportJob(id)
      if (!res.success) return
      job.value = res.data
      if (res.data.status === 'done') {
        stopPolling()
        step.value = 'done'
      } else if (res.data.status === 'failed') {
        stopPolling()
        ElMessage.error(res.data.message || '导入失败')
        step.value = 'done'
      }
    } catch {
      // 网络短暂波动时继续轮询
    }
  }, 800)
}

const stopPolling = () => {
  if (timer) clearInterval(timer)
  timer = null
}

const finish = () => {
  emit('success', { targetId: job.value?.targetId ?? null })
  close(false)
}

const formatSize = (size: number) => {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

onBeforeUnmount(stopPolling)
</script>

<style scoped>
.import-dialog :deep(.el-dialog) {
  border-radius: 20px;
}
</style>
