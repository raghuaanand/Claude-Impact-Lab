# KHUMMELA — Project Guide for AI Agents

KHUMMELA is a missing persons identification platform. This document defines project conventions, architecture, and rules for AI-assisted development.

## Project Overview

- **Purpose:** Help communities identify and locate missing persons
- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Prisma 7, PostgreSQL, Auth.js (NextAuth v5)
- **Auth:** Email/password, Google OAuth, mobile/password, mobile/OTP
- **Roles:** `USER` (volunteers) and `MANAGEMENT` (coordinators/admin)

## Critical Rules

1. **Read Next.js docs** in `node_modules/next/dist/docs/` before writing Next.js code — this version may differ from training data (see `AGENTS.md`).
2. **Follow the design system** in `design-system/DESIGN_SYSTEM.md` for all UI work.
3. **Never store plain-text passwords** — always use `hashPassword()` from `lib/password.ts`.
4. **Session duration is 24 hours** — configured in `lib/auth.ts`; do not change without explicit request.
5. **Role-based access:** Management routes under `/management` require `MANAGEMENT` role (enforced in `middleware.ts`).

## Architecture

```
app/
  (auth)/signin, signup     # Public auth pages
  api/auth/[...nextauth]    # Auth.js handlers
  api/register              # Email & mobile registration
  api/send-otp              # OTP delivery
  dashboard/                # Protected (any authenticated user)
  management/               # Protected (MANAGEMENT role only)
  generated/prisma/         # Prisma client (auto-generated)

lib/
  auth.ts                   # Auth.js configuration
  prisma.ts                 # Prisma client singleton
  password.ts               # bcrypt hashing
  otp.ts                    # OTP generation & verification
  sms.ts                    # Twilio SMS (dev: console fallback)
  mobile.ts                 # Mobile number normalization

components/
  ui/                       # Design system primitives
  auth/                     # Auth forms and buttons
```

## Authentication Flows

### Email Sign Up
1. User submits form → `POST /api/register` (type: email)
2. Password hashed, user created with `USER` role
3. Redirect to sign-in

### Email Sign In
1. `signIn("email-password", { email, password })`
2. Credentials provider validates via bcrypt
3. JWT session created (24h)

### Mobile Sign Up
1. Send OTP → `POST /api/send-otp` (purpose: signup)
2. User enters OTP + password → `POST /api/register` (type: mobile)
3. OTP verified, password hashed, user created

### Mobile Sign In
- **Password:** `signIn("mobile-password", { mobile, password })`
- **OTP:** Send OTP → `signIn("mobile-otp", { mobile, otp })`

### Google OAuth
- `signIn("google")` — user created via Prisma adapter
- Default role: `USER`

## Database

- **Provider:** PostgreSQL
- **ORM:** Prisma 7 with config in `prisma.config.ts`
- **Client output:** `app/generated/prisma`
- **Commands:** `npm run db:generate`, `npm run db:push`, `npm run db:migrate`

### Promoting Users to Management

```sql
UPDATE "User" SET role = 'MANAGEMENT' WHERE email = 'admin@example.com';
```

Or via Prisma Studio: `npm run db:studio`

## Environment Variables

See `.env.example` and `docs/AUTH_SETUP.md` for full setup guide.

Required:
- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_URL`

Optional (feature-gated):
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Google login
- `TWILIO_*` — SMS OTP in production

## UI Conventions

- Use KHUMMELA color tokens (`khummela-primary`, `khummela-accent`, etc.)
- Auth pages use split layout in `app/(auth)/layout.tsx`
- All forms use `components/ui/` primitives
- Copy tone: empathetic, hopeful, action-oriented

## Adding New Protected Routes

1. Add path to `middleware.ts` `config.matcher`
2. Add redirect logic for unauthenticated users
3. For management-only routes, check `req.auth?.user?.role === "MANAGEMENT"`

## Skills

Project-specific agent skills live in `skills/`:
- `skills/khummela-auth/SKILL.md` — Authentication patterns

## Post-Setup

After code changes involving auth or database, refer to `docs/AUTH_SETUP.md` for environment configuration steps.

For production deployment on AWS EC2 with Supabase, PM2, and HTTPS, see `docs/DEPLOYMENT_EC2.md`.
