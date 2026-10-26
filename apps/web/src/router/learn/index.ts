import layout from '@/layout/index.vue'

export default [
    {
        path: '/learn',
        component: layout,
        children: [
            {
                path: 'index/:courseId/:title',
                component: () => import('@/views/Learn/index.vue'),
                meta: { focus: true },
            },
        ]
    },
    {
        path: '/review',
        component: layout,
        children: [
            {
                path: 'index/:courseId/:title',
                component: () => import('@/views/Learn/index.vue'),
                meta: { focus: true },
            },
        ]
    }
]