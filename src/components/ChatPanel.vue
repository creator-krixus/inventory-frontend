<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useAgentStore } from "../stores/agent.store";
import { prepareAttachment } from "../utils/attachments";

const store = useAgentStore();

const input = ref("");
const listRef = ref(null);
const textareaRef = ref(null);

// Alto máximo antes de que el textarea empiece a hacer scroll interno en
// vez de seguir creciendo (debe coincidir con max-height en el CSS).
const MAX_TEXTAREA_HEIGHT = 160;

const autoResizeTextarea = async () => {
  await nextTick();
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
};

// Cubre todos los casos por igual: tipeo normal, texto dictado por voz, y
// cuando se limpia el input al enviar el mensaje (vuelve a su alto mínimo).
watch(input, autoResizeTextarea);

const messages = computed(() => store.messages);
const loading = computed(() => store.loading);

const suggestions = [
  "¿Qué productos tengo en el inventario?",
  "¿Cuáles son los prductos con el stock mas bajo?",
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
  const attachment = pendingAttachment.value;
  input.value = "";
  pendingAttachment.value = null;
  await store.sendMessage(text, attachment);
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

// ---- Adjuntar foto/PDF de factura ----
const fileInputRef = ref(null);
const pendingAttachment = ref(null); // { kind, mediaType, data, name, sizeLabel }
const pendingPreviewUrl = ref(""); // solo para mostrar thumbnail de imágenes
const attachError = ref("");
const isProcessingAttachment = ref(false);

const openFilePicker = () => {
  fileInputRef.value?.click();
};

const onFileSelected = async (event) => {
  const file = event.target.files?.[0];
  event.target.value = ""; // permite volver a elegir el mismo archivo después

  if (!file) return;

  attachError.value = "";
  isProcessingAttachment.value = true;

  try {
    const attachment = await prepareAttachment(file);
    pendingAttachment.value = attachment;
    pendingPreviewUrl.value = attachment.kind === "image" ? URL.createObjectURL(file) : "";
  } catch (err) {
    attachError.value = err.message || "No se pudo procesar el archivo.";
    setTimeout(() => { attachError.value = ""; }, 5000);
  } finally {
    isProcessingAttachment.value = false;
  }
};

const removePendingAttachment = () => {
  if (pendingPreviewUrl.value) {
    URL.revokeObjectURL(pendingPreviewUrl.value);
  }
  pendingAttachment.value = null;
  pendingPreviewUrl.value = "";
};

// ---- Entrada por voz (Web Speech API) ----
// Solo Chrome/Edge y Chrome Android la soportan bien (Safari/iOS no).
// Si el navegador no la soporta, isVoiceSupported queda en false y el
// botón de micrófono ni siquiera se muestra — no rompe nada en esos casos.
const SpeechRecognitionApi =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

const isVoiceSupported = !!SpeechRecognitionApi;
const isRecording = ref(false);
const voiceError = ref("");

let recognition = null;
// Texto que ya había en el input antes de esta sesión de grabación, para
// no perderlo si el usuario vuelve a tocar el micrófono a completar la frase.
let baseText = "";

const createRecognition = () => {
  const instance = new SpeechRecognitionApi();
  instance.lang = "es-CO";
  // continuous:false — el reconocimiento se detiene solo apenas termina
  // la frase, en vez de quedar escuchando indefinidamente. Con
  // continuous:true, Chrome reinicia el motor internamente tras silencios
  // o ruido de fondo, y al reiniciar vuelve a transcribir parte del audio
  // ya procesado — eso es lo que causaba las palabras repetidas.
  instance.continuous = false;
  instance.interimResults = true;

  instance.onresult = (event) => {
    let transcript = "";
    for (let i = 0; i < event.results.length; i += 1) {
      transcript += event.results[i][0].transcript;
    }
    input.value = baseText + transcript;
  };

  instance.onerror = (event) => {
    isRecording.value = false;

    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      voiceError.value = "No se pudo acceder al micrófono. Revisa los permisos del navegador.";
    } else if (event.error === "no-speech") {
      voiceError.value = "No detecté ningún audio. Intenta de nuevo.";
    } else {
      voiceError.value = "Hubo un problema con el reconocimiento de voz.";
    }

    setTimeout(() => { voiceError.value = ""; }, 4000);
  };

  instance.onend = () => {
    isRecording.value = false;
  };

  return instance;
};

const toggleRecording = () => {
  if (!isVoiceSupported) return;

  if (!recognition) {
    recognition = createRecognition();
  }

  if (isRecording.value) {
    recognition.stop();
    return;
  }

  voiceError.value = "";
  // Conserva lo que ya estaba escrito (ej. si el usuario pausó a mitad de
  // la frase y vuelve a tocar el micrófono para continuar dictando).
  baseText = input.value ? `${input.value} ` : "";
  isRecording.value = true;

  try {
    recognition.start();
  } catch {
    // start() puede lanzar si ya estaba iniciado; se ignora, onend
    // eventualmente resetea el estado.
    isRecording.value = false;
  }
};

onBeforeUnmount(() => {
  if (recognition) {
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    recognition.stop();
  }
  if (pendingPreviewUrl.value) {
    URL.revokeObjectURL(pendingPreviewUrl.value);
  }
});
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
        >
          <span v-if="m.attachmentName" class="chat__attachment-chip">
            📎 {{ m.attachmentName }}
          </span>
          <template v-if="m.text">{{ m.text }}</template>
        </div>
      </div>

      <div v-if="loading" class="chat__row chat__row--assistant">
        <div class="chat__bubble chat__bubble--assistant chat__bubble--typing">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>

    <p v-if="voiceError" class="chat__voice-error">🎤 {{ voiceError }}</p>
    <p v-if="attachError" class="chat__voice-error">📎 {{ attachError }}</p>

    <div v-if="pendingAttachment" class="chat__attachment-preview">
      <img v-if="pendingPreviewUrl" :src="pendingPreviewUrl" alt="Vista previa" />
      <div v-else class="chat__attachment-preview-icon">📄</div>

      <div class="chat__attachment-preview-info">
        <strong>{{ pendingAttachment.name }}</strong>
        <span>{{ pendingAttachment.sizeLabel }}</span>
      </div>

      <button type="button" class="chat__attachment-remove" title="Quitar archivo" @click="removePendingAttachment">
        ✕
      </button>
    </div>

    <form class="chat__input-row" @submit.prevent="send">
      <input
        ref="fileInputRef"
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif,.heic,.heif,application/pdf"
        class="chat__file-input"
        @change="onFileSelected"
      />

      <button
        type="button"
        class="chat__attach"
        title="Adjuntar foto o PDF de factura"
        :disabled="isProcessingAttachment"
        @click="openFilePicker"
      >
        {{ isProcessingAttachment ? "⏳" : "📎" }}
      </button>

      <button
        v-if="isVoiceSupported"
        type="button"
        class="chat__mic"
        :class="{ 'chat__mic--recording': isRecording }"
        :title="isRecording ? 'Detener grabación' : 'Hablar en vez de escribir'"
        @click="toggleRecording"
      >
        {{ isRecording ? "⏹️" : "🎤" }}
      </button>

      <textarea
        ref="textareaRef"
        v-model="input"
        rows="1"
        :placeholder="isRecording ? 'Escuchando...' : 'Habla con el asistente'"
        :disabled="loading"
        @keydown="handleKeydown"
      ></textarea>

      <button
        type="submit"
        class="chat__send"
        :disabled="loading || (!input.trim() && !pendingAttachment)"
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

.chat__voice-error {
  padding: 8px 24px;
  font-size: 12.5px;
  color: #b91c1c;
  background: #fef2f2;
  border-top: 1px solid #fca5a5;
}

.chat__attachment-chip {
  display: block;
  font-size: 12px;
  font-weight: 600;
  opacity: 0.85;
  margin-bottom: 4px;
}

.chat__attachment-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.chat__attachment-preview img {
  width: 46px;
  height: 46px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #d1d5db;
}

.chat__attachment-preview-icon {
  width: 46px;
  height: 46px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.chat__attachment-preview-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chat__attachment-preview-info strong {
  font-size: 13px;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat__attachment-preview-info span {
  font-size: 12px;
  color: #6b7280;
}

.chat__attachment-remove {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid #d1d5db;
  background: white;
  color: #6b7280;
  cursor: pointer;
  flex-shrink: 0;
  transition: 0.2s;
}

.chat__attachment-remove:hover {
  border-color: #dc2626;
  color: #dc2626;
  background: #fef2f2;
}

.chat__file-input {
  display: none;
}

.chat__attach {
  width: 46px;
  height: 46px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: white;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
  flex-shrink: 0;
}

.chat__attach:hover:not(:disabled) {
  border-color: #2563eb;
  background: #eff6ff;
}

.chat__attach:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.chat__mic {
  width: 46px;
  height: 46px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: white;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
  flex-shrink: 0;
}

.chat__mic:hover {
  border-color: #2563eb;
  background: #eff6ff;
}

.chat__mic--recording {
  background: #dc2626;
  border-color: #dc2626;
  color: white;
  animation: chat-mic-pulse 1.4s infinite;
}

@keyframes chat-mic-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.45);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(220, 38, 38, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(220, 38, 38, 0);
  }
}

.chat__input-row {
  display: flex;
  align-items: flex-end;
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
  transition: height 0.15s ease, border-color 0.2s;
  overflow-y: auto;
  max-height: 160px;
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

.chat__mic {
  width: 42px;
  height: 42px;
}

.chat__attach {
  width: 42px;
  height: 42px;
}

}
</style>