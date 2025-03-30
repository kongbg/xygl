import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../layout/index.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/login/index.vue')
  },
  {
    path: '/',
    component: Layout,
    redirect: '/todo',
    children: [
      {
        path: 'todo',
        name: 'Todo',
        component: () => import('../views/todo/index.vue'),
        meta: {
          title: '待办事项',
          icon: 'List',
          requiresAuth: true
        }
      },
      {
        path: 'shop',
        name: 'Shop',
        component: () => import('../views/shop/index.vue'),
        meta: {
          title: '店铺管理',
          icon: 'Shop',
          requiresAuth: true
        }
      },
      {
        path: 'ydshop',
        name: 'YdShop',
        component: () => import('../views/ydshop/index.vue'),
        meta: {
          title: '闲鱼店铺',
          icon: 'Shop',
          requiresAuth: true
        }
      },
      {
        path: 'ydaccount',
        name: 'YdAccount',
        component: () => import('../views/ydaccount/index.vue'),
        meta: {
          title: '闲鱼账号',
          icon: 'User',
          requiresAuth: true
        }
      },
      {
        path: 'good',
        name: 'Good',
        component: () => import('../views/good/index.vue'),
        meta: {
          title: '商品管理',
          icon: 'Goods',
          requiresAuth: true
        }
      },
      {
        path: 'ydgood',
        name: 'YdGood',
        component: () => import('../views/ydgood/index.vue'),
        meta: {
          title: '闲鱼商品',
          icon: 'Shop',
          requiresAuth: true,
          hidden: true
        }
      },
      {
        path: 'xygood',
        name: 'XyGood',
        component: () => import('../views/xygood/index.vue'),
        meta: {
          title: '闲鱼商品',
          icon: 'Shop',
          requiresAuth: true,
          hidden: true
        }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!token) {
      next('/login')
    } else {
      next()
    }
  } else {
    if (token && to.path === '/login') {
      next('/')
    } else {
      next()
    }
  }
})

export default router 