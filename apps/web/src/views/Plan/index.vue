<template>
  <div class="min-h-[calc(100vh-5rem)] bg-[#f7f6f1]">
    <div class="mx-auto w-[1240px] max-w-full px-4 pb-10 pt-6">
      <header class="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.3em] text-teal-700">
            Dashboard
          </p>
          <h1 class="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
            学习工作台
          </h1>
          <p class="mt-1.5 text-sm text-zinc-500">
            {{ greeting }}，{{ userName }}。今天也学一点。
          </p>
        </div>
        <button
          v-if="summary && !editing"
          type="button"
          class="h-9 rounded-xl border border-zinc-300 px-4 text-xs font-medium text-zinc-700 transition-all duration-200 hover:border-teal-300 hover:bg-teal-50/50 hover:text-teal-700"
          @click="startEdit"
        >
          调整目标
        </button>
      </header>

      <div
        v-if="!userStore.getUser"
        class="mt-8 flex flex-col items-center rounded-2xl border border-zinc-200/80 bg-white px-6 py-16 text-center"
      >
        <div class="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">
          <el-icon :size="24"><Calendar /></el-icon>
        </div>
        <h2 class="mt-4 text-lg font-semibold text-zinc-950">登录后查看学习工作台</h2>
        <p class="mt-2 text-sm text-zinc-500">目标、打卡和错词都会跟随你的账号保存。</p>
        <button
          type="button"
          class="btn-ink mt-5 h-10 rounded-xl px-6 text-sm"
          @click="loginAndLoad"
        >
          登录
        </button>
      </div>

      <div v-else v-loading="loading" class="mt-4 space-y-3">
        <div class="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
          <section class="order-2 rounded-2xl border border-zinc-200/80 bg-white p-4 xl:order-1">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="flex items-center gap-2 text-xs text-zinc-500">
                <span class="h-1.5 w-1.5 rounded-full bg-teal-700" />
                {{ todayLabel }}
              </div>
              <span
                class="rounded-full px-2.5 py-1 text-[11px] font-medium"
                :class="summary?.completed
                  ? 'bg-teal-50 text-teal-700'
                  : 'bg-zinc-100 text-zinc-500'"
              >
                {{ summary?.completed ? '今日目标已完成' : '进行中' }}
              </span>
            </div>

            <div class="mt-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 class="text-xl font-semibold tracking-tight text-zinc-950">今天，学一点。</h2>
                <p class="mt-1 text-xs text-zinc-500">完成下面三项，今天就算圆满收工。</p>
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="btn-ink inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                  @click="goCourses"
                >
                  <el-icon :size="14"><Reading /></el-icon>
                  开始学习
                </button>
                <button
                  type="button"
                  class="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-300 px-3.5 text-xs font-medium text-zinc-700 transition-all duration-200 hover:border-teal-300 hover:bg-teal-50/50 hover:text-teal-700"
                  @click="goCourses"
                >
                  去复习
                  <span v-if="summary?.dueReviewCount" class="text-teal-700">{{ summary.dueReviewCount }}</span>
                </button>
              </div>
            </div>

            <div class="mt-4 grid gap-3 sm:grid-cols-3">
              <div
                v-for="item in progressItems"
                :key="item.key"
                class="rounded-xl bg-[#fbfaf7] p-3"
              >
                <div class="flex items-baseline justify-between gap-2">
                  <span class="text-xs text-zinc-500">{{ item.label }}</span>
                  <span class="text-xs tabular-nums text-zinc-400">
                    <strong class="font-semibold text-zinc-900">{{ item.value }}</strong>
                    / {{ item.goal }}{{ item.unit }}
                  </span>
                </div>
                <div class="mt-2 h-1 overflow-hidden rounded-full bg-zinc-200/70">
                  <div
                    class="h-full rounded-full bg-teal-700 transition-all duration-500"
                    :style="{ width: `${item.percent}%` }"
                  />
                </div>
              </div>
            </div>

            <div
              v-if="editing"
              class="mt-4 rounded-xl border border-teal-100 bg-teal-50/50 p-3"
            >
              <div class="grid gap-3 sm:grid-cols-3">
                <label class="block">
                  <span class="text-[11px] text-zinc-500">新词</span>
                  <el-input-number
                    v-model="draft.dailyNew"
                    class="mt-1 w-full"
                    :min="0"
                    :max="100"
                    :step="5"
                    size="small"
                    controls-position="right"
                  />
                </label>
                <label class="block">
                  <span class="text-[11px] text-zinc-500">复习</span>
                  <el-input-number
                    v-model="draft.dailyReview"
                    class="mt-1 w-full"
                    :min="0"
                    :max="200"
                    :step="10"
                    size="small"
                    controls-position="right"
                  />
                </label>
                <label class="block">
                  <span class="text-[11px] text-zinc-500">时长（分钟）</span>
                  <el-input-number
                    v-model="draft.dailyMinutes"
                    class="mt-1 w-full"
                    :min="0"
                    :max="300"
                    :step="5"
                    size="small"
                    controls-position="right"
                  />
                </label>
              </div>
              <div class="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  class="h-8 rounded-lg border border-zinc-300 px-3 text-xs text-zinc-600"
                  @click="editing = false"
                >
                  取消
                </button>
                <button
                  type="button"
                  class="h-8 rounded-lg bg-zinc-900 px-4 text-xs font-semibold text-white disabled:opacity-50"
                  :disabled="saving"
                  @click="saveGoals"
                >
                  {{ saving ? '保存中…' : '保存' }}
                </button>
              </div>
            </div>

          </section>

          <div class="order-1 grid gap-4 sm:grid-cols-2 xl:order-2">
            <aside class="relative flex h-full flex-col overflow-hidden rounded-2xl bg-[#101312] p-4 text-white">
              <div class="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-teal-400/20 blur-3xl" />
              <div class="relative flex flex-1 flex-col">
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-teal-300">
                    <el-icon :size="13"><Sunny /></el-icon>
                    Streak
                  </div>
                  <span class="text-[11px] text-zinc-500">连续打卡</span>
                </div>
                <div class="mt-2 flex items-end gap-2">
                  <span class="text-4xl font-semibold leading-none tracking-[-0.05em]">
                    {{ summary?.streak ?? 0 }}
                  </span>
                  <span class="pb-1 text-xs text-zinc-400">天</span>
                </div>
                <div class="mt-3 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                  <div>
                    <p class="text-xs text-zinc-300">今日打卡</p>
                    <p class="mt-0.5 text-[11px] text-zinc-500">
                      {{ summary?.checkIn
                        ? `${summary.checkIn.words} 词 · ${summary.checkIn.minutes} 分钟`
                        : '学完一组自动打卡' }}
                    </p>
                  </div>
                  <span
                    class="shrink-0 rounded-full px-2 py-1 text-[10px] font-medium"
                    :class="summary?.checkIn
                      ? 'bg-teal-400/15 text-teal-300'
                      : 'bg-white/5 text-zinc-400'"
                  >
                    {{ summary?.checkIn ? '已打卡' : '待完成' }}
                  </span>
                </div>
                <button
                  v-if="!summary?.checkIn"
                  type="button"
                  class="mt-auto h-7 w-full rounded-lg border border-teal-400/30 bg-teal-400/10 text-[11px] text-teal-200 transition-colors hover:bg-teal-400/15 disabled:cursor-not-allowed disabled:opacity-40"
                  :disabled="!canCheckIn || checkingIn"
                  @click="handleCheckIn"
                >
                  {{ checkingIn ? '打卡中…' : canCheckIn ? '手动打卡' : '先学习再打卡' }}
                </button>
                <div
                  v-else
                  class="mt-auto flex items-center gap-2 border-t border-white/10 pt-3 text-[11px] text-zinc-400"
                >
                  <el-icon class="text-teal-400" :size="13"><Check /></el-icon>
                  今天已完成，明天继续保持
                </div>
              </div>
            </aside>

            <section class="rounded-2xl border border-zinc-200/80 bg-white p-4">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                  快捷入口
                </span>
                <span class="text-[11px] text-zinc-400">今天</span>
              </div>
              <div class="mt-2 divide-y divide-zinc-100">
                <button
                  type="button"
                  class="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-teal-50/60 hover:text-teal-700"
                  @click="goCourses"
                >
                  <el-icon class="text-teal-700" :size="16"><Refresh /></el-icon>
                  <span class="flex-1 text-sm text-zinc-700">今日待复习</span>
                  <span class="text-sm font-semibold tabular-nums text-zinc-900">{{ summary?.dueReviewCount ?? 0 }}</span>
                  <el-icon class="text-zinc-300" :size="13"><ArrowRight /></el-icon>
                </button>
                <button
                  type="button"
                  class="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-teal-50/60 hover:text-teal-700"
                  @click="router.push('/wrong-book/index')"
                >
                  <el-icon class="text-teal-700" :size="16"><Collection /></el-icon>
                  <span class="flex-1 text-sm text-zinc-700">错词本</span>
                  <span class="text-sm font-semibold tabular-nums text-zinc-900">{{ summary?.wrongBookCount ?? 0 }}</span>
                  <el-icon class="text-zinc-300" :size="13"><ArrowRight /></el-icon>
                </button>
                <button
                  type="button"
                  class="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-teal-50/60 hover:text-teal-700"
                  @click="router.push('/report/index')"
                >
                  <el-icon class="text-teal-700" :size="16"><Document /></el-icon>
                  <span class="flex-1 text-sm text-zinc-700">学习周报</span>
                  <span class="text-[10px] text-zinc-400">每周回顾</span>
                  <el-icon class="text-zinc-300" :size="13"><ArrowRight /></el-icon>
                </button>
                <button
                  v-if="recentWords.length || recentCourses[0]"
                  type="button"
                  class="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-teal-50/60 hover:text-teal-700"
                  @click="openRecent"
                >
                  <el-icon class="text-teal-700" :size="16"><Timer /></el-icon>
                  <span class="min-w-0 flex-1">
                    <span class="block text-sm text-zinc-700">最近学习</span>
                    <span class="block truncate text-[10px] text-zinc-400">
                      {{ recentWords.length ? `${recentWords.length} 个单词 · ${recentCourses[0]?.name ?? '查看详情'}` : recentCourses[0]?.name }}
                    </span>
                  </span>
                  <span class="shrink-0 text-[10px] text-zinc-400">{{ formatDate(recentCourses[0]?.lastStudiedAt ?? null) }}</span>
                  <el-icon class="shrink-0 text-zinc-300" :size="13"><ArrowRight /></el-icon>
                </button>
              </div>
            </section>
          </div>
        </div>

        <section class="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-zinc-200/80 bg-white px-4 py-2.5">
          <div class="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
            <el-icon class="text-teal-700" :size="14"><Calendar /></el-icon>
            本周打卡
          </div>
          <div class="grid min-w-[260px] flex-1 grid-cols-7 gap-1.5">
            <div v-for="day in weekDays" :key="day.key" class="flex items-center justify-center gap-1.5">
              <span class="hidden text-[10px] text-zinc-400 sm:inline">周{{ day.label }}</span>
              <span
                class="grid h-5 w-5 place-items-center rounded-full text-[10px]"
                :class="day.checked
                  ? 'bg-teal-700 text-white'
                  : day.today
                    ? 'border border-teal-700/40 text-teal-700'
                    : 'bg-zinc-100 text-zinc-400'"
              >
                {{ day.day }}
              </span>
            </div>
          </div>
          <button
            type="button"
            class="-mr-2 ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-zinc-500 transition-colors hover:bg-teal-50 hover:text-teal-700"
            @click="openCalendar"
          >
            打卡日历
            <el-icon :size="12"><ArrowRight /></el-icon>
          </button>
        </section>

        <section class="grid grid-cols-2 divide-y divide-zinc-100 rounded-2xl border border-zinc-200/80 bg-white sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          <div
            v-for="item in overviewItems"
            :key="item.label"
            class="px-3 py-2"
          >
            <p class="text-[11px] text-zinc-500">{{ item.label }}</p>
            <p class="mt-1 flex items-baseline gap-1 text-base font-semibold tracking-tight text-zinc-950">
              {{ item.value }}
              <span class="text-[10px] font-normal text-zinc-400">{{ item.suffix }}</span>
            </p>
            <p class="mt-0.5 truncate text-[10px] text-zinc-400">{{ item.hint }}</p>
          </div>
        </section>

        <div class="grid gap-4 lg:grid-cols-2">
          <section class="rounded-2xl border border-zinc-200/80 bg-white p-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h2 class="flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-950">
                <el-icon class="text-teal-700" :size="17"><TrendCharts /></el-icon>
                学习热力图
              </h2>
              <span class="text-[11px] text-zinc-400">
                近 26 周 · {{ heatmapTotal }}
              </span>
            </div>
            <Heatmap
              v-if="heatmap"
              class="mt-3"
              compact
              :days="heatmap.days"
              :start-date="heatmap.startDate"
              :end-date="heatmap.endDate"
              :max-count="heatmap.maxCount"
              :active-days="heatmap.activeDays"
              :total-count="heatmap.totalCount"
              :total-minutes="heatmap.totalMinutes"
            />
          </section>

          <section class="rounded-2xl border border-zinc-200/80 bg-white p-4">
            <TrendMini :points="trendPoints" />
          </section>

          <section class="rounded-2xl border border-zinc-200/80 bg-white p-4">
            <div class="flex items-center gap-2">
              <el-icon class="text-teal-700" :size="16"><Medal /></el-icon>
              <h2 class="text-base font-semibold tracking-tight text-zinc-950">掌握度分布</h2>
            </div>
            <div class="mt-3 grid grid-cols-2 gap-x-5 gap-y-2.5">
              <div v-for="row in masteryRows" :key="row.level">
                <div class="flex items-center justify-between text-[11px]">
                  <span class="text-zinc-500">{{ row.label }}</span>
                  <span class="tabular-nums text-zinc-400">{{ row.count }}</span>
                </div>
                <div class="mt-1 h-1 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    class="h-full rounded-full bg-teal-700 transition-all duration-500"
                    :style="{ width: `${row.percent}%` }"
                  />
                </div>
              </div>
            </div>
          </section>

          <section class="rounded-2xl border border-zinc-200/80 bg-white p-4">
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-base font-semibold tracking-tight text-zinc-950">待巩固的词</h2>
              <button
                type="button"
                class="-mr-1 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-zinc-500 transition-colors hover:bg-teal-50 hover:text-teal-700"
                @click="router.push('/wrong-book/index')"
              >
                全部
                <el-icon :size="12"><ArrowRight /></el-icon>
              </button>
            </div>
            <div v-if="focusWords.length" class="mt-2 divide-y divide-zinc-100">
              <button
                v-for="item in focusWords"
                :key="item.recordId"
                type="button"
                class="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[#fbfaf7] hover:text-teal-700"
                @click="item.courseId && router.push(`/review/index/${item.courseId}/${encodeURIComponent(item.courseName || '复习')}?wordId=${item.wordId}`)"
              >
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-medium text-zinc-900">{{ item.word }}</span>
                  <span class="mt-0.5 block truncate text-[11px] text-zinc-400">
                    {{ cleanText(item.translation) || item.phonetic || '暂无释义' }}
                  </span>
                </span>
                <span class="shrink-0 text-[11px] text-rose-500">错 {{ item.wrongCount }}</span>
              </button>
            </div>
            <p v-else class="mt-3 rounded-xl bg-[#fbfaf7] px-4 py-4 text-center text-xs text-zinc-400">
              还没有需要巩固的词，继续保持。
            </p>
          </section>
        </div>

      </div>
    </div>

    <el-dialog v-model="calendarOpen" title="打卡日历" width="min(420px, 92vw)" class="calendar-dialog">
      <div class="flex items-center justify-between">
        <button
          type="button"
          aria-label="上个月"
          class="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
          @click="shiftMonth(-1)"
        >
          <el-icon :size="13"><ArrowLeft /></el-icon>
        </button>
        <span class="text-sm font-medium text-zinc-700">{{ monthLabel }}</span>
        <button
          type="button"
          aria-label="下个月"
          class="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 disabled:opacity-30"
          :disabled="month >= currentMonth"
          @click="shiftMonth(1)"
        >
          <el-icon :size="13"><ArrowRight /></el-icon>
        </button>
      </div>

      <div class="mt-4 grid grid-cols-7 gap-1 text-center">
        <span v-for="weekday in weekdays" :key="weekday" class="pb-1 text-[11px] text-zinc-400">
          {{ weekday }}
        </span>
        <template v-for="(cell, index) in calendarCells" :key="cell?.date ?? `blank-${index}`">
          <span v-if="!cell" class="aspect-square" />
          <div
            v-else
            class="flex aspect-square items-center justify-center rounded-lg text-xs"
            :class="dayClass(cell)"
            :title="cell.checkedIn ? `${cell.date} · ${cell.words} 词 · ${cell.minutes} 分钟` : cell.date"
          >
            {{ Number(cell.date.slice(-2)) }}
          </div>
        </template>
      </div>

      <div class="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 text-[11px] text-zinc-400">
        <span>本月已打卡 {{ calendar?.checkedInDays ?? 0 }} 天</span>
        <span class="inline-flex items-center gap-1.5">
          <span class="h-1.5 w-1.5 rounded-full bg-teal-700" />
          已打卡
        </span>
      </div>
    </el-dialog>

    <el-drawer
      v-model="recentVisible"
      :with-header="false"
      size="min(480px, 100vw)"
      class="recent-drawer"
    >
      <div class="flex h-full flex-col bg-[#f7f6f1]">
        <header class="flex items-start justify-between border-b border-zinc-200 bg-white px-5 py-4">
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-[0.24em] text-teal-700">Recent activity</p>
            <h2 class="mt-1.5 text-xl font-semibold tracking-tight text-zinc-950">最近学习</h2>
            <p class="mt-1 text-xs text-zinc-500">最近练过的单词，以及它们所属的课程。</p>
          </div>
          <button
            type="button"
            class="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-zinc-400 transition-colors hover:bg-teal-50 hover:text-teal-700"
            aria-label="关闭"
            @click="recentVisible = false"
          >
            <el-icon :size="16"><Close /></el-icon>
          </button>
        </header>

        <div v-if="!recentGroups.length" class="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div class="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">
            <el-icon :size="22"><Timer /></el-icon>
          </div>
          <h3 class="mt-4 text-sm font-semibold text-zinc-950">还没有学习记录</h3>
          <p class="mt-1.5 max-w-[260px] text-xs leading-5 text-zinc-500">完成一组单词后，最近学过的内容会出现在这里。</p>
          <button
            type="button"
            class="btn-ink mt-5 h-9 rounded-xl px-5 text-xs"
            @click="recentVisible = false; goCourses()"
          >
            去学习
          </button>
        </div>

        <div v-else class="flex-1 space-y-5 overflow-y-auto p-5">
          <section v-for="group in recentGroups" :key="group.courseId ?? 'other'">
            <div class="flex items-center justify-between gap-3">
              <div class="flex min-w-0 items-center gap-2.5">
                <div class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-700">
                  <el-icon :size="15"><Reading /></el-icon>
                </div>
                <div class="min-w-0">
                  <h3 class="truncate text-sm font-semibold text-zinc-950">{{ group.courseName }}</h3>
                  <p class="mt-0.5 text-[10px] text-zinc-400">
                    {{ group.words.length }} 个词 · {{ formatDate(group.lastStudiedAt) }}
                  </p>
                </div>
              </div>
              <button
                v-if="group.courseId"
                type="button"
                class="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-teal-700 transition-colors hover:bg-teal-50"
                @click="openCourseLearn(group.courseId, group.courseName)"
              >
                去学习
                <el-icon :size="12"><ArrowRight /></el-icon>
              </button>
            </div>

            <div class="mt-2 divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200/80 bg-white">
              <div
                v-for="word in group.words"
                :key="`${group.courseId}-${word.wordId}`"
                class="flex items-center gap-3 px-4 py-3"
              >
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span class="text-sm font-semibold text-zinc-950">{{ word.word }}</span>
                    <span v-if="word.phonetic" class="text-[10px] text-zinc-400">{{ word.phonetic }}</span>
                    <span
                      class="rounded-full px-1.5 py-0.5 text-[9px] font-medium"
                      :class="word.mode === 'review' ? 'bg-teal-50 text-teal-700' : 'bg-zinc-100 text-zinc-500'"
                    >
                      {{ word.mode === 'review' ? '复习' : '新学' }}
                    </span>
                  </div>
                  <p class="mt-1 line-clamp-1 text-xs leading-5 text-zinc-500">
                    {{ cleanText(word.translation || word.definition) || '暂无释义' }}
                  </p>
                </div>
                <span class="shrink-0 text-[10px] text-zinc-400">{{ formatDate(word.lastStudiedAt) }}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  Close,
  Collection,
  Document,
  Medal,
  Reading,
  Refresh,
  Sunny,
  Timer,
  TrendCharts,
} from '@element-plus/icons-vue'
import type { CheckInCalendar, CheckInCalendarDay } from '@en/common/learn'
import type { HomeSummary, RecentWord } from '@en/common/stats'
import { checkIn, getCheckInCalendar, updateStudyGoals } from '@/apis/learn'
import { getHomeSummary } from '@/apis/stats'
import { useUserStore } from '@/stores/user'
import { useLogin } from '@/hooks/useLogin'
import Heatmap from '@/components/Heatmap/index.vue'
import TrendMini from '@/views/Home/components/TrendMini.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { login } = useLogin()

const summary = ref<HomeSummary | null>(null)
const calendar = ref<CheckInCalendar | null>(null)
const loading = ref(false)
const editing = ref(false)
const saving = ref(false)
const checkingIn = ref(false)
const calendarOpen = ref(false)
const draft = reactive({ dailyNew: 10, dailyReview: 20, dailyMinutes: 15 })

const weekdays = ['一', '二', '三', '四', '五', '六', '日']
const todayKey = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' })
const currentMonth = todayKey.slice(0, 7)
const month = ref(currentMonth)

const todayLabel = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
}).format(new Date())

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const userName = computed(() => userStore.getUser?.name?.trim() || '同学')

const goal = computed(() => summary.value?.goal ?? { dailyNew: 10, dailyReview: 20, dailyMinutes: 15 })
const progress = computed(() => summary.value?.progress ?? {
  date: '',
  newWords: 0,
  reviewWords: 0,
  minutes: 0,
})

const percent = (value: number, target: number) =>
  target <= 0 ? 0 : Math.min(100, Math.round((value / target) * 100))

const progressItems = computed(() => [
  {
    key: 'new',
    label: '新词',
    value: progress.value.newWords,
    goal: goal.value.dailyNew,
    unit: ' 个',
    percent: percent(progress.value.newWords, goal.value.dailyNew),
  },
  {
    key: 'review',
    label: '复习',
    value: progress.value.reviewWords,
    goal: goal.value.dailyReview,
    unit: ' 个',
    percent: percent(progress.value.reviewWords, goal.value.dailyReview),
  },
  {
    key: 'minutes',
    label: '时长',
    value: progress.value.minutes,
    goal: goal.value.dailyMinutes,
    unit: ' 分钟',
    percent: percent(progress.value.minutes, goal.value.dailyMinutes),
  },
])

const canCheckIn = computed(() =>
  Boolean(summary.value && !summary.value.checkIn
    && (progress.value.newWords > 0 || progress.value.reviewWords > 0 || progress.value.minutes > 0)),
)

const overviewItems = computed(() => {
  const overview = summary.value?.overview
  const minutes = overview?.totalMinutes ?? 0
  return [
    {
      label: '已掌握',
      value: overview?.masteredWords ?? 0,
      suffix: '词',
      hint: `掌握率 ${overview?.masteredRate ?? 0}%`,
    },
    {
      label: '正确率',
      value: overview?.accuracy ?? 0,
      suffix: '%',
      hint: `累计 ${overview?.totalAttempts ?? 0} 次练习`,
    },
    {
      label: '累计学习',
      value: minutes >= 60 ? Number((minutes / 60).toFixed(1)) : minutes,
      suffix: minutes >= 60 ? 'h' : 'min',
      hint: `共 ${overview?.totalWords ?? 0} 个词`,
    },
    {
      label: '活跃天数',
      value: overview?.activeDays ?? 0,
      suffix: '天',
      hint: `当前连续 ${summary.value?.streak ?? 0} 天`,
    },
  ]
})

const heatmap = computed(() => summary.value?.heatmap ?? null)
const heatmapTotal = computed(() => `${summary.value?.heatmap?.totalCount ?? 0} 次 · ${summary.value?.heatmap?.totalMinutes ?? 0} 分钟`)
const trendPoints = computed(() => summary.value?.trend ?? [])
const weakWords = computed(() => summary.value?.weakWords ?? [])
const focusWords = computed(() => weakWords.value.slice(0, 3))
const recentCourses = computed(() => summary.value?.recentCourses ?? [])
const recentWords = computed(() => summary.value?.recentWords ?? [])
const recentVisible = ref(false)

const recentGroups = computed(() => {
  const groups = new Map<string, {
    courseId: string | null
    courseName: string
    lastStudiedAt: string | Date
    words: RecentWord[]
  }>()
  for (const word of recentWords.value) {
    const key = word.courseId ?? 'other'
    const group = groups.get(key)
    if (group) {
      group.words.push(word)
      continue
    }
    groups.set(key, {
      courseId: word.courseId,
      courseName: word.courseName || '其他课程',
      lastStudiedAt: word.lastStudiedAt,
      words: [word],
    })
  }
  return Array.from(groups.values())
})

const openRecent = () => {
  recentVisible.value = true
}

const openCourseLearn = (courseId: string | null, name: string) => {
  if (!courseId) return
  router.push(`/learn/index/${courseId}/${encodeURIComponent(name)}`)
}

const masteryRows = computed(() => {
  const labels = ['未开始', '初识', '熟悉', '掌握', '熟练', '精通']
  const rows = summary.value?.mastery ?? []
  const max = Math.max(1, ...rows.map(item => item.count))
  return labels.map((label, level) => {
    const count = rows.find(item => item.level === level)?.count ?? 0
    return {
      level,
      label,
      count,
      percent: Math.round((count / max) * 100),
    }
  })
})

const weekDays = computed(() => {
  const now = new Date()
  const offset = (now.getDay() + 6) % 7
  const start = new Date(now)
  start.setDate(now.getDate() - offset)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const key = date.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' })
    const checked = calendar.value?.days.find(item => item.date === key)?.checkedIn ?? false
    return {
      key,
      label: weekdays[index] ?? '',
      day: date.getDate(),
      checked,
      today: key === todayKey,
    }
  })
})

const formatDate = (value: string | Date | null) => {
  if (!value) return '还没开始'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '还没开始'
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: 'numeric',
    day: 'numeric',
  }).format(date)
}

const cleanText = (text?: string | null) =>
  (text ?? '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/\\r\\n/g, ' ')
    .replace(/\\r/g, ' ')
    .replace(/\\n/g, ' ')
    .replace(/\r\n?/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const monthLabel = computed(() => {
  const [year, value] = month.value.split('-')
  return `${year}年${Number(value)}月`
})

const dayClass = (cell: CheckInCalendarDay) => {
  if (cell.checkedIn) return 'bg-teal-700 text-white'
  if (cell.date === todayKey) return 'border border-teal-700/40 text-teal-700'
  return 'text-zinc-500 hover:bg-zinc-50'
}

const calendarCells = computed<Array<CheckInCalendarDay | null>>(() => {
  if (!calendar.value) return []
  const dateParts = calendar.value.month.split('-')
  const year = Number(dateParts[0] ?? 0)
  const monthValue = Number(dateParts[1] ?? 1)
  const firstWeekday = (new Date(Date.UTC(year, monthValue - 1, 1)).getUTCDay() + 6) % 7
  return [
    ...Array.from({ length: firstWeekday }, () => null),
    ...calendar.value.days,
  ]
})

const loadCalendar = async () => {
  const res = await getCheckInCalendar(month.value)
  if (res.success) calendar.value = res.data
}

const load = async () => {
  loading.value = true
  try {
    const res = await getHomeSummary()
    if (!res.success) {
      ElMessage.error(res.message)
      return
    }
    summary.value = res.data
    draft.dailyNew = res.data.goal.dailyNew
    draft.dailyReview = res.data.goal.dailyReview
    draft.dailyMinutes = res.data.goal.dailyMinutes
    await loadCalendar()
  } finally {
    loading.value = false
  }
}

const loginAndLoad = async () => {
  const ok = await login()
  if (ok) await load()
}

const startEdit = () => {
  if (!summary.value) return
  draft.dailyNew = summary.value.goal.dailyNew
  draft.dailyReview = summary.value.goal.dailyReview
  draft.dailyMinutes = summary.value.goal.dailyMinutes
  editing.value = true
}

const saveGoals = async () => {
  saving.value = true
  try {
    const res = await updateStudyGoals({ ...draft })
    if (!res.success) {
      ElMessage.error(res.message)
      return
    }
    editing.value = false
    await load()
    ElMessage.success('每日目标已更新')
  } finally {
    saving.value = false
  }
}

const handleCheckIn = async () => {
  checkingIn.value = true
  try {
    const res = await checkIn()
    if (!res.success) {
      ElMessage.error(res.message)
      return
    }
    await load()
    ElMessage.success('打卡成功')
  } finally {
    checkingIn.value = false
  }
}

const openCalendar = async () => {
  month.value = currentMonth
  calendarOpen.value = true
  await loadCalendar()
}

const shiftMonth = async (delta: number) => {
  const monthParts = month.value.split('-')
  const year = Number(monthParts[0] ?? 0)
  const value = Number(monthParts[1] ?? 1)
  const date = new Date(Date.UTC(year, value - 1 + delta, 1))
  const next = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
  if (next > currentMonth) return
  month.value = next
  await loadCalendar()
}

const goCourses = () => router.push('/courses/index')

watch(
  () => userStore.user?.id,
  (id) => {
    if (id && !summary.value && !loading.value) load()
  },
)

onMounted(async () => {
  if (userStore.getUser) {
    await load()
    if (route.query.recent === '1') recentVisible.value = true
  }
})
</script>

<style scoped>
.calendar-dialog :deep(.el-dialog__body) {
  padding-top: 8px;
}
</style>
