import api from "../utils/api";

const userService = {
  getProfile: async () => {
    const { data } = await api.get("/user/profile");
    return data;
  },
  updateProfile: async (payload) => {
    const { data } = await api.put("/user/profile", payload);
    return data;
  },
  getAddresses: async () => {
    const { data } = await api.get("/user/addresses");
    return data;
  },
  addAddress: async (address) => {
    const { data } = await api.post("/user/address", address);
    return data;
  },
  setDefaultAddress: async (addressId) => {
    const { data } = await api.put(`/user/addresses/${addressId}/default`);
    return data;
  },
  updateAddress: async (addressId, address) => {
    const { data } = await api.put(`/user/addresses/${addressId}`, address);
    return data;
  },
  deleteAddress: async (addressId) => {
    const { data } = await api.delete(`/user/addresses/${addressId}`);
    return data;
  },
};

export default userService;
