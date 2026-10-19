
import defaultAvatar from '@/assets/images/avatar/default-avatar.png' //默认头像
import { useUserStore } from '@/stores/user' //用户信息
import { computed } from 'vue'
export const useAvatar = () => {
    const userStore = useUserStore() //初始化pinia
    const avatar = computed(() => {
        if (userStore.getUser?.avatar) {
            return userStore.getUser.avatar
        }
        else {
            return defaultAvatar
        }
    })
    return {
        avatar,
    }
}