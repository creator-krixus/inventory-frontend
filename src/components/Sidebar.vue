<script setup>
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.store";

const router = useRouter();
const authStore = useAuthStore();

const logout = () => {

    authStore.logout();

    router.push("/login");

};
</script>

<template>

<aside class="sidebar">

    <div>

        <div class="sidebar__logo">

            <div class="sidebar__icon">

                📦

            </div>

            <div>

                <h2>Inventario</h2>

            </div>

        </div>

        <nav class="sidebar__menu">

            <RouterLink
                to="/products"
                class="sidebar__item"
                active-class="sidebar__item--active"
            >

                📦

                <span>Productos</span>

            </RouterLink>

        </nav>

    </div>

    <button
        class="sidebar__logout"
        @click="logout"
    >

        🚪

        Cerrar sesión

    </button>

</aside>

</template>