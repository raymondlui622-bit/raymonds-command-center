# Raymond Command Center

Local-first foundation for the Raymond Command Center.

## Version 1 Status

Version 1.0.0 is complete and signed off (release commit `0c78c48`, 2026-07-17). All thirteen milestones passed QA, including the bundled live OpenAI smoke test. See [10_DELIVERABLES/VERSION_1_RELEASE_NOTES.md](10_DELIVERABLES/VERSION_1_RELEASE_NOTES.md) for capabilities, architecture, known limitations, and rollback instructions.

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

Exports include Raw Captures, Tasks, Review Later Resources, Projects, Project Updates, My Arsenal Items, Prompt Library Items, Classification Corrections, and Morning Brief Items, including archived records where applicable. SQLite remains the live source of truth.

## AI Classification Runtime

Milestone 10 adds a small server-side classification provider boundary for Raw Capture suggestions. Milestone 10.1 connects that boundary to OpenAI when server-side configuration is present.

Server-side configuration:

```sh
export OPENAI_API_KEY="..."
export RCC_AI_CLASSIFICATION_MODEL="gpt-5-mini" # optional
export RCC_AI_CLASSIFICATION_TIMEOUT_MS="15000" # optional
npm run dev:backend
```

Current behavior:

- The frontend can request classification from an existing Raw Capture.
- The backend sends only the selected Raw Capture text to OpenAI.
- The backend attaches the local Raw Capture ID and a server-generated acceptance ID after validation.
- With no API key configured, no data is sent outside the app and no record is created.
- Tests use deterministic mocked provider responses; mocked responses are not treated as live AI functionality.
- API keys must remain server-side and must not be committed to the project.
- No OpenAI SDK is used; the backend uses native server-side `fetch`.
