import { defineStore } from "pinia";
import * as productService from "../services/product.service";

export const useProductStore = defineStore("products", {
  state: () => ({
    products: [],
    loading: false,
  }),

  actions: {
    async loadProducts() {
      this.loading = true;

      try {
        const { data } = await productService.getProducts();
        this.products = data;
      } finally {
        this.loading = false;
      }
    },

    async createProduct(product) {
      await productService.createProduct(product);
      await this.loadProducts();
    },

    async updateProduct(id, product) {
      await productService.updateProduct(id, product);
      await this.loadProducts();
    },

    async deleteProduct(id) {
      await productService.deleteProduct(id);
      await this.loadProducts();
    },
  },
});