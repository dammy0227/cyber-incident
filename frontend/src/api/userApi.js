// /api/userApi.js
import axios from "axios";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

export const loginUser = async (user) => {
  
  console.log("Sending login request for user:", user);
  return axios.post(`${BASE_URL}/events/login`, { user }, { withCredentials: true });
};

export const uploadFile = async (email, file) => {
  const formData = new FormData();
  formData.append("user", email);
  formData.append("file", file);

  return axios.post(`${BASE_URL}/events/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    withCredentials: true,  // add if your backend expects credentials
  });
};

export const changeRole = async (email, oldRole, newRole) => {
  return axios.post(`${BASE_URL}/events/role-change`, { user: email, oldRole, newRole }, { withCredentials: true });
};
