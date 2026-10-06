# HomeStays — Homestay Booking & Property Management

A full-stack homestay booking platform built with **React + Vite + Tailwind**, **Redux Toolkit + Redux Saga**, and an **Express REST API** that runs as a **Vercel serverless function**.

It deploys to Vercel and works straight away in **demo mode**. You don't need a database, secrets or paid services. Seeded properties, users and bookings load automatically, and your bookings, cancellations and listing edits are saved in your browser's `localStorage`.

---

## Features

| Area | What you can do |
| --- | --- |
| **Guests** | Search and filter by destination, dates, guests, price, property type and amenities · view photos, amenities, the availability calendar and live price quotes · go through a **simulated checkout** and get a confirmation · see upcoming, past and cancelled trips · cancel eligible bookings and see the refund calculation |
| **Hosts (owners)** | View dashboard stats (earnings, occupancy, status breakdown) · create, edit, activate, deactivate and delete listings · set pricing (nightly, weekend, cleaning fee), capacity, amenities and photos · block dates · approve or decline requests, cancel bookings, mark stays completed |
| **Admins** | View platform stats (booking value by month, top properties, occupancy) · manage users (change role, suspend, delete), properties (activate, deactivate, suspend, delete) and bookings (change status) |
| **Platform** | JWT auth with guest/owner/admin roles · protected routes · date validation · price calculation · availability checks · **server-enforced prevention of overlapping bookings** · loading skeletons · toasts · error states · dark mode · responsive layouts |

## Demo credentials

All demo accounts use the password **`demo1234`**. The login page also has one-click demo login buttons.

| Role | Email |
| --- | --- |
| Guest | `guest@homestays.demo` |
| Guest | `sara@homestays.demo` |
| Owner (host) | `owner@homestays.demo` |
| Owner (host) | `marco@homestays.demo` |
| Admin | `admin@homestays.demo` |

**Test cards (simulated payments only):** use `4242 4242 4242 4242` for success and `4000 0000 0000 0002` to simulate a decline. Any future expiry date and any 3-digit CVC work.

---

## Quick start (local)

Requirements: Node.js 20 or later.

```bash
npm install
npm run dev        # Vite on http://localhost:5173 + API on http://localhost:3001 (proxied at /api)
```

Other scripts:

```bash
npm test           # Vitest: domain logic, API (supertest) and saga tests
npm run build      # Production build to dist/
npm start          # Build, then serve dist/ + API from Express at http://localhost:3001 (mirrors Vercel routing)
npm run serve      # Serve an existing build without rebuilding
```

No `.env` is needed. See `.env.example` for the optional variables.

---

## Deploy to Vercel

1. Push this repository to GitHub, GitLab or Bitbucket.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Keep the detected settings. `vercel.json` already sets:
   - Framework: **Vite**, build command `npm run build`, output directory `dist`
   - `api/index.js` → the Express app as a serverless function
   - Rewrites: `/api/*` → the function, everything else → `index.html` (so direct links and refreshes work on nested routes such as `/owner/listings/new`)
4. Click **Deploy**. You don't need any environment variables, and the app starts in demo mode.

Or use the CLI: `npx vercel` (preview) and then `npx vercel --prod`.

Optional environment variables (Project → Settings → Environment Variables):

| Variable | Purpose |
| --- | --- |
| `JWT_SECRET` | Secret used to sign JWTs. If unset, a public demo secret is used (fine for demos, **not** for production). |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Set **both** to switch from demo storage to Supabase PostgreSQL (see below). These are server-only and never sent to the browser. |

---

## Architecture

```
├── api/index.js                # Vercel serverless entry (exports the Express app)
├── server/
│   ├── app.js                  # createApp(): middleware + routes under /api
│   ├── dev.js                  # Local API server (optionally serves dist/ with SPA fallback)
│   ├── routes/                 # auth, properties, bookings, owner, admin
│   ├── services/               # search, booking rules, stats
│   ├── middleware/             # demo state, JWT auth/roles, validation, errors
│   ├── repositories/           # Data-access layer
│   │   ├── index.js            # Picks the repository based on environment variables
│   │   ├── demoRepository.js   # Stateless: seed data + browser overlay
│   │   └── supabaseRepository.js
│   └── schemas.js              # zod request validation
├── shared/                     # Pure JS shared by the browser AND the server
│   ├── domain/                 # dates, pricing, availability/overlap/cancellation rules
│   ├── seed/                   # Demo users, properties (Unsplash photos), bookings relative to today
│   └── overlay.js              # Demo overlay apply/merge helpers
├── src/                        # React app
│   ├── api/                    # fetch client (+ demo overlay persistence) and endpoint map
│   ├── app/                    # Redux store + root saga
│   ├── features/               # Slices + sagas: auth, properties, booking, myBookings, owner, admin, meta, ui
│   ├── context/                # ThemeContext (dark mode), DemoModeContext (mode + reset)
│   ├── components/             # layout, common UI, property widgets
│   └── pages/                  # Guest, owner and admin pages
├── supabase/schema.sql         # Optional PostgreSQL schema (with overlap exclusion constraint)
├── supabase/seed.js            # Loads the demo seed into Supabase
└── tests/                      # Vitest suites
```

### How demo mode works on serverless

Serverless functions don't keep memory between invocations, so the API **never relies on server-side in-memory changes**. Instead:

1. Each request rebuilds its data as **seed data + an overlay**. The overlay is a compact diff of changes made in the browser and stored in `localStorage` under the key `homestays.demo.v1`.
2. The browser sends the overlay with every API call in the `X-Demo-State` header (base64 JSON). If the overlay gets large, the client sends it in the request body instead and uses `X-HTTP-Method-Override: GET` for reads.
3. The API runs all business rules, including validation, pricing, availability and overlap checks, and returns `{ data, demoPatch }`.
4. The client merges `demoPatch` into `localStorage`, so changes survive page refreshes.

**Reset demo data** in the top banner clears the overlay and restores the original seed data.

> In demo mode the browser holds the overlay, so the data can't be trusted the way a real database can. This is intentional for demos. Use Supabase mode for real data.

### State management

- **Redux Toolkit** slices hold all application state.
- **Redux Saga** runs every async workflow:
  - debounced, cancellable search (`takeLatest` + `delay`)
  - parallel detail and availability loading (`all`)
  - quote → checkout → refresh availability, bookings and notifications
  - cancellation, plus owner and admin mutations, with per-row busy states
- **React Context** handles cross-cutting UI concerns (theme, demo mode and reset).

### Business rules (`shared/domain`)

- **Dates:** ISO `YYYY-MM-DD` in UTC. Check-in can't be in the past (the server allows one day of timezone tolerance). Check-out must be after check-in. Stays are 1–30 nights, booked at most 365 days ahead.
- **Pricing:** nightly rate, or the weekend rate for Friday and Saturday nights, plus cleaning fee, a 10% service fee and 12% tax. Totals are rounded to the cent. The same function produces the live quote and the authoritative server total.
- **Availability:** pending and confirmed bookings, plus owner-blocked ranges, hold dates. Ranges are half-open, so back-to-back stays are allowed. Overlapping bookings are rejected with **409**. When a host approves a pending request, it's checked again against confirmed bookings.
- **Booking status:** instant-book listings confirm immediately; other listings start as `pending`. Statuses are `pending`, `confirmed`, `cancelled`, `completed` and `rejected`.
- **Cancellation:** full refund 2 or more days before check-in (and always for pending requests), 50% after that, and not allowed once the stay has started.

---

## REST API

Base URL: `/api`. Responses look like `{ "data": ..., "demoPatch"?: ... }`. Errors look like `{ "error": { "code", "message", "details"? } }`, using status 400, 401, 402, 403, 404 or 409.
Authenticated endpoints need `Authorization: Bearer <token>`.

### Public

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | `{ status, mode: "demo" \| "supabase" }` |
| GET | `/meta` | Amenities, property types, demo accounts (demo mode only) |
| POST | `/auth/register` | `{ name, email, password, role: "guest" \| "owner" }` → `{ token, user }` |
| POST | `/auth/login` | `{ email, password }` → `{ token, user }` |
| GET | `/auth/me` | Current user 🔒 |
| GET | `/properties` | Search. Query: `destination, checkIn, checkOut, guests, minPrice, maxPrice, type, amenities (comma list), sort (recommended\|price_asc\|price_desc\|rating\|newest), page, pageSize` → `{ items, total, page, totalPages, destinations }` |
| GET | `/properties/:id` | Property details, including the owner summary |
| GET | `/properties/:id/availability` | `{ unavailableNights[], blockedDates[] }` |
| POST | `/properties/:id/quote` | `{ checkIn, checkOut, guests }` → `{ available, price }` |

### Bookings (🔒 any signed-in user)

| Method | Path | Description |
| --- | --- | --- |
| POST | `/bookings` | Simulated checkout: `{ propertyId, checkIn, checkOut, guests, specialRequests?, payment: { cardName, cardNumber, expiry: "MM/YY", cvc } }`. Only the last 4 digits of the card are stored. |
| GET | `/bookings/me` | Your bookings, with property info and cancellation policy |
| GET | `/bookings/:id` | Booking details (guest, host or admin) |
| POST | `/bookings/:id/cancel` | Cancel and get the refund calculation |

### Owner (🔒 owner or admin)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/owner/stats` | Host dashboard stats |
| GET / POST | `/owner/properties` | List your listings / create a listing |
| GET / PUT / DELETE | `/owner/properties/:id` | Read, update or delete a listing. You can't delete a listing that has upcoming bookings. |
| PUT | `/owner/properties/:id/availability` | `{ blockedDates: [{ start, end, note? }] }` |
| GET | `/owner/reservations?status=&propertyId=` | Reservations for your listings |
| PATCH | `/owner/reservations/:id/status` | `{ status }`. Allowed changes: pending → confirmed or rejected; confirmed → cancelled or completed. |

### Admin (🔒 admin)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/admin/stats` | Platform stats |
| GET | `/admin/users` · PATCH/DELETE `/admin/users/:id` | Change role or status (`active`/`suspended`) / delete |
| GET | `/admin/properties` · PATCH/DELETE `/admin/properties/:id` | Change status (`active`/`inactive`/`suspended`) / delete |
| GET | `/admin/bookings?status=` · PATCH `/admin/bookings/:id` | Override a booking's status |

Example:

```bash
curl -s https://<your-app>.vercel.app/api/properties?destination=goa
TOKEN=$(curl -s -X POST https://<your-app>.vercel.app/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"guest@homestays.demo","password":"demo1234"}' | jq -r .data.token)
curl -s https://<your-app>.vercel.app/api/bookings/me -H "Authorization: Bearer $TOKEN"
```

---

## Upgrading to Supabase PostgreSQL

1. Create a Supabase project, open the SQL editor and run `supabase/schema.sql`. The schema includes a `btree_gist` exclusion constraint, so the database itself rejects overlapping confirmed bookings.
2. Optionally load the demo data:
   `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node supabase/seed.js`
3. In Vercel, set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and a strong `JWT_SECRET`, then redeploy.

`server/repositories/index.js` then returns `SupabaseRepository`, which implements the same interface as `DemoRepository`. The UI drops the demo banner, and the API ignores demo overlays. No frontend changes are needed.

---

## Testing and verification

- `npm test` runs:
  - domain tests (dates, pricing, overlap, cancellation, overlay)
  - API tests (supertest; the full booking, owner and admin workflows through the stateless demo overlay, role checks, validation errors, method-override)
  - saga tests (`runSaga` with a mocked API)
- An end-to-end browser pass was run against `npm start`. It covered:
  - opening a nested route directly
  - the logged-out reserve → login redirect → checkout → confirmation flow
  - the booking persisting across a reload
  - overlap blocking
  - cancellation with persistence
  - creating and editing a listing as an owner, and approving a reservation
  - admin stats and suspending a user
  - the 404 page and the mobile layout

## Notes

- Payments are **simulated**. No real payment provider is called and no card data is stored apart from the last 4 digits.
- Property photos are hotlinked from Unsplash, so they need internet access. A local placeholder is shown if an image fails to load.
