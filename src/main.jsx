import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

function App() {
  const [health, setHealth] = useState("checking");

  useEffect(() => {
    fetch("http://127.0.0.1:3001/health")
      .then((response) => response.json())
      .then((data) => {
        setHealth(data.ok && data.sqlite === "connected" ? "ready" : "unhealthy");
      })
      .catch(() => setHealth("backend unavailable"));
  }, []);

  return React.createElement("main", null, `Command Center foundation: ${health}`);
}

createRoot(document.getElementById("root")).render(React.createElement(App));
