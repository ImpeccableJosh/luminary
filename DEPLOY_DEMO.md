# Luminary Demo Deploy

This is the cheapest production setup for `nesu.dev`:

- static frontend only
- Cloudflare Pages hosting
- Cloudflare Pages Functions for the password gate
- no Flask backend
- no Manim service

## What This Build Does

- Production builds use static demo mode by default through `frontend/.env.production`.
- Lesson requests play curated MP4 demos from `frontend/public/demo-media`.
- The server-side password gate runs from `frontend/functions/_middleware.js`.
- ElevenLabs still runs live in the browser, so the voice intro can stay interactive.

## 1. Push The Repo

Push the current repo to GitHub.

## 2. Create A Cloudflare Pages Project

In Cloudflare:

1. Go to `Workers & Pages`
2. Click `Create`
3. Choose `Pages`
4. Connect your GitHub repo

Use these build settings:

- Framework preset: `Vite`
- Root directory: `frontend`
- Build command: `npm run build`
- Build output directory: `dist`

## 3. Add Environment Variables

In the Pages project settings, add:

Build variable:

- `VITE_ELEVENLABS_AGENT_ID=agent_2901kjkf6hd2ekvbxqbvxq2p7f4h`

Function secrets:

- `SITE_PASSWORD=your-demo-password`
- `SITE_ADMIN_PASSWORD=your-admin-password`

Do not add `VITE_BACKEND_URL` for production. The static demo does not need it.

## 4. Deploy

Trigger the first deployment from Cloudflare Pages.

After deploy, test the generated `*.pages.dev` URL:

- password screen should appear before the app loads
- demo password should unlock the 3-minute session
- admin password should unlock the longer admin session
- the orb should connect to ElevenLabs
- classroom requests should show curated demo videos without backend errors

## 5. Attach The Domain

Recommended:

- use `demo.nesu.dev` first

Once that is working, you can move it to `nesu.dev` if you want the demo to be the main site.

In Cloudflare Pages:

1. Open the Pages project
2. Go to `Custom domains`
3. Add `demo.nesu.dev`
4. Follow the DNS prompt in Cloudflare

## 6. Final Smoke Test

Open the deployed site in an incognito window and verify:

- password prompt shows immediately
- incorrect password stays blocked
- correct demo password unlocks the app
- the countdown appears
- clicking the orb starts ElevenLabs audio
- asking for a lesson still plays a local demo MP4

## Notes

- Local dev still uses the current Vite flow and can keep talking to your local backend if you want.
- Production is intentionally demo-only to keep costs near zero.
- If you ever want live Manim rendering in production, that is a separate paid hosting setup.
