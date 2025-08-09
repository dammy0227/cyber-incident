// src/pages/user/UserLoginPage.jsx
import React, { useState } from "react";
import useUser from "../../content/useUser";
import { loginUser } from "../../api/userApi";
import './dashboards.css';

const UserLoginPage = () => {
  const [email, setEmail] = useState("");
  const { login } = useUser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      alert("Please enter your email.");
      return;
    }

    try {
      const res = await loginUser(email);

      if (res.data.restricted) {
        alert(res.data.message);
        return;
      }

      const ip = res.data.ip || "unknown";
      login(email, ip);
      alert("✅ User login simulated successfully.");
      setEmail("");
    } catch (err) {
      alert("❌ Login failed. Please try again.");
      console.error(err);
    }
  };

  return (
    <div className="user-login-container">
      <h2>👤 User Login</h2>
      <form onSubmit={handleSubmit} className="user-login-form">
        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="login-input"
          required
        />
        <button type="submit" className="login-button">Login</button>
      </form>
    </div>
  );
};

export default UserLoginPage;
