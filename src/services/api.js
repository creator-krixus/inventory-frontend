import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {

  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Si el token expiró o es inválido, el backend responde 401. Sin esto,
// cualquier request (productos, chat del agente, etc.) fallaría en
// silencio y el usuario quedaría "trabado" sin saber por qué.
// Nota: se evita importar el router o el store de Pinia aquí a propósito,
// para no crear una dependencia circular (api.js es usado por servicios
// que a su vez son usados por vistas que el router carga). Se limpia el
// storage y se redirige con window.location, que funciona igual bien
// fuera del árbol de componentes de Vue.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== "/login") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;