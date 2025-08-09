import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAdmin from "../../content/useAdmin";
import { loginAdmin } from "../../api/adminApi";

const AdminLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAdmin();
  const navigate = useNavigate(); // ✅ For redirect

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await loginAdmin(email, password);
      login(res.data.token);

      alert("✅ Admin logged in.");
      navigate("/admin/dashboard"); // ✅ Redirect after login

      // Clear form
      setEmail("");
      setPassword("");
    } catch (err) {
      alert("❌ Login failed. Please check your credentials.");
      console.error(err);
    }
  };

  return (
    <div className="admin-login-container">
      <h2>🔐 Admin Login</h2>
      <form onSubmit={handleSubmit} className="admin-login-form">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="login-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="login-input"
        />
        <button type="submit" className="login-button">Login</button>
      </form>
    </div>
  );
};

export default AdminLoginPage;
