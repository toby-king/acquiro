# Admin Dashboard – API Contract

The admin dashboard at `/admin` expects the following.

## Backend (this repo)

- **MRR:** `GET /api/admin/mrr` — implemented in `server/src/routes/admin.ts`; uses Stripe to compute current MRR.
- **Revenue:** `GET /api/admin/revenue` — returns `{ current_mrr: number, monthly_revenue: [{ month: string, revenue: number }] }` (revenue in cents). Uses Stripe subscriptions for current MRR and paid invoices for last 6 months.
- **Conversations:** `GET /api/admin/conversations` and `GET /api/admin/conversations/:id` — proxy to ElevenLabs Conversational AI API. Set **ELEVENLABS_API_KEY** in the server environment for the Agent Activity tab to work.

---

## Bubble API Endpoints

Create these in Bubble so the admin dashboard can fetch data. Create these in Bubble so the frontend can fetch data.

---

## 1. User stats (Users tab)

**Endpoint:** `GET /get_admin_stats`  
(or `POST` with empty body if your Bubble API only supports POST; if so, update `adminService.ts` to use POST.)

**Auth:** Same as other Bubble workflows (Bearer token).

**Response shape:**

```json
{
  "total_users": 123,
  "active_subscribers": 45,
  "churned_users": 78
}
```

- `total_users` (number): Total user count.
- `active_subscribers` (number): Users where `is_subscribed === "yes"`.
- `churned_users` (number): Users where `is_subscribed === "no"`.

**Optional (for charts):**

- `signups_over_time` (array): `[{ date: string, count: number }]` — new signups per period for the "Subscriber Growth" line chart.
- `listings_by_source` (array): `[{ source: string, count: number }]` — counts per source for the "Listings by Source" chart (and summary cards when used with get_listings).
- `listings_over_time` (array): `[{ date: string, by_source: { [source: string]: number } }]` — new listings per period per source for the "New Listings Over Time" line chart.

If your Bubble API wraps the payload in a `response` object, that’s fine — the frontend accepts either `{ total_users, ... }` or `{ response: { total_users, ... } }`.

---

## 2. Listings (Listings tab)

**Endpoint:** `GET /get_listings`

**Query parameters:**

| Parameter   | Type   | Description                                |
|------------|--------|--------------------------------------------|
| `search`   | string | Optional. Search by listing title or location. |
| `source`   | string | Optional. Filter by source (e.g. BusinessesForSale, Rightbiz). |
| `page`     | number | Optional. 1-based page number for pagination.  |
| `page_size`| number | Optional. Number of results per page (e.g. 10). |

**Actual Bubble response shape** (frontend maps from this):

Bubble returns `{ "status": "success", "response": { "listing": [ ... ] } }`. Each item in `response.listing` uses:

- `_id` (string): Unique ID.
- `business_name` (string): Listing title/name.
- `source` (string): Source identifier (e.g. `"1767631489636x813332504534790800"`).
- `location` (string): May include newlines/whitespace; frontend trims.
- `asking_price` (number): Asking price (can be 0).
- `Created Date` (number): Unix timestamp in milliseconds.
- Other fields (e.g. `sector`, `region`, `description`, `url`, `image`, `turnover`, `net_profit`, `Modified Date`, etc.) are preserved and shown in the admin row detail.

Optional in response: `response.total_count` (number), `response.by_source` (array of `{ source, count }`). If omitted, the frontend uses `listing.length` for total and derives `by_source` from the current page.

**Normalized shape used by the admin UI:**

- `listings` (array): Each item has `id` (from `_id`), `title` (from `business_name`), `source`, `location` (trimmed), `asking_price`, `date_added` (ISO string from `Created Date`), plus all raw fields for the expandable row.
- `total_count` (number): From response or `listings.length`.
- `by_source` (array): From response or computed from current page.

---

## 3. Admin access (get_user)

For the admin guard, the existing **get_user** workflow must return an `is_admin` field for users who are allowed to access `/admin`.

**Existing endpoint:** `POST /get_user` with body `{ "user_id": "..." }`.

**Response:** Include in the `response` object:

- `is_admin`: `true` or `"yes"` or `"true"` for admin users; otherwise omit or set to `false`/`"no"`.

The frontend treats the user as admin only when `is_admin` is truthy (boolean `true` or string `"true"`/`"yes"`).

---

## Summary

| Endpoint              | Method | Purpose                    |
|-----------------------|--------|----------------------------|
| `/get_user`           | POST   | Add `is_admin` to response |
| `/get_admin_stats`    | GET    | User/subscriber counts     |
| `/get_listings`       | GET    | Listings + filters + pagination |

All admin endpoints must be protected by the same auth as your other Bubble workflows (e.g. Bearer token). The frontend sends `Authorization: Bearer <VITE_BUBBLE_API_TOKEN>`.
