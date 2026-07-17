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
