# Raymond Command Center

Local-first foundation for the Raymond Command Center.

## Milestone 1 Commands

Install dependencies:

```sh
npm install
```

Start the backend:

```sh
npm run dev:backend
```

Start the frontend in another terminal:

```sh
npm run dev:frontend
```

Check backend health:

```sh
curl http://127.0.0.1:3001/health
```

Run tests:

```sh
npm test
```

## Exports

With the backend running, download read-only exports:

- JSON: `http://127.0.0.1:3001/export.json`
- Markdown: `http://127.0.0.1:3001/export.md`

Exports include Raw Captures, Tasks, Review Later Resources, Projects, and Project Updates, including archived records. SQLite remains the live source of truth.

## AI Classification Runtime

Milestone 10 adds a small server-side classification provider boundary for Raw Capture suggestions.

No AI provider, model, SDK, or API key has been approved or configured yet. In normal runtime, classification requests return a safe unavailable state until Raymond approves and configures a provider in a future step.

Current behavior:

- The frontend can request classification from an existing Raw Capture.
- The backend sends only the Raw Capture `id` and `raw_text` to the provider boundary.
- With no provider configured, no data is sent outside the app and no record is created.
- Tests use deterministic mocked provider responses; mocked responses are not treated as live AI functionality.
- API keys must remain server-side and must not be committed to the project.
