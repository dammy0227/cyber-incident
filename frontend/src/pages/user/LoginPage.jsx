import React, { useState } from "react";
import useUser from "../../content/useUser";
import { loginUser } from "../../api/userApi";
import './dashboards.css';

const UserLoginPage = () => {
  const { login } = useUser();
  const [inputEmail, setInputEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputEmail.trim()) {
      alert("Please enter your email.");
      return;
    }

    try {
      console.log("Attempting login for:", inputEmail);
      const res = await loginUser(inputEmail);
      console.log("Response data:", res.data);

      alert(res.data.message || "No message from server");

      if (res.data.restricted) {
        return; // Stop if restricted
      }

      const ip = res.data.ip || "unknown";
      login(inputEmail, ip);
      setInputEmail(""); // Clear input field

    } catch (err) {
      alert("❌ Login failed. Please try again.");
      console.error("Login error:", err);
    }
  };

  return (
    <div className="user-login-container">
      <h2>👤 User Login</h2>
      <form onSubmit={handleSubmit} className="user-login-form">
        <input
          type="email"
          placeholder="Your email"
          value={inputEmail}
          onChange={(e) => setInputEmail(e.target.value)}
          className="login-input"
          required
        />
        <button type="submit" className="login-button">Login</button>
      </form>
    </div>
  );
};

export default UserLoginPage;
