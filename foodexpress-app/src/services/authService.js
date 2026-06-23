import api from "../utils/api";

const authService = {
  login: async (credentials) => {
    const { data } = await api.post("/auth/login", credentials);
    return data;
  },
  register: async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    return data;
  },
  forgotPassword: async (email) => {
    const { data } = await api.post("/auth/forgot-password", { email });
    return data;
  },
};

export default authService;
