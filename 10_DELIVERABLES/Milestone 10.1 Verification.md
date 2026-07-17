# Milestone 10.1 Verification - Live AI Provider Connection

Status: Complete
Date: 2026-07-17

## Scope
Connected the existing Milestone 10 classification provider boundary to one live provider:

- Provider: OpenAI
- Model: `gpt-5-mini` by default
- API: Responses API
- Output mode: strict Structured Outputs JSON Schema
- Runtime call: native server-side `fetch`
- Dependencies added: none

## Preserved Milestone 10 Protections
- Classification runs only when manually requested from an existing Raw Capture.
- Raymond must review before anything is created.
- Suggestions can be edited before acceptance.
- Rejection creates no Task or Review Later Resource.
- Duplicate acceptance creates only one record.
- Raw Captures remain unchanged.
- Corrections remain historical records only.
- Missing configuration keeps safe unavailable state.

## Environment Configuration
Required:
- `OPENAI_API_KEY`

Optional:
- `RCC_AI_CLASSIFICATION_MODEL`
- `RCC_AI_CLASSIFICATION_TIMEOUT_MS`

Defaults:
- model: `gpt-5-mini`
- timeout: `15000`

The API key is read only by the local backend from `process.env.OPENAI_API_KEY`. It is not committed, exposed to frontend code, included in browser requests, written to SQLite, included in exports, or logged.

## API Request Approach
The backend calls:

```text
POST https://api.openai.com/v1/responses
```

Headers:
- `Authorization: Bearer <OPENAI_API_KEY>`
- `Content-Type: application/json`

The request body includes:
- selected Raw Capture text only
- model name
- strict JSON Schema for the expected response
- `max_output_tokens: 500`

The request body does not include:
- `raw_capture_id`
- database IDs
- `acceptance_id`
- timestamps
- statuses
- archive state
- unrelated internal records
- provider secrets

## Structured Output Schema
OpenAI may return only:

```json
{
  "proposed_record_type": "task",
  "reasoning": "Short human-readable reasoning",
  "confidence": 0.87,
  "values": {
    "title": "Task title",
    "priority": "medium"
  }
}
```

or:

```json
{
  "proposed_record_type": "review_later_resource",
  "reasoning": "Short human-readable reasoning",
  "confidence": 0.87,
  "values": {
    "title": "Resource title",
    "resource_type": "article",
    "why_it_matters": "Why Raymond cared"
  }
}
```

The backend then validates and normalizes the response through application code, generates `acceptance_id`, and attaches the trusted local `raw_capture_id`.

## Error Behavior
- Missing API key: HTTP 503 `classification_provider_unavailable`.
- Timeout, network error, provider 4xx, provider 5xx, or invalid provider JSON envelope: HTTP 503 `classification_provider_error`.
- Invalid, incomplete, unsupported, or extra-field structured output: HTTP 422 `classification_suggestion_invalid`.
- Failures create no records.
- Raw provider responses, authorization headers, stack traces, secrets, and Raw Capture text are not returned.
- No fabricated or keyword-based fallback exists.

## Test Results
- Missing-key behavior: passed.
- Default model behavior: passed.
- Configured model behavior: passed.
- Only Raw Capture text sent externally: passed.
- No internal IDs sent to OpenAI: passed.
- Valid Task response: passed.
- Valid Review Later response: passed.
- Server-generated `acceptance_id`: passed.
- Local attachment of `raw_capture_id`: passed.
- Malformed and unsupported responses: passed.
- Timeout and AbortController behavior: passed.
- Provider 4xx, 5xx, and network errors: passed.
- Failures create no records: passed.
- Edit, accept, reject, correction, duplicate protection, and Raw Capture preservation: passed.
- Full regression suite: `npm test` passed, 64/64.
- `git diff --check`: passed.
- Package files remain unchanged: passed.

## Live Manual Test Result
This execution environment does not currently have `OPENAI_API_KEY` set, so a real OpenAI call could not be performed from this agent session without exposing or injecting a secret.

Verified manually in this environment:
- Missing key returns safe unavailable behavior.
- No external provider call is made when the key is missing.
- The app keeps the review-first flow and creates no records on unavailable provider state.

Live test still required after Raymond starts the backend with `OPENAI_API_KEY` set:
- Use a non-sensitive Raw Capture.
- Confirm a real suggestion is returned.
- Confirm edit and acceptance work.
- Confirm rejection creates nothing.
- Confirm duplicate acceptance creates only one record.
- Confirm Raw Capture remains unchanged.
- Confirm browser never receives the API key.
- Confirm logs contain neither the API key nor the Raw Capture text.

## Token Usage and Approximate Cost
Expected per classification:
- input: about 500-1,200 tokens
- output: about 100-250 tokens
- typical: about 800 input tokens and 150 output tokens

Approximate `gpt-5-mini` cost using published pricing:
- typical single classification: about $0.0005
- 100 classifications: about $0.05
- 1,000 classifications: about $0.50

Actual live token usage must be confirmed after a real provider response is available.

## Files Created
- `10_DELIVERABLES/Milestone 10.1 Verification.md`

## Files Modified
- `README.md`
- `backend/classificationService.js`
- `backend/classificationService.test.js`
- `backend/classificationHandlers.js`
- `backend/classificationHandlers.test.js`
- `05_Progress.md`
- `06_Todo.md`
- `07_Decisions.md`
- `08_Lessons.md`

## Dependencies
No dependencies added.

## Rollback Instructions
Use git to revert the Milestone 10.1 commit:

```sh
git revert <milestone-10.1-commit>
```

Rollback restores the Milestone 10 safe unavailable provider boundary.

## Recommendation
Stop for Raymond review. Do not begin Milestone 11 until Milestone 10.1 is approved.
