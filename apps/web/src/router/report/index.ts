import layout from '@/layout/index.vue'

export default [
    {
        path: '/report',
        component: layout,
        children: [
            {
                path: 'index',
                component: () => import('@/views/Report/index.vue'),
                meta: { auth: true },
            },
        ],
    },
]
