import api from "../utils/api";

const wishlistService = {
  getWishlist: async () => {
    const { data } = await api.get("/wishlist");
    return data;
  },
  addToWishlist: async (foodId) => {
    const { data } = await api.post("/wishlist/add", { productId: foodId });
    return data;
  },
  removeFromWishlist: async (foodId) => {
    const { data } = await api.delete(`/wishlist/remove/${foodId}`);
    return data;
  },
};

export default wishlistService;
