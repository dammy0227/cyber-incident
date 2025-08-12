import React, { useEffect } from "react";

const TestCors = () => {
  useEffect(() => {
    fetch("https://cyber-incident.onrender.com/api/test-cors", { credentials: "include" })
      .then(res => res.json())
      .then(data => console.log("Test CORS response:", data))
      .catch(err => console.error("Test CORS error:", err));
  }, []);

  return <div>Check your console for CORS test result</div>;
};

export default TestCors;
