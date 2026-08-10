<script setup>
defineProps({
  products: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits([
  "new",
  "edit",
  "delete"
]);

const capitalize = (text) => {
  if (!text) return "";

  return text.charAt(0).toUpperCase() + text.slice(1);
};
</script>

<template>
  <section class="product-table">

    <div class="product-table__header">
      <h1 class="product-table__title">Productos</h1>

      <!-- <button
        class="product-table__button"
        @click="emit('new')"
      >
        + Nuevo producto
      </button> -->
    </div>

    <div class="product-table__content">

      <table class="table">

        <thead>
          <tr>
            <th class="table__name">Nombre</th>
            <th class="table__name">Precio</th>
            <th class="table__name">Stock</th>
            <!-- <th class="table__actions">Acciones</th> -->
          </tr>
        </thead>

        <tbody>

          <tr
            v-for="product in products"
            :key="product._id"
          >
            <td>{{ capitalize(product.name) }}</td>

            <td>
              {{ new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
                minimumFractionDigits: 0,
              }).format(product.price) }}
            </td>
            <td>
              {{ new Intl.NumberFormat("es-CO", {
                currency: "COP",
                minimumFractionDigits: 0,
              }).format(product.stock) }}
            </td>

            <!-- <td class="table__actions">

              <button class="btn btn--edit" @click="emit('edit', product)">
                ✏️
              </button>

              <button class="btn btn--delete" @click="emit('delete', product._id)">
                🗑️
              </button>

            </td> -->

          </tr>

        </tbody>

      </table>

    </div>

  </section>
</template>

<style scoped>

.product-table{
    background:white;
    border-radius:12px;
    padding:25px;
    box-shadow:0 10px 25px rgba(0,0,0,.08);
    width: 100%;
}

.product-table__header{
    display:flex;
    justify-content:space-between;
    align-items:center;
    margin-bottom:25px;
}

.product-table__title{
    font-size:28px;
    color:#1f2937;
}

.product-table__button{
    border:none;
    background:#2563eb;
    color:white;
    padding:12px 18px;
    border-radius:8px;
    cursor:pointer;
    transition:.25s;
    font-size: 18px;
    font-weight: 700;
}

.product-table__button:hover{
    background:#1d4ed8;
}

.product-table__content{
    overflow-x:auto;
}

.table{
    width:100%;
    border-collapse:collapse;
}

.table th{
    text-align:left;
    padding:10px;
    font-size:20px;
    border-bottom:1px solid #e5e7eb;
}

.table td{
    padding:18px 10px;
    border-bottom:1px solid #f1f5f9;
    font-weight: 500;
    color:#16171a;
}

.table tbody tr:hover{
    background:#f8fafc;
}

.table__actions{
    width:120px;
}

.btn{
    border:none;
    width:36px;
    height:36px;
    border-radius:8px;
    cursor:pointer;
    margin-right:8px;
}

.btn--edit{
    background:#2563eb;
    color:white;
}

.btn--delete{
    background:#ef4444;
    color:white;
}

/* ===================== */
/* Tablet */
/* ===================== */

@media (max-width:1024px){

.product-table{
    padding:20px;
}

.product-table__title{
    font-size:24px;
}

}

/* ===================== */
/* Mobile */
/* ===================== */

@media (max-width:768px){

.product-table__header{
    flex-direction:column;
    align-items:flex-start;
    gap:15px;
}

.product-table__button{
    width:100%;
}

.table{
    min-width:600px;
}

}

</style>