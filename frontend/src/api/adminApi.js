// src/api/useAdminApi.js
import axios from "axios";
import useAdmin from "../content/useAdmin";

const useAdminApi = () => {
  const { token } = useAdmin();

  const axiosInstance = axios.create({
    baseURL: `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api`,
  });

  axiosInstance.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return {
    loginAdmin: (email, password) =>
      axiosInstance.post("/auth/login", { email, password }),

    fetchIncidents: () =>
      axiosInstance.get("/admin/incidents"),

    getBlockedIPs: () =>
      axiosInstance.get("/admin/blocked-ips"),

    blockIP: (ip) =>
      axiosInstance.post("/admin/block-ip", { ip }),

    unblockIP: (ip) =>
      axiosInstance.post("/admin/unblock-ip", { ip }),

    getTrustedIPs: (user = "") =>
      axiosInstance.get("/admin/trusted-ips", { params: { user } }),

    addTrustedIP: (user, ip, restrictions = {}) =>
      axiosInstance.post("/admin/add-trusted-ip", { user, ip, ...restrictions }),

    removeTrustedIP: (user, ip) =>
      axiosInstance.post("/admin/remove-trusted-ip", { user, ip }),
  };
};

export default useAdminApi;
