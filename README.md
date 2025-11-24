# Workflow Testing App

A Next.js application demonstrating workflows with webhooks and server actions. The app starts a workflow that iterates over a webhook, allowing terms to be added to a list via server actions.

## Unexpected Behavior During Local Development

This app contains examples of unexpected behavior with workflows during local development:

### 1. Workflow Stuck in Pending State on First Start
When the dev server is started for the first time (before the `.well-known` directory is created), the workflow starts but stays in a pending state indefinitely. A fetch error (`ECONNREFUSED`) is thrown in the logs:
```
[embedded world] Queue operation failed: TypeError: fetch failed
  [cause]: AggregateError: code: 'ECONNREFUSED'
```

### 2. Client Requests Hang with `resumeWebhook`
When attempting to resume the workflow from a server action using `resumeWebhook`, the workflow appears to respond according to the logs, but the client never receives a response. The request remains pending until timeing out after 5 minutes.

### 3. Workflow Stops Responding After Code Changes
When making changes to the workflow while the dev server is running, it stops responding to requests, leaving the client hanging until it times out at 5 minutes (also observed with streams).

## Usage

- `npm run dev` - Start the development server
- `npm run dev:clean` - Clean build artifacts and start fresh (useful for reproducing the first issue)

