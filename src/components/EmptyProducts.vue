<script setup>
const emit = defineEmits(["new"]);
</script>

<template>
  <section class="empty-products">
    <div class="empty-products__icon">
      📦
    </div>
    <h2>No hay productos</h2>
    <p>
      Todavía no has creado ningún producto.
      Empieza agregando el primero.
    </p>
    <button
      class="empty-products__button"
      @click="emit('new')"
    >
      + Crear primer producto
    </button>
  </section>
</template>

<style scoped>

.empty-products{
    background:white;
    border-radius:12px;
    padding:60px 30px;
    text-align:center;
    box-shadow:0 10px 25px rgba(0,0,0,.08);
}

.empty-products__icon{
    font-size:70px;
    margin-bottom:20px;
}

.empty-products h2{
    margin-bottom:10px;
    color:#1f2937;
}

.empty-products p{
    color:#6b7280;
    margin-bottom:30px;
}

.empty-products__button{
    border:none;
    background:#2563eb;
    color:white;
    padding:14px 24px;
    border-radius:8px;
    cursor:pointer;
    transition:.25s;
}

.empty-products__button:hover{
    background:#1d4ed8;
}

@media(max-width:768px){

.empty-products{
    padding:40px 20px;
}

.empty-products__button{
    width:100%;
}

}

</style>