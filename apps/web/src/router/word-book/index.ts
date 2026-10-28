import layout from '@/layout/index.vue'

export default [
    {
        path: '/word-book',
        component: layout,
        children: [
            { path: 'index', component: () => import('@/views/WordBook/index.vue') },
            {
                path: 'mine/:id',
                component: () => import('@/views/WordBook/Detail.vue'),
                meta: { auth: true },
            },
        ]
    }
]