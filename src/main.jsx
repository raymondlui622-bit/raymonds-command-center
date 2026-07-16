import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

const apiBaseUrl = "http://127.0.0.1:3001";

function App() {
  const [health, setHealth] = useState("checking");
  const [rawText, setRawText] = useState("");
  const [captures, setCaptures] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`${apiBaseUrl}/health`)
      .then((response) => response.json())
      .then((data) => {
        setHealth(data.ok && data.sqlite === "connected" ? "ready" : "unhealthy");
      })
      .catch(() => setHealth("backend unavailable"));
  }, []);

  useEffect(() => {
    loadCaptures();
  }, []);

  async function loadCaptures() {
    const response = await fetch(`${apiBaseUrl}/raw-captures`);
    const data = await response.json();
    setCaptures(data.captures);
  }

  async function saveCapture(event) {
    event.preventDefault();
    setMessage("");

    const response = await fetch(`${apiBaseUrl}/raw-captures`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raw_text: rawText }),
    });

    if (!response.ok) {
      setMessage("Capture was not saved.");
      return;
    }

    setRawText("");
    setMessage("Capture saved.");
    await loadCaptures();
  }

  async function archiveCapture(id) {
    const response = await fetch(`${apiBaseUrl}/raw-captures/${id}/archive`, {
      method: "PATCH",
    });

    if (!response.ok) {
      setMessage("Capture was not archived.");
      return;
    }

    setMessage("Capture archived.");
    await loadCaptures();
  }

  return (
    <main>
      <h1>Raw Capture</h1>
      <p>Backend: {health}</p>

      <form onSubmit={saveCapture}>
        <label htmlFor="raw-capture">Capture</label>
        <textarea
          id="raw-capture"
          rows="6"
          value={rawText}
          onChange={(event) => setRawText(event.target.value)}
        />
        <button type="submit">Save Capture</button>
      </form>

      {message ? <p>{message}</p> : null}

      <h2>Captures</h2>
      {captures.length === 0 ? (
        <p>No captures yet.</p>
      ) : (
        <ul>
          {captures.map((capture) => (
            <li key={capture.id}>
              <pre>{capture.raw_text}</pre>
              <p>Status: {capture.status}</p>
              {capture.status !== "archived" ? (
                <button type="button" onClick={() => archiveCapture(capture.id)}>
                  Archive
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")).render(React.createElement(App));
