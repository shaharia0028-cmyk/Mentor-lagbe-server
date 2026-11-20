# MentorLagbe Server

REST API for **MentorLagbe**, a smart tuition and mentorship platform where Tutors post tuition batches, Students apply, and Admins moderate listings, users and Stripe revenue.

- **Live API:** [https://mentor-lagbe-server-pi.vercel.app](https://mentor-lagbe-server-pi.vercel.app)
- **Live site (client):** [https://mentor-lagbe-client-lyart.vercel.app](https://mentor-lagbe-client-lyart.vercel.app)

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

See `.env.example`. Every secret (MongoDB, BetterAuth, ImgBB, Stripe) is