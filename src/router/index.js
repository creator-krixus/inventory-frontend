// import { createRouter, createWebHistory } from 'vue-router'
// import HomeView from '../views/HomeView.vue'
// import Login from '../views/Login.vue'

// const router = createRouter({
//   history: createWebHistory(import.meta.env.BASE_URL),
//   routes: [
//     {
//       path: '/',
//       name: 'login',
//       component: Login,
//     },
//     {
//       path: '/about',
//       name: 'about',
//       // route level code-splitting
//       // this generates a separate chunk (About.[hash].js) for this route
//       // which is lazy-loaded when the route is visited.
//       component: () => import('../views/AboutView.vue'),
//     },
//     {
//       path: "/products",
//       component: HomeView ,
//     },
//   ],
// })

// router.beforeEach((to) => {
//   const token = localStorage.getItem("token");

//   if (to.path !== "/" && !token) {
//     return "/login";
//   }
// });

// export default router

import { createRouter, createWebHistory } from "vue-router";

import Login from "../views/Login.vue";
import HomeView from "../views/HomeView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
      name: "login",
      component: Login,
    },
    {
      path: "/products",
      name: "products",
      component: HomeView,
    },
    {
      path: "/",
      redirect: "/login",
    },
  ],
});

router.beforeEach((to) => {
  const token = localStorage.getItem("token");

  if (!token && to.path !== "/login") {
    return "/login";
  }

  if (token && to.path === "/login") {
    return "/products";
  }
});

export default router;
