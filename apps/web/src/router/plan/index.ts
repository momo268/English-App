import layout from '@/layout/index.vue'

export default [
    {
        path: '/plan',
        redirect: '/',
    },
    {
        path: '/plan/:pathMatch(.*)*',
        redirect: '/',
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
