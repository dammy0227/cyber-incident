import React, { useState, useEffect } from "react";
import UserContext from "./UserContext";

const UserProvider = ({ children }) => {
  const [ip, setIP] = useState(null);
  const [email, setEmail] = useState(null);

  useEffect(() => {
    const storedEmail = localStorage.getItem("email");
    const storedIP = localStorage.getItem("ip");

    console.log("🔁 Restoring from localStorage:", storedEmail, storedIP);
    if (storedEmail) setEmail(storedEmail);
    if (storedIP && storedIP !== "") setIP(storedIP);
  }, []);

  const login = (userEmail, newIP) => {
    setEmail(userEmail);
    setIP(newIP || ""); // Store empty string if no IP
    localStorage.setItem("email", userEmail);
    localStorage.setItem("ip", newIP || "");
  };

  const logout = () => {
    setEmail(null);
    setIP(null);
    localStorage.removeItem("email");
    localStorage.removeItem("ip");
  };

  return (
    <UserContext.Provider value={{ ip, email, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
