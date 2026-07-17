import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  MorningBriefSection,
  SearchSection,
  ExportSection,
  RawCaptureSection,
  TasksSection,
  ReviewLaterSection,
  ArsenalSection,
  PromptLibrarySection,
  ProjectsSection,
} from "./sections.jsx";

const apiBaseUrl = "http://127.0.0.1:3001";

function App() {
  const [health, setHealth] = useState("checking");
  const [rawText, setRawText] = useState("");
  const [captures, setCaptures] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [reviewLaterResources, setReviewLaterResources] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectUpdates, setProjectUpdates] = useState({});
  const [resumeSummaryByProject, setResumeSummaryByProject] = useState({});
  const [arsenalItems, setArsenalItems] = useState([]);
  const [promptLibraryItems, setPromptLibraryItems] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [classificationByCapture, setClassificationByCapture] = useState({});
  const [morningBrief, setMorningBrief] = useState(null);
  const [morningBriefStatus, setMorningBriefStatus] = useState("idle");
  const [showAllRequiresRaymond, setShowAllRequiresRaymond] = useState(false);
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
    loadProjects();
    loadArsenalItems();
    loadPromptLibraryItems();
    loadLatestMorningBrief();
  }, []);

  async function loadLatestMorningBrief() {
    const response = await fetch(`${apiBaseUrl}/morning-brief/latest`);
    const data = await response.json();
    setMorningBrief(data.brief_batch_id ? data : null);
  }

  async function generateMorningBrief() {
    setMorningBriefStatus("loading");
    setShowAllRequiresRaymond(false);

    const response = await fetch(`${apiBaseUrl}/morning-brief`, { method: "POST" });
    if (!response.ok) {
      setMorningBriefStatus("error");
      return;
    }

    const data = await response.json();
    setMorningBrief(data);
    setMorningBriefStatus("idle");
  }

  async function reviewMorningBriefItem(itemId, reviewStatus, section) {
    const response = await fetch(`${apiBaseUrl}/morning-brief-items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ review_status: reviewStatus, section }),
    });

    if (!response.ok) {
      setMessage("Morning Brief item was not updated.");
      return;
    }

    const data = await response.json();
    setMorningBrief((current) => {
      if (!current) {
        return current;
      }
      const items = { ...current.items };
      for (const key of Object.keys(items)) {
        items[key] = items[key].filter((item) => item.id !== itemId);
      }
      items[data.item.section] = [...items[data.item.section], data.item];
      return { ...current, items };
    });
  }

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

  async function loadProjects() {
    const response = await fetch(`${apiBaseUrl}/projects`);
    const data = await response.json();
    setProjects(data.projects);
    await Promise.all(data.projects.map((project) => loadProjectUpdates(project.id)));
  }

  async function loadProjectUpdates(projectId) {
    const response = await fetch(`${apiBaseUrl}/projects/${projectId}/updates`);
    const data = await response.json();
    setProjectUpdates((current) => ({ ...current, [projectId]: data.updates }));
  }

  async function loadArsenalItems() {
    const response = await fetch(`${apiBaseUrl}/arsenal`);
    const data = await response.json();
    setArsenalItems(data.items);
  }

  async function loadPromptLibraryItems() {
    const response = await fetch(`${apiBaseUrl}/prompts`);
    const data = await response.json();
    setPromptLibraryItems(data.prompts);
  }

  async function search(event) {
    event.preventDefault();
    setMessage("");

    const params = new URLSearchParams();
    const formData = new FormData(event.currentTarget);
    for (const field of ["q", "status", "related_project_id", "record_type"]) {
      const value = formData.get(field);
      if (value) {
        params.set(field, value);
      }
    }

    const response = await fetch(`${apiBaseUrl}/search?${params.toString()}`);
    if (!response.ok) {
      setMessage("Search failed.");
      return;
    }

    const data = await response.json();
    setSearchResults(data.results);
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

  async function saveProject(event) {
    event.preventDefault();
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const response = await fetch(`${apiBaseUrl}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(projectPayloadFromFormData(formData)),
    });

    if (!response.ok) {
      setMessage("Project was not saved.");
      return;
    }

    event.currentTarget.reset();
    setMessage("Project saved.");
    await loadProjects();
  }

  async function updateProject(event, id) {
    event.preventDefault();
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const response = await fetch(`${apiBaseUrl}/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(projectPayloadFromFormData(formData)),
    });

    if (!response.ok) {
      setMessage("Project was not updated.");
      return;
    }

    setMessage("Project updated.");
    await loadProjects();
  }

  async function archiveProject(id) {
    const response = await fetch(`${apiBaseUrl}/projects/${id}/archive`, {
      method: "PATCH",
    });

    if (!response.ok) {
      setMessage("Project was not archived.");
      return;
    }

    setMessage("Project archived.");
    await loadProjects();
  }

  async function saveProjectUpdate(event, projectId) {
    event.preventDefault();
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const response = await fetch(`${apiBaseUrl}/projects/${projectId}/updates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(projectUpdatePayloadFromFormData(formData)),
    });

    if (!response.ok) {
      setMessage("Project update was not saved.");
      return;
    }

    event.currentTarget.reset();
    setMessage("Project update saved.");
    await loadProjectUpdates(projectId);
  }

  async function requestResumeSummary(projectId) {
    setResumeSummaryByProject((current) => ({
      ...current,
      [projectId]: { status: "loading" },
    }));

    const response = await fetch(`${apiBaseUrl}/projects/${projectId}/resume-summary`, {
      method: "POST",
    });
    const data = await response.json();

    if (!response.ok) {
      setResumeSummaryByProject((current) => ({
        ...current,
        [projectId]: {
          status: response.status === 409 ? "not_eligible" : "error",
        },
      }));
      return;
    }

    setResumeSummaryByProject((current) => ({
      ...current,
      [projectId]: { status: "ready", summary: data },
    }));
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

  async function saveArsenalItem(event) {
    event.preventDefault();
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const response = await fetch(`${apiBaseUrl}/arsenal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(arsenalPayloadFromFormData(formData)),
    });

    if (!response.ok) {
      setMessage("Arsenal item was not saved.");
      return;
    }

    event.currentTarget.reset();
    setMessage("Arsenal item saved.");
    await loadArsenalItems();
  }

  async function updateArsenalItem(event, id) {
    event.preventDefault();
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const response = await fetch(`${apiBaseUrl}/arsenal/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(arsenalPayloadFromFormData(formData)),
    });

    if (!response.ok) {
      setMessage("Arsenal item was not updated.");
      return;
    }

    setMessage("Arsenal item updated.");
    await loadArsenalItems();
  }

  async function archiveArsenalItem(id) {
    const response = await fetch(`${apiBaseUrl}/arsenal/${id}/archive`, {
      method: "PATCH",
    });

    if (!response.ok) {
      setMessage("Arsenal item was not archived.");
      return;
    }

    setMessage("Arsenal item archived.");
    await loadArsenalItems();
  }

  async function savePromptLibraryItem(event) {
    event.preventDefault();
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const response = await fetch(`${apiBaseUrl}/prompts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(promptLibraryPayloadFromFormData(formData)),
    });

    if (!response.ok) {
      setMessage("Prompt was not saved.");
      return;
    }

    event.currentTarget.reset();
    setMessage("Prompt saved.");
    await loadPromptLibraryItems();
  }

  async function updatePromptLibraryItem(event, id) {
    event.preventDefault();
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const response = await fetch(`${apiBaseUrl}/prompts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(promptLibraryPayloadFromFormData(formData)),
    });

    if (!response.ok) {
      setMessage("Prompt was not updated.");
      return;
    }

    setMessage("Prompt updated.");
    await loadPromptLibraryItems();
  }

  async function setPromptFavorite(id, isFavorite) {
    const response = await fetch(`${apiBaseUrl}/prompts/${id}/favorite`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_favorite: isFavorite ? 1 : 0 }),
    });

    if (!response.ok) {
      setMessage("Prompt favorite was not updated.");
      return;
    }

    setMessage(isFavorite ? "Prompt favorited." : "Prompt unfavorited.");
    await loadPromptLibraryItems();
  }

  async function archivePromptLibraryItem(id) {
    const response = await fetch(`${apiBaseUrl}/prompts/${id}/archive`, {
      method: "PATCH",
    });

    if (!response.ok) {
      setMessage("Prompt was not archived.");
      return;
    }

    setMessage("Prompt archived.");
    await loadPromptLibraryItems();
  }

  async function copyPrompt(fullPrompt) {
    await navigator.clipboard.writeText(fullPrompt);
    setMessage("Prompt copied.");
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

  async function requestClassification(captureId) {
    setMessage("");
    setClassificationByCapture((current) => ({
      ...current,
      [captureId]: { status: "loading" },
    }));

    const response = await fetch(`${apiBaseUrl}/raw-captures/${captureId}/classification-suggestion`, {
      method: "POST",
    });
    const data = await response.json();

    if (!response.ok) {
      setClassificationByCapture((current) => ({
        ...current,
        [captureId]: {
          status: response.status === 503 ? "unavailable" : "error",
          error: data.error ?? "classification_failed",
        },
      }));
      return;
    }

    setClassificationByCapture((current) => ({
      ...current,
      [captureId]: { status: "suggested", suggestion: data.suggestion },
    }));
  }

  async function acceptClassification(event, captureId, suggestion) {
    event.preventDefault();
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      acceptance_id: suggestion.acceptance_id,
      proposed_record_type: suggestion.proposed_record_type,
      values:
        suggestion.proposed_record_type === "task"
          ? taskClassificationPayloadFromFormData(formData)
          : reviewLaterClassificationPayloadFromFormData(formData),
    };

    setClassificationByCapture((current) => ({
      ...current,
      [captureId]: { ...current[captureId], status: "accepting" },
    }));

    const response = await fetch(
      `${apiBaseUrl}/raw-captures/${captureId}/classification-suggestion/accept`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const data = await response.json();

    if (!response.ok) {
      setClassificationByCapture((current) => ({
        ...current,
        [captureId]: { ...current[captureId], status: "suggested", error: "accept_failed" },
      }));
      return;
    }

    setClassificationByCapture((current) => ({
      ...current,
      [captureId]: {
        ...current[captureId],
        status: "accepted",
        created: data.created,
        record_type: data.record_type,
      },
    }));
    setMessage(data.created ? "Classification accepted." : "Classification already accepted.");
    await Promise.all([loadTasks(), loadReviewLaterResources()]);
  }

  async function rejectClassification(captureId) {
    const response = await fetch(
      `${apiBaseUrl}/raw-captures/${captureId}/classification-suggestion/reject`,
      { method: "POST" },
    );

    if (!response.ok) {
      setMessage("Classification was not rejected.");
      return;
    }

    setClassificationByCapture((current) => ({
      ...current,
      [captureId]: { status: "rejected" },
    }));
    setMessage("Classification rejected.");
  }

  async function recordClassificationCorrection(event, captureId, suggestion) {
    event.preventDefault();
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const correctedRecordType = formData.get("corrected_record_type");
    const correctedValues =
      correctedRecordType === "task"
        ? taskClassificationPayloadFromFormData(formData)
        : reviewLaterClassificationPayloadFromFormData(formData);

    const response = await fetch(`${apiBaseUrl}/raw-captures/${captureId}/classification-corrections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        suggested_record_type: suggestion.proposed_record_type,
        corrected_record_type: correctedRecordType,
        original_suggestion: suggestion,
        corrected_values: correctedValues,
        correction_note: formData.get("correction_note"),
      }),
    });

    if (!response.ok) {
      setMessage("Correction was not recorded.");
      return;
    }

    setMessage("Correction recorded.");
  }

  return (
    <main>
      <MorningBriefSection
        morningBrief={morningBrief}
        morningBriefStatus={morningBriefStatus}
        showAllRequiresRaymond={showAllRequiresRaymond}
        onGenerate={generateMorningBrief}
        onToggleShowAllRequiresRaymond={() => setShowAllRequiresRaymond((current) => !current)}
        onReviewItem={reviewMorningBriefItem}
      />

      <SearchSection onSearch={search} searchResults={searchResults} />

      <ExportSection apiBaseUrl={apiBaseUrl} />

      <RawCaptureSection
        health={health}
        rawText={rawText}
        onRawTextChange={setRawText}
        onSaveCapture={saveCapture}
        message={message}
        captures={captures}
        classificationByCapture={classificationByCapture}
        onRequestClassification={requestClassification}
        onAcceptClassification={acceptClassification}
        onRejectClassification={rejectClassification}
        onRecordClassificationCorrection={recordClassificationCorrection}
        onArchiveCapture={archiveCapture}
      />

      <TasksSection
        tasks={tasks}
        onSaveTask={saveTask}
        onUpdateTask={updateTask}
        onCompleteTask={completeTask}
        onArchiveTask={archiveTask}
      />

      <ReviewLaterSection
        reviewLaterResources={reviewLaterResources}
        onSaveReviewLaterResource={saveReviewLaterResource}
        onUpdateReviewLaterResource={updateReviewLaterResource}
        onArchiveReviewLaterResource={archiveReviewLaterResource}
      />

      <ArsenalSection
        arsenalItems={arsenalItems}
        onSaveArsenalItem={saveArsenalItem}
        onUpdateArsenalItem={updateArsenalItem}
        onArchiveArsenalItem={archiveArsenalItem}
      />

      <PromptLibrarySection
        promptLibraryItems={promptLibraryItems}
        onSavePromptLibraryItem={savePromptLibraryItem}
        onUpdatePromptLibraryItem={updatePromptLibraryItem}
        onCopyPrompt={copyPrompt}
        onSetPromptFavorite={setPromptFavorite}
        onArchivePromptLibraryItem={archivePromptLibraryItem}
      />

      <ProjectsSection
        projects={projects}
        onSaveProject={saveProject}
        onUpdateProject={updateProject}
        onArchiveProject={archiveProject}
        onSaveProjectUpdate={saveProjectUpdate}
        onRequestResumeSummary={requestResumeSummary}
        resumeSummaryByProject={resumeSummaryByProject}
        projectUpdates={projectUpdates}
      />
    </main>
  );
}

function taskPayloadFromFormData(formData) {
  return {
    title: formData.get("title"),
    status: formData.get("status"),
    priority: formData.get("priority"),
    description: formData.get("description"),
    related_project_id: formData.get("related_project_id"),
    waiting_on: formData.get("waiting_on"),
    follow_up_date: formData.get("follow_up_date"),
    last_contacted_at: formData.get("last_contacted_at"),
    next_action: formData.get("next_action"),
  };
}

function taskClassificationPayloadFromFormData(formData) {
  return {
    title: formData.get("title"),
    priority: formData.get("priority"),
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

function reviewLaterClassificationPayloadFromFormData(formData) {
  return {
    title: formData.get("title"),
    resource_type: formData.get("resource_type"),
    why_it_matters: formData.get("why_it_matters"),
  };
}

function projectPayloadFromFormData(formData) {
  return {
    name: formData.get("name"),
    status: formData.get("status"),
    current_phase: formData.get("current_phase"),
    priority: formData.get("priority"),
    source_of_truth: formData.get("source_of_truth"),
    last_completed_step: formData.get("last_completed_step"),
    current_blocker: formData.get("current_blocker"),
    next_action: formData.get("next_action"),
    waiting_on: formData.get("waiting_on"),
    due_date: formData.get("due_date"),
    active_reason: formData.get("active_reason"),
  };
}

function projectUpdatePayloadFromFormData(formData) {
  return {
    update_text: formData.get("update_text"),
    update_type: formData.get("update_type"),
    next_action: formData.get("next_action"),
  };
}

function arsenalPayloadFromFormData(formData) {
  return {
    name: formData.get("name"),
    category: formData.get("category"),
    description: formData.get("description"),
    url: formData.get("url"),
    tags: formData.get("tags"),
    notes: formData.get("notes"),
    status: formData.get("status") || undefined,
  };
}

function promptLibraryPayloadFromFormData(formData) {
  return {
    title: formData.get("title"),
    category: formData.get("category"),
    description: formData.get("description"),
    full_prompt: formData.get("full_prompt"),
    tags: formData.get("tags"),
    is_favorite: formData.get("is_favorite") ? 1 : 0,
    status: formData.get("status") || undefined,
  };
}

createRoot(document.getElementById("root")).render(React.createElement(App));
