import api from "../utils/api";

const paymentService = {
  generateQR: async (amount, orderId) => {
    const { data } = await api.post("/payment/generate-qr", { amount, orderId });
    return data;
  },
  verifyPayment: async (paymentData) => {
    const { data } = await api.post("/payment/verify", paymentData);
    return data;
  },
};

export default paymentService;
