import { defineStore } from "pinia";
import * as authService from "../services/auth.service";
import { useAgentStore } from "./agent.store";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("token"),
    user: JSON.parse(localStorage.getItem("user")) || null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
  },

  actions: {
    async login(credentials) {
      const { data } = await authService.login(credentials);

      this.token = data.token;
      this.user = data.user;

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
    },

    logout() {
      this.token = null;
      this.user = null;

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Importante: si no se limpia, la conversación con el agente (que
      // puede incluir datos de inventario) quedaría visible para el
      // siguiente usuario que inicie sesión en la misma pestaña.
      useAgentStore().reset();
    },
  },
});