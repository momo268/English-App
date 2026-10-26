import layout from '@/layout/index.vue'

export default [
    {
        path: '/',
        component: layout,
        children: [
            { path: '/', component: () => import('@/views/Home/index.vue') },
        ]
    }
]
