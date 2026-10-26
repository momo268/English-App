import layout from '@/layout/index.vue'

export default [
    {
        path: '/plan',
        component: layout,
        children: [
            {
                path: 'index',
                component: () => import('@/views/Plan/index.vue'),
                meta: { auth: true },
            },
        ],
    },
    {
        path: '/wrong-book',
        component: layout,
        children: [
            {
                path: 'index',
                component: () => import('@/views/WrongBook/index.vue'),
                meta: { auth: true },
            },
        ],
    },
]
