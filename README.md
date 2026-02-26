# text2scratch

`text2scratch` is a static web app that converts text commands into Scratch 3
projects (`.sb3`) and can reverse-import existing Scratch projects back into
editable text syntax.

## Highlights

- Write text commands and export a valid Scratch 3 `.sb3` project.
- Import existing `.sb3` files, including projects not created by text2scratch.
- Convert imported blocks back into editable text2scratch syntax.
- Save and reload fast `.t2sh` session files.
- Build Stage scripts and multiple sprite scripts in one project.
- Edit project name directly from the editor toolbar.
- Optional cloud save/share with Supabase auth and row-level security.
- Username-based profile auth modal in converter UI (no dedicated login route required).
- Community page for browsing public shared projects.

## File Formats

- `.sb3`: Standard Scratch project archive.
- `.t2sh`: Compressed text2scratch session (`session.json` in a deflated
  container).

## Run Locally

The app fetches `blocks.json`, so run it through a local web server.

```bash
python -m http.server 8080
# or
npx serve .
```

Open `http://localhost:8080`.

## Supabase Setup

Cloud save/share uses Supabase from the browser (`index.html` + `app.js`).

1. In Supabase SQL Editor, run [`supabase-schema.sql`](supabase-schema.sql).
2. In Supabase Auth URL config:
   - Set `Site URL` to your deployed domain.
   - Add redirect URLs for local/dev/prod (for example `http://localhost:8080/**`).
3. Update `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in `supabase-client.js` if your project values change.
4. Optional: update the Auth confirmation template in Supabase using [`supabase-email-confirmation-template.html`](supabase-email-confirmation-template.html).
5. If Bot Detection (hCaptcha) is enabled in Supabase, also set `HCAPTCHA_SITE_KEY` in `supabase-client.js`.

Do not use Postgres connection strings or `service_role` keys in frontend code.

## Quick Workflow

1. Create data (`make_var`, `make_list`, `make_broadcast`) if needed.
2. Add Stage scripts in `stage_code =` ... `end`.
3. Add sprite sections with `sprite = "Name"` and `<sprite>_code =` ... `end`.
4. Export to `.sb3` for Scratch or `.t2sh` for fast restore.

## `@` Expression Syntax

- `@` forces expression mode inside an input slot.
- Example: `set_var score @var(best_score)`.
- Do not place expression lines by themselves.

## Example (Stage + Multiple Sprites)

```txt
make_var score 0
make_broadcast start_round

stage_code =
  when_flag_clicked
  broadcast start_round
end

sprite = "Cat"
cat_code =
  when_broadcast_received start_round
  set_var score 1
end

sprite = "Ball"
ball_code =
  when_broadcast_received start_round
  if var(score) > 0
    say "Game started"
  end
end
```

## Project Files

- `index.html`: main converter/editor UI.
- `app.js`: conversion logic, parser flow, import/export wiring.
- `login.html`, `signup.html`: dedicated auth pages.
- `auth.js`: auth page controller (sign in/sign up).
- `supabase-client.js`: shared Supabase config and helpers.
- `blocks.json`: source of truth for command mappings and syntax patterns.
- `docs.html`: syntax guide and command reference.
- `reference.html`: full command reference page.
- `community.html`: public community browser for shared projects.
- `terms.html`, `privacy.html`, `license.html`: legal/policy pages.
- `supabase-email-confirmation-template.html`: styled HTML template for Supabase confirmation emails.

## License

This project uses a custom non-commercial attribution license:

- Non-commercial use, modification, and redistribution are allowed.
- Visible attribution to `text2scratch` is required.
- Commercial use requires prior written permission.

See `LICENSE` and `license.html` for full terms.
