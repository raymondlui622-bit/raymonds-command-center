import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

const apiBaseUrl = "http://127.0.0.1:3001";

function App() {
  const [health, setHealth] = useState("checking");
  const [rawText, setRawText] = useState("");
  const [captures, setCaptures] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [reviewLaterResources, setReviewLaterResources] = useState([]);
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
    loadTasks();
    loadReviewLaterResources();
  }, []);

  async function loadCaptures() {
    const response = await fetch(`${apiBaseUrl}/raw-captures`);
    const data = await response.json();
    setCaptures(data.captures);
  }

  async function loadTasks() {
    const response = await fetch(`${apiBaseUrl}/tasks`);
    const data = await response.json();
    setTasks(data.tasks);
  }

  async function loadReviewLaterResources() {
    const response = await fetch(`${apiBaseUrl}/review-later`);
    const data = await response.json();
    setReviewLaterResources(data.resources);
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

  async function saveTask(event) {
    event.preventDefault();
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const response = await fetch(`${apiBaseUrl}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskPayloadFromFormData(formData)),
    });

    if (!response.ok) {
      setMessage("Task was not saved.");
      return;
    }

    event.currentTarget.reset();
    setMessage("Task saved.");
    await loadTasks();
  }

  async function updateTask(event, id) {
    event.preventDefault();
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const response = await fetch(`${apiBaseUrl}/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskPayloadFromFormData(formData)),
    });

    if (!response.ok) {
      setMessage("Task was not updated.");
      return;
    }

    setMessage("Task updated.");
    await loadTasks();
  }

  async function completeTask(id) {
    const response = await fetch(`${apiBaseUrl}/tasks/${id}/complete`, {
      method: "PATCH",
    });

    if (!response.ok) {
      setMessage("Task was not completed.");
      return;
    }

    setMessage("Task completed.");
    await loadTasks();
  }

  async function archiveTask(id) {
    const response = await fetch(`${apiBaseUrl}/tasks/${id}/archive`, {
      method: "PATCH",
    });

    if (!response.ok) {
      setMessage("Task was not archived.");
      return;
    }

    setMessage("Task archived.");
    await loadTasks();
  }

  async function saveReviewLaterResource(event) {
    event.preventDefault();
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const response = await fetch(`${apiBaseUrl}/review-later`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reviewLaterPayloadFromFormData(formData)),
    });

    if (!response.ok) {
      setMessage("Resource was not saved.");
      return;
    }

    event.currentTarget.reset();
    setMessage("Resource saved.");
    await loadReviewLaterResources();
  }

  async function updateReviewLaterResource(event, id) {
    event.preventDefault();
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const response = await fetch(`${apiBaseUrl}/review-later/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reviewLaterPayloadFromFormData(formData)),
    });

    if (!response.ok) {
      setMessage("Resource was not updated.");
      return;
    }

    setMessage("Resource updated.");
    await loadReviewLaterResources();
  }

  async function archiveReviewLaterResource(id) {
    const response = await fetch(`${apiBaseUrl}/review-later/${id}/archive`, {
      method: "PATCH",
    });

    if (!response.ok) {
      setMessage("Resource was not archived.");
      return;
    }

    setMessage("Resource archived.");
    await loadReviewLaterResources();
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

      <h1>Tasks</h1>
      <form onSubmit={saveTask}>
        <label htmlFor="task-title">Title</label>
        <input id="task-title" name="title" />

        <label htmlFor="task-status">Status</label>
        <select id="task-status" name="status" defaultValue="open">
          {taskStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <label htmlFor="task-priority">Priority</label>
        <input id="task-priority" name="priority" defaultValue="medium" />

        <label htmlFor="task-description">Description</label>
        <textarea id="task-description" name="description" rows="3" />

        <label htmlFor="task-waiting-on">Waiting on</label>
        <input id="task-waiting-on" name="waiting_on" />

        <label htmlFor="task-follow-up-date">Follow-up date</label>
        <input id="task-follow-up-date" name="follow_up_date" type="date" />

        <label htmlFor="task-last-contacted-at">Last contacted</label>
        <input id="task-last-contacted-at" name="last_contacted_at" type="date" />

        <label htmlFor="task-next-action">Next action</label>
        <input id="task-next-action" name="next_action" />

        <button type="submit">Save Task</button>
      </form>

      <h2>Task List</h2>
      {tasks.length === 0 ? (
        <p>No tasks yet.</p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <li key={task.id}>
              <form onSubmit={(event) => updateTask(event, task.id)}>
                <label htmlFor={`title-${task.id}`}>Title</label>
                <input id={`title-${task.id}`} name="title" defaultValue={task.title} />

                <label htmlFor={`status-${task.id}`}>Status</label>
                <select id={`status-${task.id}`} name="status" defaultValue={task.status}>
                  {taskStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                <label htmlFor={`priority-${task.id}`}>Priority</label>
                <input id={`priority-${task.id}`} name="priority" defaultValue={task.priority} />

                <label htmlFor={`description-${task.id}`}>Description</label>
                <textarea
                  id={`description-${task.id}`}
                  name="description"
                  rows="2"
                  defaultValue={task.description ?? ""}
                />

                <label htmlFor={`waiting-on-${task.id}`}>Waiting on</label>
                <input
                  id={`waiting-on-${task.id}`}
                  name="waiting_on"
                  defaultValue={task.waiting_on ?? ""}
                />

                <label htmlFor={`follow-up-date-${task.id}`}>Follow-up date</label>
                <input
                  id={`follow-up-date-${task.id}`}
                  name="follow_up_date"
                  type="date"
                  defaultValue={task.follow_up_date ?? ""}
                />

                <label htmlFor={`last-contacted-at-${task.id}`}>Last contacted</label>
                <input
                  id={`last-contacted-at-${task.id}`}
                  name="last_contacted_at"
                  type="date"
                  defaultValue={task.last_contacted_at ?? ""}
                />

                <label htmlFor={`next-action-${task.id}`}>Next action</label>
                <input
                  id={`next-action-${task.id}`}
                  name="next_action"
                  defaultValue={task.next_action ?? ""}
                />

                <button type="submit">Update</button>
                {task.status !== "done" && task.status !== "archived" ? (
                  <button type="button" onClick={() => completeTask(task.id)}>
                    Complete
                  </button>
                ) : null}
                {task.status !== "archived" ? (
                  <button type="button" onClick={() => archiveTask(task.id)}>
                    Archive
                  </button>
                ) : null}
              </form>
            </li>
          ))}
        </ul>
      )}

      <h1>Review Later</h1>
      <form onSubmit={saveReviewLaterResource}>
        <label htmlFor="resource-title">Title</label>
        <input id="resource-title" name="title" />

        <label htmlFor="resource-type">Type</label>
        <input id="resource-type" name="resource_type" />

        <label htmlFor="resource-url-or-location">URL or location</label>
        <input id="resource-url-or-location" name="url_or_location" />

        <label htmlFor="resource-why-it-matters">Why it matters</label>
        <textarea id="resource-why-it-matters" name="why_it_matters" rows="3" />

        <label htmlFor="resource-possible-use">Possible use</label>
        <input id="resource-possible-use" name="possible_use" />

        <label htmlFor="resource-tags">Tags</label>
        <input id="resource-tags" name="tags" />

        <button type="submit">Save Resource</button>
      </form>

      <h2>Review Later List</h2>
      {reviewLaterResources.length === 0 ? (
        <p>No resources yet.</p>
      ) : (
        <ul>
          {reviewLaterResources.map((resource) => (
            <li key={resource.id}>
              <form onSubmit={(event) => updateReviewLaterResource(event, resource.id)}>
                <label htmlFor={`resource-title-${resource.id}`}>Title</label>
                <input
                  id={`resource-title-${resource.id}`}
                  name="title"
                  defaultValue={resource.title}
                />

                <label htmlFor={`resource-type-${resource.id}`}>Type</label>
                <input
                  id={`resource-type-${resource.id}`}
                  name="resource_type"
                  defaultValue={resource.resource_type}
                />

                <label htmlFor={`resource-status-${resource.id}`}>Status</label>
                <select
                  id={`resource-status-${resource.id}`}
                  name="status"
                  defaultValue={resource.status}
                >
                  {reviewLaterStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                <label htmlFor={`resource-url-or-location-${resource.id}`}>URL or location</label>
                <input
                  id={`resource-url-or-location-${resource.id}`}
                  name="url_or_location"
                  defaultValue={resource.url_or_location ?? ""}
                />

                <label htmlFor={`resource-why-it-matters-${resource.id}`}>Why it matters</label>
                <textarea
                  id={`resource-why-it-matters-${resource.id}`}
                  name="why_it_matters"
                  rows="2"
                  defaultValue={resource.why_it_matters}
                />

                <label htmlFor={`resource-related-project-${resource.id}`}>Related project id</label>
                <input
                  id={`resource-related-project-${resource.id}`}
                  name="related_project_id"
                  defaultValue={resource.related_project_id ?? ""}
                />

                <label htmlFor={`resource-possible-use-${resource.id}`}>Possible use</label>
                <input
                  id={`resource-possible-use-${resource.id}`}
                  name="possible_use"
                  defaultValue={resource.possible_use ?? ""}
                />

                <label htmlFor={`resource-notes-${resource.id}`}>Notes</label>
                <textarea
                  id={`resource-notes-${resource.id}`}
                  name="notes"
                  rows="2"
                  defaultValue={resource.notes ?? ""}
                />

                <label htmlFor={`resource-tags-${resource.id}`}>Tags</label>
                <input
                  id={`resource-tags-${resource.id}`}
                  name="tags"
                  defaultValue={resource.tags ?? ""}
                />

                <button type="submit">Update</button>
                {resource.status !== "archived" ? (
                  <button type="button" onClick={() => archiveReviewLaterResource(resource.id)}>
                    Archive
                  </button>
                ) : null}
              </form>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

const taskStatuses = ["open", "in_progress", "waiting", "blocked", "done", "archived"];
const reviewLaterStatuses = [
  "new",
  "reviewing",
  "useful",
  "turned_into_task",
  "reference",
  "dismissed",
  "archived",
];

function taskPayloadFromFormData(formData) {
  return {
    title: formData.get("title"),
    status: formData.get("status"),
    priority: formData.get("priority"),
    description: formData.get("description"),
    waiting_on: formData.get("waiting_on"),
    follow_up_date: formData.get("follow_up_date"),
    last_contacted_at: formData.get("last_contacted_at"),
    next_action: formData.get("next_action"),
  };
}

function reviewLaterPayloadFromFormData(formData) {
  return {
    title: formData.get("title"),
    resource_type: formData.get("resource_type"),
    why_it_matters: formData.get("why_it_matters"),
    status: formData.get("status") || undefined,
    url_or_location: formData.get("url_or_location"),
    related_project_id: formData.get("related_project_id"),
    possible_use: formData.get("possible_use"),
    notes: formData.get("notes"),
    tags: formData.get("tags"),
  };
}

createRoot(document.getElementById("root")).render(React.createElement(App));
