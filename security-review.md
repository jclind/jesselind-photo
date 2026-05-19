# Security Review — `jesselind-photo`

## Executive summary

The site's security model rests entirely on Firestore/Storage rules. The `AdminGate` component is a UX prompt with no security value — it stores a forged-able localStorage flag, and the password it gates is `NEXT_PUBLIC_*`, so it ships in plaintext to every visitor. **If your Firestore/Storage rules currently allow client writes, every photo, the sequence counter, and the storage bucket can be modified by an anonymous attacker. Verify the rules immediately.**

Below the rules, the most pressing first‑party issue is `backfillBlurPlaceholders`, which `fetch()`es whatever URL is sitting in `photo.thumbnailUrl` — an arbitrary‑URL hit from the admin's browser triggered by clicking one button.

## Findings

| Severity | Location | Issue | Recommendation |
|---|---|---|---|
| 🔴 Critical | `components/AdminGate/AdminGate.tsx:30` + `.env:8` | `NEXT_PUBLIC_ADMIN_PASS` (value redacted) is inlined into the client bundle by Next at build time. Any visitor can extract it from the JS chunks (DevTools → search), then "log in" cleanly. Rotation only helps until the next build deploys. | Move to real auth: Firebase Auth with a single admin user/email-link sign-in, and a custom claim `admin: true`. AdminGate then checks `user.getIdTokenResult().claims.admin`. Rotate the current password regardless — it's effectively public. |
| 🔴 Critical | `components/AdminGate/AdminGate.tsx:17–27` | `adminAuth` is a localStorage object with a self-set expiry. An attacker who never knew the password can just `localStorage.setItem('adminAuth', JSON.stringify({expiry: Date.now()+9e9}))` and the gate opens. Even without that, an attacker can simply not visit `/admin` and call the Firestore SDK directly from any page (or curl). | Treat AdminGate as cosmetic only. The real gate must be Firestore + Storage rules keyed to a Firebase Auth UID/custom claim (see "Recommended Firebase Rules" below). |
| 🔴 Critical | `util/reSerializePhotos.ts:15–59`, called from `app/admin/settings/page.tsx:13` | If Firestore rules allow client writes to `photos/*` and `counters/photos`, a hostile client can call this themselves and reassign every `id`/`sequenceNumber`, breaking every gallery URL. The function is also vulnerable to its own race: two simultaneous runs both renumber by `photoDate` and step on each other; an attacker could deliberately trigger one while a legit upload is mid-flight. | Block writes to `photos/*` and `counters/photos` at the rules layer for non-admin UIDs. Long-term, move re-serialization to a Cloud Function (callable, admin-only) so the client never needs broad write access. |
| 🔴 Critical | `app/admin/add-photo/page.tsx:86–150` and Storage `full/` + `thumbnails/` paths | The admin upload uses client SDK writes to Storage and Firestore. Without rules, anyone can upload arbitrary files (any size, any MIME) under `full/<filename>` and `thumbnails/<filename>` — burning bucket quota, hosting malware/phishing on your domain, or evicting/overwriting existing photos by filename collision. They can also write photo docs with arbitrary `fullUrl` values that the public gallery will then render. | Restrict Storage writes to the admin UID, enforce `contentType.matches('image/.*')` and a max `size` (e.g. 20 MB). Restrict Firestore `photos` writes to the admin UID; additionally use a `request.resource.data` validator to keep `id`, `sequenceNumber`, `fullUrl`, `thumbnailUrl`, `storagePath`, `thumbnailPath` immutable‑ish (set on create from server-derived values when possible). |
| 🟡 Medium | `util/backfillBlurPlaceholders.ts:37` | `fetch(photo.thumbnailUrl, { mode: 'cors' })` with no allowlist. If anything ever writes a non-Firebase URL into a doc (e.g., during the critical-tier attack above, or a future bug), clicking "Backfill Blur Placeholders" makes the admin's browser hit attacker-chosen URLs from the admin's IP. Bounded by CORS for response reads, but the *request* still fires and could be used for cache-poisoning of admin browser, tracking pixels, or hitting LAN endpoints. Also a quota-burn vector: an attacker can flip `blurDataURL` off on every doc and force the admin's session to refetch all thumbnails. | Validate scheme + host before fetching: `if (!url.startsWith('https://firebasestorage.googleapis.com/')) skip`. Better: derive the fetch URL from `photo.thumbnailPath` via `getDownloadURL` instead of trusting the stored URL. |
| 🟡 Medium | `app/admin/add-photo/page.tsx:205–212` | File input is `accept='image/*'` only — no client-side size limit, no MIME re-check, no rejection of `.svg`/`.tif`/HEIC/etc. A massive file will hang the page, an SVG passes `image/*` and can carry inline `<script>` (executes if ever served with the bucket as the origin and opened directly, which CORS-served thumbnails *can* be), and crafted images can stall `browser-image-compression` in the main thread. The Storage write itself is the real gate — see Critical row above — but client validation prevents accidental foot-guns. | Add a client-side check: reject if `file.size > 20 * 1024 * 1024`, reject if `file.type` isn't in an explicit JPEG/PNG/WebP set, and reject SVG specifically. Mirror these constraints in the Storage rules so the server is authoritative. |
| 🟡 Medium | `components/PhotoViewer/PhotoImage.tsx:24–26` | `backgroundImage: \`url("${photo.blurDataURL}")\`` interpolates a Firestore-stored value straight into the CSS `url()` context with no escaping. A doc with `blurDataURL` containing a `"` could break out and inject additional CSS declarations (the `style` DOM property accepts compound values). CSS can't execute JS in modern browsers, but it can fire requests (`background-image: url(...)`), exfiltrate state via attribute selectors, or cover the page. Currently low-impact because writes are admin-only — *if* rules enforce that. Bumps to high if writes are open. | Either (a) only write blurDataURLs you generated yourself and validate the prefix `data:image/jpeg;base64,` at read time before interpolating, or (b) pass the value to `<Image placeholder='blur' blurDataURL={...} />` like `PhotoThumbnail.tsx:44` does, which lets Next handle escaping. |
| 🟡 Medium | `lib/firebase.ts:5–18` (and Firebase project config — verify in console) | The Web API key is public by design, but without an HTTP-referrer restriction on the key and per-service authorized-domains list, it can be reused from any origin. That doesn't grant rule-protected access, but it does let attackers exhaust auth quota and (with weak rules) attack from a different origin where they control CORS. | In GCP console → APIs & Services → Credentials, restrict the API key to `https://jesselindphoto.vercel.app/*` and `http://localhost:3000/*`. In Firebase Auth → Settings, restrict authorized domains. Mark this as "verify in console — cannot inspect from repo." |
| 🟡 Medium | Storage bucket CORS (out-of-repo) | Prompt says CORS is `GET`-only for the two origins. Verify with `gsutil cors get gs://photography-website-e62a9.appspot.com` and confirm no `PUT/POST/DELETE/PATCH`. Writes go through the Firebase SDK over a different endpoint, so omitting them in CORS is correct. | Re-run `gsutil cors get` and paste the result somewhere durable. Also confirm there is no `*` origin entry. |
| 🟠 Informational | `app/admin/add-photo/page.tsx:105, 114` | Storage paths are derived from `file.name` verbatim: `full/${file.name}`. Two photos with the same filename silently overwrite each other (`uploadBytes` is upsert). Not a security issue per se, but a hostile upload can target an existing photo's path and replace its image. Rules can't easily distinguish "create" from "overwrite" on Storage. | Prefix with a uuid or the new `sequenceNumber`: `full/${id}-${file.name}`. Also reject filenames containing `/`, `..`, `\`. |
| 🟠 Informational | `app/layout.tsx:118–127` | Inline GA bootstrap script. Fine today; will block any future `Content-Security-Policy` from being meaningfully strict (would require `'unsafe-inline'`). | When you add CSP, move the GA init into an external file (or attach a `nonce` via Next's headers callback) so you can drop `'unsafe-inline'`. |
| 🟠 Informational | `components/AdminGate/AdminGate.tsx:35` | `alert('Wrong password ❌')` is an information disclosure (confirms the gate exists & is operational), but trivial — anyone reading the JS already knows. No action needed unless you remove the gate entirely. | None. |
| 🟠 Informational | `app/admin/add-photo/page.tsx:189–199` | `<img src={previewUrl}>` instead of `next/image` for previews. Previews are blob URLs the user just selected, so this is fine — flagged only so it's not mistaken for a remote-image bypass. | None. |
| 🟠 Informational | `next.config.ts:11–21` | `images.remotePatterns` only allows `firebasestorage.googleapis.com` — good. This means even a hostile Firestore doc with a non-Firebase `fullUrl` will be rejected by the Next image optimizer rather than rendered. Defense in depth working as intended. | Keep this list minimal; do not add wildcards. |
| 🟠 Informational | `.env` not in git history; `NEXT_PUBLIC_ADMIN_PASS` reference appears in commits only as the variable name, not the value | Confirmed via `git log -S 'NEXT_PUBLIC_ADMIN_PASS'` and `git ls-files`. The literal password is not in repo history. | Still rotate it once you migrate off NEXT_PUBLIC_, because it has shipped in every Vercel build artifact. |
| 🟠 Informational | `util/reSerializePhotos.ts:32` | Sort uses `a.photoDate.seconds - b.photoDate.seconds` — two photos taken in the same second compare equal and the resulting order is non‑deterministic across runs. Not a security finding; flagging because the renumber can shuffle within seconds-bucket and that interacts with the URL stability concern. | Tiebreak by document id or filename to keep ordering stable. |

## Recommended Firebase Rules

These are **starting points**, not authoritative — apply them in a staging project, run through the upload + viewer + re-serialize + backfill flows, and adjust. They assume you've added Firebase Auth and your single admin user has UID `<ADMIN_UID>` (or, better, a custom claim `admin: true`).

### `firestore.rules`

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null && request.auth.token.admin == true;
    }

    // Public photo metadata: anyone can read; only admin writes.
    match /photos/{photoId} {
      allow read: if true;

      allow create: if isAdmin()
        && request.resource.data.keys().hasOnly([
          'id','title','category','description','location',
          'storagePath','thumbnailPath','projectID',
          'fullUrl','thumbnailUrl','blurDataURL',
          'width','height','createdAt','photoDate','sequenceNumber'
        ])
        && request.resource.data.fullUrl is string
        && request.resource.data.fullUrl.matches('^https://firebasestorage\\.googleapis\\.com/.*')
        && request.resource.data.thumbnailUrl.matches('^https://firebasestorage\\.googleapis\\.com/.*')
        && request.resource.data.width is int
        && request.resource.data.height is int
        && request.resource.data.sequenceNumber is int;

      allow update, delete: if isAdmin();
    }

    // Sequence counter — only admin, only the one field.
    match /counters/photos {
      allow read: if true;
      allow write: if isAdmin()
        && request.resource.data.keys().hasOnly(['lastSequenceNumber'])
        && request.resource.data.lastSequenceNumber is int;
    }

    // Default-deny anything else.
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### `storage.rules`

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    function isAdmin() {
      return request.auth != null && request.auth.token.admin == true;
    }

    function isImage() {
      return request.resource.contentType.matches('image/(jpeg|png|webp|avif)');
    }

    function sizeOk() {
      return request.resource.size < 25 * 1024 * 1024;
    }

    match /full/{file} {
      allow read: if true;
      allow write: if isAdmin() && isImage() && sizeOk();
    }

    match /thumbnails/{file} {
      allow read: if true;
      allow write: if isAdmin() && isImage() && sizeOk();
    }

    match /{path=**} {
      allow read, write: if false;
    }
  }
}
```

Notes on the rules block:
- The `image/(jpeg|png|webp|avif)` regex deliberately excludes SVG. SVGs are documents, not bitmaps; allowing them in a Storage bucket served on your origin is an XSS foothold.
- The Firestore `fullUrl`/`thumbnailUrl` regex pin to Firebase's host. This is belt-and-suspenders alongside `next.config.ts:11`'s `remotePatterns`, and stops the inline-CSS-injection vector in `PhotoImage.tsx` from being usable even if `blurDataURL` somehow gets through (since you can mirror this regex on `blurDataURL` too — `^data:image/jpeg;base64,[A-Za-z0-9+/=]+$`).
- The `hasOnly([...])` check freezes the doc shape — a future hostile client can't add `__proto__` keys or extra fields that downstream code might trust.

After applying these, retest: `/admin/add-photo` (should still work signed in as admin), `/admin/settings` → re-serialize (works for admin), public gallery reads (still work for anon), an anonymous browser session calling `addDoc(collection(db,'photos'), {...})` from DevTools (should fail with permission-denied — this is the test that proves AdminGate is now cosmetic).
