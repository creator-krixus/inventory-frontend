import { defineStore } from "pinia";
import * as agentService from "../services/agent.service";

const STORAGE_KEY = "agent-chat-state";

// Genera un id simple para las bubbles del chat (fallback por si
// crypto.randomUUID no está disponible, ej. contextos no seguros/http).
const generateId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const loadPersistedState = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const persisted = loadPersistedState();

export const useAgentStore = defineStore("agent", {
  state: () => ({
    // Lo que se muestra en la UI: solo texto legible por turno.
    messages: persisted?.messages || [],
    // Lo que se reenvía tal cual a la API en cada request (opaco,
    // incluye bloques internos de Claude como "thinking"/"tool_use").
    // NUNCA se debe modificar su contenido manualmente.
    history: persisted?.history || [],
    loading: false,
    error: null,
  }),

  actions: {
    _persist() {
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ messages: this.messages, history: this.history })
        );
      } catch {
        // sessionStorage puede fallar en modo incógnito estricto; no es crítico,
        // el chat sigue funcionando, solo no persiste entre refrescos.
      }
    },

    async sendMessage(text, attachment = null) {
      const trimmed = (text || "").trim();

      if ((!trimmed && !attachment) || this.loading) return;

      this.error = null;

      this.messages.push({
        id: generateId(),
        role: "user",
        text: trimmed,
        // Solo se guarda el nombre/tipo para mostrar un chip en la
        // burbuja — el base64 real NO se duplica acá (ya viaja dentro de
        // `history`, que es lo que se persiste/reenvía a la API).
        attachmentName: attachment?.name || null,
      });
      this._persist();

      this.loading = true;

      try {
        const { data } = await agentService.sendMessage(trimmed, this.history, attachment);

        this.history = data.history;

        this.messages.push({
          id: generateId(),
          role: "assistant",
          text: data.reply,
        });
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          "No se pudo conectar con el asistente. Intenta de nuevo.";

        this.error = message;

        this.messages.push({
          id: generateId(),
          role: "assistant",
          text: message,
          isError: true,
        });
      } finally {
        this.loading = false;
        this._persist();
      }
    },

    reset() {
      this.messages = [];
      this.history = [];
      this.error = null;
      this._persist();
    },
  },
});