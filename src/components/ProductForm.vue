<script setup>
import { reactive, watch } from "vue";

const props = defineProps({
  product: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits([
  "save",
  "cancel",
]);

const form = reactive({
  name: "",
  price: "",
  stock: "",
});

watch(
  () => props.product,
  (product) => {
    if (product) {
      form.name = product.name;
      form.price = product.price;
      form.stock = product.stock;
    }
  },
  { immediate: true }
);

const submit = () => {

  if (
    !form.name.trim() ||
    form.price === "" ||
    form.stock === ""
  ) {
    return;
  }

  emit("save", {
    name: form.name.trim(),
    price: Number(form.price),
    stock: Number(form.stock),
  });

};
</script>

<template>
<div class="product-form">
    <div class="product-form__header">
        <h2>
            {{ product ? "Editar producto" : "Nuevo producto" }}
        </h2>
    </div>

    <form
        class="product-form__body"
        @submit.prevent="submit"
    >
        <div class="form-group">
            <label>
                Nombre
            </label>
            <input
                v-model="form.name"
                type="text"
                placeholder="Nombre del producto"
                required
            >
        </div>

        <div class="form-group">
            <label>
                Precio
            </label>
            <input
                v-model="form.price"
                type="number"
                placeholder="0"
                required
            >
        </div>

        <div class="form-group">
            <label>
                Stock
            </label>

            <input
                v-model="form.stock"
                type="number"
                placeholder="0"
                required
            >
        </div>

        <div class="product-form__actions">
            <button
                type="button"
                class="btn btn--secondary"
                @click="$emit('cancel')"
            >
                Cancelar
            </button>
            <button
                type="submit"
                class="btn btn--primary"
            >
                {{ product ? "Actualizar" : "Guardar producto" }}
            </button>
        </div>
    </form>
</div>

</template>

<style scoped>

.product-form{
    background:white;
    border-radius:12px;
    box-shadow:0 10px 25px rgba(0,0,0,.08);
    padding:30px;
}

.product-form__header{
    margin-bottom:30px;
}

.product-form__header h2{
    font-size:28px;
    color:#1f2937;
}

.product-form__body{
    display:grid;
    grid-template-columns:repeat(2,1fr);
    gap:25px;
}

.form-group{
    display:flex;
    flex-direction:column;
}

.form-group label{
    margin-bottom:8px;
    font-weight:600;
    color:#4b5563;
}

.form-group input{
    height:46px;
    padding:0 15px;
    border:1px solid #d1d5db;
    border-radius:8px;
    outline:none;
    transition:.25s;
}

.form-group input:focus{
    border-color:#2563eb;
}

.product-form__actions{
    grid-column:1/-1;
    display:flex;
    justify-content:flex-end;
    gap:15px;
    margin-top:20px;
}

.btn{
    border:none;
    border-radius:8px;
    padding:12px 22px;
    cursor:pointer;
    transition:.25s;
    font-weight: 700;
    font-size:18px;
}

.btn--primary{
    background:#2563eb;
    color:white;
    font-size: 18px;
    font-weight: 700;
}

.btn--primary:hover{
    background:#1d4ed8;
}

.btn--secondary{
    background:#e5e7eb;
    color:#111827;
}

.btn--secondary:hover{
    background:#d1d5db;
}

/* ======================= */
/* Tablet */
/* ======================= */

@media(max-width:1024px){

.product-form__body{
    grid-template-columns:1fr;
}

}

/* ======================= */
/* Mobile */
/* ======================= */

@media(max-width:768px){

.product-form{
    padding:20px;
}

.product-form__header h2{
    font-size:24px;
}

.product-form__actions{
    flex-direction:column;
}

.btn{
    width:100%;
}

}

</style>