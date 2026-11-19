# MentorLagbe Server

REST API for **MentorLagbe**, a smart tuition and mentorship platform where Tutors post tuition batches, Students apply, and Admins moderate listings, users and Stripe revenue.

- **Live API:** `https://your-server.vercel.app` (replace after deployment)
- **Client repo / Live site:** `https://your-client.vercel.app` (replace after deployment)

## Admin credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@mentorlagbe.com` | `Admin@12345` |
| Tutor (Pro) | `tutor@mentorlagbe.com` | `Password@123` |
| Student | `student@mentorlagbe.com` | `Password@123` |

These accounts are created by `npm run seed`.

## Key features

- Role-based accounts (student, tutor, admin) with BetterAuth and the MongoDB adapter
- JWT verification with custom middlewares: `verifyToken`, `verifyStudent`, `verifyTutor`, `verifyAdmin`
- Tuition CRUD for tutors, with a Free plan limit of 2 posts (Pro is unlimited)
- Admin approval flow: only approved and active tuitions are public
- Server-side search, filters (subject, class level, mode) and pagination
- Student applications with duplicate protection and cancel-while-pending
- Tutor applicant management (accept or reject), with Pro student applications listed first
- Saved tuitions (bookmarks) for students, with a Free plan limit of 5
- Stripe Checkout for the Pro plan (Tutor $15, Student $10) with a webhook and a success-page verification fallback
- ImgBB image upload through the server, so the API key stays private
- Dashboard statistics for each role and public counters for the home page
- Seed script with realistic connected data

## Database (4 collections)

| Collection | Purpose |
|---|---|
| `users` | Accounts, role, plan, profile, saved tuitions (BetterAuth) |
| `tuitions` | Tuition posts and their approval status |
| `applications` | Student applications to tuitions |
| `payments` | Stripe Pro plan transactions |

BetterAuth also keeps its own `session`, `account`, `verification` and `jwks` collections for authentication.

## Getting started

```bash
npm install
cp .env.example .env     # Windows PowerShell: Copy-Item .env.example .env
# fill in .env, then:
npm run seed             # demo data (add -- --reset to wipe first)
npm run dev              # http://localhost:5000
```

### Environment variables

See `.env.example`. Every secret (MongoDB, BetterAuth, ImgBB, Stripe) is read from `.env`, which is git-ignored.

### Stripe webhook (local)

```bash
stripe listen --forward-to localhost:5000/api/payments/webhook
```

Copy the `whsec_...` value it prints into `STRIPE_WEBHOOK_SECRET`. In production, add a webhook endpoint in the Stripe Dashboard pointing to `https://your-server.vercel.app/api/payments/webhook` for the `checkout.session.completed` event.

## API overview

| Method | Path | Access |
|---|---|---|
| ALL | `/api/auth/*` | BetterAuth (sign up, sign in, session, `/token`, `/jwks`) |
| GET | `/api/tuitions` | Public: `search`, `subject`, `classLevel`, `mode`, `page`, `limit` |
| GET | `/api/tuitions/latest` | Public: 6 latest approved |
| GET | `/api/tuitions/filters` | Public: dropdown values |
| GET | `/api/tuitions/:id` | Public: details with tutor summary |
| GET, POST | `/api/tuitions/mine`, `/api/tuitions` | Tutor |
| PATCH, DELETE | `/api/tuitions/:id`, `/api/tuitions/:id/status` | Tutor (owner) |
| POST, GET, DELETE | `/api/applications`, `/mine`, `/:id` | Student |
| GET, PATCH | `/api/applications/received`, `/:id/status` | Tutor |
| GET, POST | `/api/bookmarks`, `/ids`, `/:tuitionId` | Student |
| GET, PATCH | `/api/users/me` | Any logged-in user |
| POST | `/api/uploads/image` | Any logged-in user (base64 JSON body) |
| GET, PATCH | `/api/admin/users`, `/users/:id/role` | Admin |
| GET, PATCH | `/api/admin/tuitions`, `/tuitions/:id/approval` | Admin |
| POST, GET | `/api/payments/checkout`, `/verify` | Student or Tutor |
| GET | `/api/payments` | Admin |
| POST | `/api/payments/webhook` | Stripe |
| GET | `/api/stats/public`, `/student`, `/tutor`, `/admin` | Public / by role |

Protected routes expect `Authorization: Bearer <jwt>`. The client gets the token with `authClient.token()`.

## Deployment (Vercel)

1. Import this repo in Vercel. `vercel.json` and `api/index.js` already route everything to the Express app.
2. Add all environment variables from `.env.example` (set `NODE_ENV=production`, `BETTER_AUTH_URL` to the server URL and `CLIENT_URL` to the client URL).
3. In MongoDB Atlas, allow network access from anywhere (`0.0.0.0/0`) for Vercel.
4. Add the Stripe webhook endpoint described above.

## npm packages

`express`, `cors`, `dotenv`, `mongodb`, `better-auth`, `@better-auth/mongo-adapter`, `stripe`, `jose`
