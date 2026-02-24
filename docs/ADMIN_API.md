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

**Endpoint:** `GET /admin/get_listings`

**Query parameters:**

| Parameter   | Type   | Description                                |
|------------|--------|--------------------------------------------|
| `search`   | string | Optional. Search by listing title or location. |
| `source`   | string | Optional. Filter by source (e.g. BusinessesForSale, Rightbiz). |
| `page`     | number | Optional. 1-based page number for pagination.  |
| `page_size`| number | Optional. Number of results per page (e.g. 10). |

**Response shape:**

```json
{
  "listings": [
    {
      "id": "listing_abc",
      "title": "Business name or title",
      "source": "BusinessesForSale",
      "location": "London, UK",
      "asking_price": 250000,
      "date_added": "2025-01-15T10:00:00.000Z"
    }
  ],
  "total_count": 42,
  "by_source": [
    { "source": "BusinessesForSale", "count": 20 },
    { "source": "Rightbiz", "count": 12 }
  ]
}
```

- `listings` (array): Page of listing objects.
  - `id` (string): Unique ID.
  - `title` (string): Listing title/name.
  - `source` (string): Source name.
  - `location` (string | null): Location text.
  - `asking_price` (number | null): Asking price.
  - `date_added` (string): ISO date string.
- `total_count` (number): Total number of listings (for pagination).
- `by_source` (array, optional): Counts per source for summary cards. Each item: `{ source: string, count: number }`.

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
| `/admin/get_listings` | GET    | Listings + filters + pagination |

All admin endpoints must be protected by the same auth as your other Bubble workflows (e.g. Bearer token). The frontend sends `Authorization: Bearer <VITE_BUBBLE_API_TOKEN>`.
