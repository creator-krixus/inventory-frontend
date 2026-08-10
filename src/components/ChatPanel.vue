<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { useAgentStore } from "../stores/agent.store";

const store = useAgentStore();

const input = ref("");
const listRef = ref(null);

const messages = computed(() => store.messages);
const loading = computed(() => store.loading);

const suggestions = [
  "¿Qué productos tengo en el inventario?",
  "¿Cuánto stock tengo de arroz?",
  "Registra el ingreso de 20 unidades de arroz caribe precio de compra 2100, precio de venta 2900",
  "¿Cual es el valor total de mi inventario?"
];

const scrollToBottom = async () => {
  await nextTick();
  if (listRef.value) {
    listRef.value.scrollTop = listRef.value.scrollHeight;
  }
};

watch(messages, scrollToBottom, { deep: true });
watch(loading, scrollToBottom);

const send = async () => {
  const text = input.value;
  input.value = "";
  await store.sendMessage(text);
};

const sendSuggestion = (text) => {
  store.sendMessage(text);
};

const handleKeydown = (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    send();
  }
};

const clearChat = () => {
  const confirmed = confirm("¿Borrar toda la conversación con el asistente?");
  if (confirmed) store.reset();
};
</script>

<template>
  <div class="chat">
    <div class="chat__header">
      <div>
        <h2>🤖 Asistente de inventario</h2>
        <p>Pregunta por tu stock o registra movimientos en lenguaje natural</p>
      </div>

      <button
        v-if="messages.length"
        type="button"
        class="chat__clear"
        @click="clearChat"
      >
        🗑️ Limpiar chat
      </button>
    </div>

    <div ref="listRef" class="chat__messages">
      <div v-if="!messages.length" class="chat__empty">
        <p>
          👋 ¡Hola! Puedo ayudarte a consultar tu inventario, registrar
          ingresos/salidas de stock y crear productos nuevos.
        </p>

        <div class="chat__suggestions">
          <button
            v-for="s in suggestions"
            :key="s"
            type="button"
            class="chat__suggestion"
            @click="sendSuggestion(s)"
          >
            {{ s }}
          </button>
        </div>
      </div>

      <div
        v-for="m in messages"
        :key="m.id"
        class="chat__row"
        :class="`chat__row--${m.role}`"
      >
        <div
          class="chat__bubble"
          :class="[`chat__bubble--${m.role}`, { 'chat__bubble--error': m.isError }]"
        >{{ m.text }}</div>
      </div>

      <div v-if="loading" class="chat__row chat__row--assistant">
        <div class="chat__bubble chat__bubble--assistant chat__bubble--typing">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>

    <form class="chat__input-row" @submit.prevent="send">
      <textarea
        v-model="input"
        rows="1"
        placeholder="Escribe un mensaje..."
        :disabled="loading"
        @keydown="handleKeydown"
      ></textarea>

      <button
        type="submit"
        class="chat__send"
        :disabled="loading || !input.trim()"
      >
        ➤
      </button>
    </form>
  </div>
</template>

<style scoped>
.chat {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background: white;
  border-radius: 14px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.chat__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.chat__header h2 {
  font-size: 18px;
  color: #111827;
  margin-bottom: 4px;
}

.chat__header p {
  font-size: 13px;
  color: #6b7280;
}

.chat__clear {
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  font-size: 13px;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: 0.2s;
}

.chat__clear:hover {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #dc2626;
}

.chat__messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: #f9fafb;
}

.chat__empty {
  margin: auto;
  max-width: 480px;
  text-align: center;
  color: #4b5563;
}

.chat__empty p {
  margin-bottom: 20px;
  line-height: 1.5;
}

.chat__suggestions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chat__suggestion {
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  font-size: 13px;
  padding: 12px 16px;
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  transition: 0.2s;
}

.chat__suggestion:hover {
  border-color: #2563eb;
  color: #2563eb;
  background: #eff6ff;
}

.chat__row {
  display: flex;
}

.chat__row--user {
  justify-content: flex-end;
}

.chat__row--assistant {
  justify-content: flex-start;
}

.chat__bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 14px;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.chat__bubble--user {
  background: #2563eb;
  color: white;
  border-bottom-right-radius: 4px;
}

.chat__bubble--assistant {
  background: white;
  color: #111827;
  border: 1px solid #e5e7eb;
  border-bottom-left-radius: 4px;
}

.chat__bubble--error {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #b91c1c;
}

.chat__bubble--typing {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 16px;
}

.chat__bubble--typing span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #9ca3af;
  animation: chat-typing 1.2s infinite ease-in-out;
}

.chat__bubble--typing span:nth-child(2) {
  animation-delay: 0.2s;
}

.chat__bubble--typing span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes chat-typing {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-3px);
  }
}

.chat__input-row {
  display: flex;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background: white;
}

.chat__input-row textarea {
  flex: 1;
  resize: none;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: 0.2s;
  max-height: 120px;
}

.chat__input-row textarea:focus {
  border-color: #2563eb;
}

.chat__input-row textarea:disabled {
  background: #f3f4f6;
}

.chat__send {
  width: 46px;
  height: 46px;
  border: none;
  border-radius: 10px;
  background: #2563eb;
  color: white;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
  flex-shrink: 0;
}

.chat__send:hover:not(:disabled) {
  background: #1d4ed8;
}

.chat__send:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}

/* ========================= */
/* Tablet */
/* ========================= */

@media (max-width: 1024px) {

.chat__messages {
  padding: 20px;
}

}

/* ========================= */
/* Mobile */
/* ========================= */

@media (max-width: 768px) {

.chat__header {
  padding: 14px 16px;
  flex-wrap: wrap;
  gap: 10px;
}

.chat__header h2 {
  font-size: 16px;
}

.chat__header p {
  font-size: 12px;
}

.chat__messages {
  padding: 14px;
  gap: 10px;
  height: 200px;
}

.chat__bubble {
  max-width: 88%;
  font-size: 13.5px;
}

.chat__input-row {
  padding: 12px 14px;
}

.chat__send {
  width: 42px;
  height: 42px;
}

.chat__empty {
  margin: 20px 0;
}

}
</style>