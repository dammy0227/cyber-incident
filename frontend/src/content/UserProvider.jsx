import React, { useState, useEffect } from "react";
import UserContext from "./UserContext";

const UserProvider = ({ children }) => {
  const [ip, setIP] = useState(null);
  const [email, setEmail] = useState(null);

  // ✅ Load from localStorage on component mount
  useEffect(() => {
    const storedEmail = localStorage.getItem("email");
    const storedIP = localStorage.getItem("ip");
    
  console.log("🔁 Restoring from localStorage:", storedEmail, storedIP);
    if (storedEmail) setEmail(storedEmail);
    if (storedIP) setIP(storedIP);
  }, []);

  // ✅ Save to state and localStorage
  const login = (userEmail, newIP) => {
    setEmail(userEmail);
    setIP(newIP);
    localStorage.setItem("email", userEmail);
    localStorage.setItem("ip", newIP);
  };

  return (
    <UserContext.Provider value={{ ip, email, login }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
