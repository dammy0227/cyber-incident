// /api/adminApi.js
import axios from "axios";

// Always append `/api` here so it's consistent between dev & prod
const BASE_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api`;

export const loginAdmin = async (email, password) => {
  return axios.post(`${BASE_URL}/auth/login`, { email, password });
};

export const fetchIncidents = async () => {
  return axios.get(`${BASE_URL}/admin/incidents`);
};

export const getBlockedIPs = async () => {
  return axios.get(`${BASE_URL}/admin/blocked-ips`);
};

export const blockIP = async (ip) => {
  return axios.post(`${BASE_URL}/admin/block-ip`, { ip });
};

export const unblockIP = async (ip) => {
  return axios.post(`${BASE_URL}/admin/unblock-ip`, { ip });
};

export const getTrustedIPs = async (user = "") => {
  return axios.get(`${BASE_URL}/admin/trusted-ips`, { params: { user } });
};

export const addTrustedIP = async (user, ip) => {
  return axios.post(`${BASE_URL}/admin/add-trusted-ip`, { user, ip });
};

export const removeTrustedIP = async (user, ip) => {
  return axios.post(`${BASE_URL}/admin/remove-trusted-ip`, { user, ip });
};
