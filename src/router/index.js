import { createRouter, createWebHistory } from "vue-router";

import Login from "../views/Login.vue";
import HomeView from "../views/HomeView.vue";
import ChatView from "../views/ChatView.vue";

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
      path: "/assistant",
      name: "assistant",
      component: ChatView,
    },
    {
      path: "/",
      redirect: "/assistant",
    },
  ],
});

router.beforeEach((to) => {
  const token = localStorage.getItem("token");

  if (!token && to.path !== "/login") {
    return "/login";
  }

  if (token && to.path === "/login") {
    return "/assistant";
  }
});

export default router;
