import axios from "axios";

// configuro axios para no tener que repetir la URL base ni los headers en cada peticion
const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",  // toma la url de la variable de entorno, si no esta asume que corre localmente en el 3000
  headers: {
    "Content-Type": "application/json",
  },
});

// intercepto la peticion de salida: antes de mandarla al backend, le inyecto el token JWT en el header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;  // asi el backend reconoce al usuario autenticado
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// intercepto la respuesta de entrada: atajo lo que me devuelve el backend antes de mandarlo al componente
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // si el error viene de la ruta de login, lo dejo pasar porque es esperado si ponen mal la clave
    const isLoginEndpoint =
      err.config &&
      err.config.url &&
      err.config.url.includes("/auth/login");

    // si recibo un 401 (No autorizado) en cualquier otra ruta, el token vencio o es invalido
    if (err.response?.status === 401 && !isLoginEndpoint) {
      localStorage.removeItem("token");  // borro las credenciales locales
      localStorage.removeItem("user");
      window.location.href = "/login";  // redirijo forzosamente a la pantalla de login
    }

    return Promise.reject(err);
  }
);

export default api;