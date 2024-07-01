import { createRouter, createWebHashHistory } from "vue-router";
const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/addScheme',
            name: 'addScheme',
            component: () => import(/* webpackChunkName: "addScheme" */ '../views/AddScheme.vue')
        },
        {
            path: '/scheme',
            name: 'scheme',
            component: () => import(/* webpackChunkName: "scheme" */ '../views/Scheme.vue')
        },
    ]
})

export default router;