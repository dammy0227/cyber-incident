// /api/userApi.js
import axios from "axios";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

export const loginUser = async (user) => {
  return axios.post(`${BASE_URL}/events/login`, { user });
};

export const uploadFile = async (email, file) => {
  const formData = new FormData();
  formData.append("user", email); // clearer param name
  formData.append("file", file);

  return axios.post(`${BASE_URL}/events/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const changeRole = async (email, oldRole, newRole) => {
  return axios.post(`${BASE_URL}/events/role-change`, { user: email, oldRole, newRole });
};
