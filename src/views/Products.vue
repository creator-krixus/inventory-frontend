<script setup>
import { ref, computed, onMounted } from "vue";

import DashboardLayout from "../layouts/DashboardLayout.vue";
import ProductTable from "../components/ProductTable.vue";
import ProductForm from "../components/ProductForm.vue";
import EmptyProducts from "../components/EmptyProducts.vue";

import { useProductStore } from "../stores/product.store";

const store = useProductStore();

const showForm = ref(false);
const selectedProduct = ref(null);

/* ========================= */
/* Cargar productos */
/* ========================= */

onMounted(async () => {
  await store.loadProducts();
});

/* ========================= */
/* Computed */
/* ========================= */

const products = computed(() => store.products);

const hasProducts = computed(() => products.value.length > 0);

const loading = computed(() => store.loading);

/* ========================= */
/* Nuevo producto */
/* ========================= */

function createProduct() {
  selectedProduct.value = null;
  showForm.value = true;
}

/* ========================= */
/* Editar */
/* ========================= */

function editProduct(product) {
  selectedProduct.value = product;
  showForm.value = true;
}

/* ========================= */
/* Guardar */
/* ========================= */

async function saveProduct(product) {

  try {

    if (selectedProduct.value) {

      await store.updateProduct(
        selectedProduct.value._id,
        product
      );

    } else {

      await store.createProduct(product);

    }

    showForm.value = false;
    selectedProduct.value = null;

  } catch (error) {

    console.error(error);

    alert("Ocurrió un error al guardar el producto.");

  }

}

/* ========================= */
/* Eliminar */
/* ========================= */

async function deleteProduct(id) {

  const confirmed = confirm(
    "¿Deseas eliminar este producto?"
  );

  if (!confirmed) return;

  try {

    await store.deleteProduct(id);

  } catch (error) {

    console.error(error);

    alert("No fue posible eliminar el producto.");

  }

}

/* ========================= */
/* Cancelar */
/* ========================= */

function cancelForm() {

  showForm.value = false;
  selectedProduct.value = null;

}
</script>

<template>

<DashboardLayout>

    <div v-if="loading">

        Cargando productos...

    </div>

    <template v-else>

        <ProductForm

            v-if="showForm"

            :product="selectedProduct"

            @save="saveProduct"

            @cancel="cancelForm"

        />

        <ProductTable

            v-else-if="hasProducts"

            :products="products"

            @new="createProduct"

            @edit="editProduct"

            @delete="deleteProduct"

        />

        <EmptyProducts

            v-else

            @new="createProduct"

        />

    </template>

</DashboardLayout>

</template>