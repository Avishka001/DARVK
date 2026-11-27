<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/b06b1452-4316-4bc6-857b-4e4f9183d9ff

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Connecting to the backend (A to Z)

This frontend now talks to a real Express + database backend instead of
using `localStorage`/hardcoded data. Here's the full setup, start to finish:

**1. Pick a backend** — you have two, pick whichever database you're using:
- `backend/` — Postgres
- `backend-mssql/` — SQL Server

**2. Set up and start the backend** (from its folder):
```bash
npm install
cp .env.example .env       # fill in your DB connection details
npm run setup              # creates tables + seeds products/admin/discounts
npm run dev                # starts on http://localhost:4000
```

**3. Start this frontend** (from this folder, in a separate terminal):
```bash
npm install
npm run dev                # starts on http://localhost:3000
```

That's it — `vite.config.ts` already has a proxy rule that forwards any
`fetch('/api/...')` call from the frontend to `http://localhost:4000`, so
both dev servers just need to be running at the same time. Open
`http://localhost:3000` and the storefront will load real products from the
database, admin login (`admin` / `yasas` by default) will issue a real JWT,
and checkout will create real orders and decrement real stock.

**What changed in this frontend to make that work:**
- `src/api.ts` — new file, a small fetch wrapper for every backend endpoint
- `src/context/AdminContext.tsx` — loads products from `/api/products`
  instead of a static file, and admin login/add/delete product now call the
  API instead of `localStorage`
- `src/components/CheckoutModal.tsx` — checkout now calls `POST /api/orders`
  for real instead of faking a payment with a timer
- `src/components/CartDrawer.tsx` — discount codes are validated against
  `POST /api/discounts/validate` instead of being hardcoded
- `src/App.tsx` — the newsletter form calls `POST /api/newsletter/subscribe`
- `vite.config.ts` — added the `/api` proxy

**Deploying:** in production you won't have Vite's dev proxy, so either put
both behind the same domain with a reverse proxy (nginx, etc.) routing
`/api/*` to the backend, or set `CORS_ORIGIN` in the backend's `.env` to your
deployed frontend URL and change `src/api.ts`'s `request()` function to call
the backend's full URL instead of a relative `/api` path.

