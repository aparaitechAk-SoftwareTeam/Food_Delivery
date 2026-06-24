import api from "../utils/api";

const bannerService = {
  getBanners: async () => {
    const { data } = await api.get("/banners");
    return data;
  },
};

export default bannerService;
