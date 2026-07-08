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
  verifyOtp: async (email, otp) => {
    const { data } = await api.post("/auth/verify-otp", { email, otp });
    return data;
  },
  resetPassword: async (email, otp, password) => {
    const { data } = await api.post("/auth/reset-password", { email, otp, password });
    return data;
  },
  logout: async () => {
    const { data } = await api.post("/auth/logout");
    return data;
  },
};

export default authService;
