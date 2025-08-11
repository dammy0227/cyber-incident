// /api/userApi.js
import axios from "axios";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

export const loginUser = async (user) => {
  return axios.post(`${BASE_URL}/events/login`, { user });
};

export const uploadFile = async (user, file) => {
  const formData = new FormData();
  formData.append("user", user);
  formData.append("file", file);

  return axios.post(`${BASE_URL}/events/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const changeRole = async (user, oldRole, newRole) => {
  return axios.post(`${BASE_URL}/events/role-change`, { user, oldRole, newRole });
};
