import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useUser from "../../content/useUser";
import { loginUser } from "../../api/userApi";
import './login.css';

const UserLoginPage = () => {
  const { login } = useUser();
  const [inputEmail, setInputEmail] = useState("");
  const navigate = useNavigate();

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

      if (res.data.blocked) {
        alert(`🚫 You are blocked by Admin. Reason: ${res.data.reason}`);
        return;
      }

      const ip = res.data.ip || "unknown";
      login(inputEmail, ip);

      alert("✅ Login successful!");
      navigate("/user/dashboard");
    } catch (err) {
      alert("❌ Login failed. Please try again.");
      console.error("Login error:", err);
    }
  };

  return (
    <div className="user-login-wrapper">
      <div className="user-login-container">
        <h2>👤 Attacker Login</h2>
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
    </div>
  );
};

export default UserLoginPage;
