import api from "./api";

export const sendMessage = (message, history = [], attachment = null) =>
  api.post("/agent/chat", { message, history, attachment });