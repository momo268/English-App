import { createRouter, createWebHistory } from 'vue-router'
import home from './home/index'
import wordBook from './word-book/index'
import setting from './setting/index'
import chat from './chat/index'
import course from './course/index'
import learn from './learn/index'
import plan from './plan/index'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...home, //主页
    ...wordBook, //词库
    ...setting, //设置
    ...chat, //聊天
    ...course, //课程
    ...learn, //学习
    ...plan, //学习计划 / 错词本
  ]
})

export default router
