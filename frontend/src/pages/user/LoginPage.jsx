import React, { useState } from "react";
import useUser from "../../content/useUser";
import { loginUser } from "../../api/userApi";
import './dashboards.css';

const UserLoginPage = () => {
  const [email, setEmail] = useState("");
  const { login } = useUser();

const handleSubmit = async (e) => {
  e.preventDefault();
  console.log("handleSubmit called");
  if (!email.trim()) {
    alert("Please enter your email.");
    return;
  }

  try {
    console.log("Attempting login for:", email);
    const res = await loginUser(email);
    console.log("Response data:", res.data);

    alert(res.data.message || "No message from server");

    if (res.data.restricted) {
      alert(res.data.message);
      return;
    }

    const ip = res.data.ip || "unknown";
    login(email, ip);
    console.log("User logged in:", email, ip);

    setEmail("");
    console.log("Email state after clear:", email); // should be empty string here

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
