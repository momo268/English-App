import axios from 'axios'
import { useUserStore } from '@/stores/user' //pinia user的
import { refreshTokenApi } from './auth' //刷新token接口
import { ElMessage } from 'element-plus'
import { REQUIRE_LOGIN_EVENT } from '@/components/Login/type'

export const timeout = 50000
export const uploadUrl = import.meta.env.DEV ? 'http://127.0.0.1:9000' : 'http://线上地址待定'
export const socketUrl = import.meta.env.DEV ? 'http://127.0.0.1:3000' : 'http://线上地址待定'
//server服务器接口
export const serverApi = axios.create({
    baseURL: '/api/v1',
    timeout,
})
let isRefreshing = false //是否正在刷新token
type QueueItem = {
    resolve: (newAccessToken: string) => void
    reject: (error: unknown) => void
}
let requestQueue: QueueItem[] = [] //存储等待新 token 的请求
//请求拦截器
serverApi.interceptors.request.use(config => {
    const userStore = useUserStore()
    if (userStore.getAccessToken) {
        config.headers.Authorization = `Bearer ${userStore.getAccessToken}`
    }
    return config
})
//响应拦截器
serverApi.interceptors.response.use(res => {
    return res.data
}, async error => {
    // ⭐ 网络错误 / 超时 / CORS 等（无 response）
    if (!error.response) {
        if (error.code === 'ERR_NETWORK' || error.message?.includes('timeout')) {
            ElMessage.error('请求超时，请检查网络后重试')
        } else {
            ElMessage.error('网络异常，请检查网络连接')
        }
        return Promise.reject(error)
    }

    if (error.response.status !== 401) {
        //其他code码就直接抛出异常
        ElMessage.error("服务器异常，请稍后再试")
        return Promise.reject(error)
    }
    //下面的逻辑就是处理401的情况了
    const userStore = useUserStore()
    const accessToken = userStore.getAccessToken
    const refreshToken = userStore.getRefreshToken
    const originalRequest = error.config //读取原始请求

    const rejectQueue = (reason: unknown) => {
        requestQueue.forEach((item) => item.reject(reason))
        requestQueue = []
    }

    // 渐进式登录：未登录时不踢回首页，只弹登录框，保留当前页面
    if (!accessToken || !refreshToken) {
        userStore.logout()
        ElMessage.warning("请先登录")
        window.dispatchEvent(new Event(REQUIRE_LOGIN_EVENT))
        return Promise.reject(error)
    }
    if (isRefreshing) {
        return new Promise((resolve, reject) => {
            requestQueue.push({
                resolve: (newAccessToken: string) => {
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
                    resolve(serverApi(originalRequest))
                },
                reject,
            })
        })
    }
    //刷新token调用接口
    isRefreshing = true
    try {
        const newToken = await refreshTokenApi({ refreshToken: refreshToken })
        if (newToken.success) {
            //切换成功更新token到pinia中
            userStore.updateToken(newToken.data)
        } else {
            userStore.logout() //清空user
            ElMessage.error("登录已过期，请重新登录")
            rejectQueue(error)
            window.dispatchEvent(new Event(REQUIRE_LOGIN_EVENT))
            return Promise.reject(error)
        }
        const newAccessToken = newToken.data.accessToken
        const pending = requestQueue
        requestQueue = []
        pending.forEach(item => item.resolve(newAccessToken)) //执行等待中的请求
        return serverApi(originalRequest)
    } catch (refreshError) {
        userStore.logout()
        rejectQueue(refreshError)
        window.dispatchEvent(new Event(REQUIRE_LOGIN_EVENT))
        return Promise.reject(refreshError)
    } finally {
        isRefreshing = false //重置刷新状态
    }
})
//ai服务器接口
export const aiApi = axios.create({
    baseURL: '/ai/v1',
    timeout,
})

aiApi.interceptors.response.use(res => {
    return res.data
})


export interface Response<T = any> {
    timestamp: string,
    path: string,
    message: string,
    code: number,
    success: boolean,
    data: T
}