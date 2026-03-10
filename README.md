# text2scratch

`text2scratch` is a developer-focused Scratch authoring tool. It combines a
high-end product website, guided syntax docs, a searchable command reference,
and a browser-based workspace that exports real Scratch `.sb3` files from plain
text.

## Current stack

- Vite for local development and production builds
- React + TypeScript for the marketing, auth, docs, reference, and dashboard UI
- Tailwind CSS for the new website surface
- Next.js App Router starter in `apps/next-site` with static export enabled
- Supabase browser auth for login, signup, password recovery, and profile data
- GitHub Actions workflow for GitHub Pages deployment

## Project structure

```text
apps/
  next-site/        Next.js static-export starter
config/
  site-entries.ts   Shared HTML entry manifest for Vite
src/
  legacy/           Browser runtime preserved for the converter and old helpers
  site/             React UI surface (pages, components, providers, assets, lib)
  api.ts            Static JSON validator entry
  confirm.ts        Confirm/reset flow entry
public/             Static assets copied directly into the build
```

## Main routes

- `index.html`: premium landing page
- `docs.html`: guided onboarding docs
- `reference.html`: searchable full syntax reference
- `login.html`: login flow
- `signup.html`: signup flow
- `dashboard.html`: unified account, profile, appearance, and security surface
- `converter.html`: main text-to-Scratch workspace
- `dev/index.html`: plain-text developer and AI reference

Deprecated routes stay in place as redirects:

- `account.html` -> `dashboard.html#overview`
- `profile.html` -> `dashboard.html#profile`
- `settings.html` -> `dashboard.html#appearance`
- `home.html` -> `index.html`

## Local development

Install dependencies:

```bash
npm install
```

Start the Vite dev server:

```bash
npm run dev
```

Useful commands:

```bash
npm run typecheck
npm run build
npm run preview
npm run next:dev
npm run next:build
```

## GitHub Pages deployment

The repo now includes `.github/workflows/deploy.yml`.

Deployment flow:

1. Push to `main`.
2. GitHub Actions runs `npm ci`, `npm run typecheck`, and `npm run build`.
3. The built `dist/` output is deployed to GitHub Pages.

The Vite `base` path is derived automatically from `GITHUB_REPOSITORY` during
the GitHub Actions build, so the same config works locally and on Pages.

## Product workflow

1. Read the guided docs if you are new to the syntax.
2. Use the reference page when you need exact command lookup.
3. Author or import projects in `converter.html`.
4. Export `.sb3` for Scratch or `.t2sh` for a fast restore-friendly session.
5. Use the dashboard for account, theme, and security actions.

## Auth and Supabase notes

The frontend expects a Supabase project with:

- browser-safe publishable credentials
- a `profiles` table or equivalent profile fallback behavior
- RPCs used by the dashboard/auth flow such as username availability and login
  resolution

Current frontend configuration lives in:

- `src/site/lib/supabase.ts` for the React/TypeScript app
- `src/legacy/auth/supabase-client.js` for the legacy workspace and remaining static pages

If your Supabase project values change, update the relevant client file or set:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Do not use service-role keys in frontend code.

## Notes on the workspace

The converter is still the existing production workspace and retains its legacy
JavaScript runtime so import/export behavior is preserved while the website,
docs, auth flow, and dashboard run on the new TypeScript/Tailwind stack.
