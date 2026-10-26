import { IS_SHOW_LOGIN } from '@/components/Login/type'
import { inject, ref } from 'vue'
import { useUserStore } from '@/stores/user'
import router from '@/router'

// 所有组件共享同一个“等待登录结果”，避免每个 useLogin() 各建一个闭包，
// 导致登录表单无法通知调用方“登录成功”。
let pendingResolve: ((ok: boolean) => void) | null = null

export const useLogin = () => {
    const isShowLogin = inject(IS_SHOW_LOGIN, ref(false))
    const userStore = useUserStore()

    // 已登录 -> 直接 true；未登录 -> 弹框并等待登录/取消
    const login = (): Promise<boolean> => {
        if (userStore.getUser) {
            return Promise.resolve(true)
        }
        isShowLogin.value = true
        return new Promise<boolean>((resolve) => {
            // 同时有多个动作等待登录时，先取消上一个
            pendingResolve?.(false)
            pendingResolve = resolve
        })
    }

    // 登录/注册成功后由表单调用
    const onLoginSuccess = () => {
        pendingResolve?.(true)
        pendingResolve = null
        isShowLogin.value = false
    }

    // 关闭弹窗/ESC：视为取消，不继续原动作
    const hide = () => {
        pendingResolve?.(false)
        pendingResolve = null
        isShowLogin.value = false
    }

    // 登录成功后自动执行 action；取消则什么都不做
    const requireLogin = async (action?: () => void | Promise<void>) => {
        const ok = await login()
        if (ok) {
            await action?.()
        }
        return ok
    }

    const logout = () => {
        userStore.logout() //pinia的值清空
        router.push('/') //跳转到首页
    }

    return {
        login,
        requireLogin,
        onLoginSuccess,
        hide,
        logout
    }
}
