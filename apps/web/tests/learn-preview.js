// Development-only interaction fixture. API calls are handled in memory and never reach the server.
import { createApp, h } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import '../src/assets/base.css'
import Learn from '../src/views/Learn/index.vue'
import { serverApi } from '../src/apis/index'

const words = [
  { id: 'preview-style', word: 'style', phonetic: 'staɪl', translation: 'n. 风格，时尚，文体，风度，字体，类型；vt. 称呼，设计，使合潮流' },
  { id: 'preview-focus', word: 'focus', phonetic: 'ˈfəʊkəs', translation: 'n. 焦点，中心；v. 集中注意力' },
  { id: 'preview-learn', word: 'learn', phonetic: 'lɜːn', translation: 'v. 学习，学会，了解' },
]
serverApi.defaults.adapter = async (config) => ({
  config, status: 200, statusText: 'OK', headers: {},
  data: {
    success: true, message: 'Preview only',
    data: config.url?.includes('/word/') ? { list: words, lastWordIndex: 0 }
      : config.url?.includes('/finish') ? { learnedCount: 3, wrongWords: [], wordNumber: 3 } : {},
  },
})
const pinia = createPinia()
const router = createRouter({ history: createMemoryHistory(), routes: [
  { path: '/learn/index/:courseId/:title', component: Learn },
] })
const app = createApp({ render: () => h(Learn) })
app.use(pinia).use(router).use(ElementPlus)
// No persistence plugin: do not read or alter the signed-in user's learning records.
const { useUserStore } = await import('../src/stores/user')
useUserStore(pinia).user = { id: 'preview', name: 'Preview', token: {}, wordNumber: 0 }
await router.push('/learn/index/preview/高考单词')
await router.isReady()
app.mount('#app')
