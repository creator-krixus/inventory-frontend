import api from "./api";

export const sendMessage = (message, history = []) =>
  api.post("/agent/chat", { message, history });