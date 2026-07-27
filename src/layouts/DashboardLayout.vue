<script setup>
import Sidebar from "../components/Sidebar.vue";
</script>

<template>

<div class="dashboard">

    <Sidebar />

    <main class="dashboard__content">

        <slot />

    </main>

</div>

</template>