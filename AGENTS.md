<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

Project guidance lives in `CLAUDE.md`: commands, Firebase data model, the gallery
and photo-viewer routing pattern, and the admin flow. Read it before making changes.

The block above is managed by `next dev` and will be rewritten on each Next upgrade.
It lives here so `CLAUDE.md` stays hand-maintained. Disable it with `agentRules: false`
in `next.config.ts`.
