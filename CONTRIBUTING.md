# Contributing

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set the client-safe Supabase and captcha values.
3. Start the app with `npm run dev`.

## Quality checks

Run these before opening a pull request:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## Pull requests

- Keep changes scoped and describe the user-facing impact.
- Add or update tests when touching validation, auth, or workspace behavior.
- Do not commit secrets or service-role credentials.
