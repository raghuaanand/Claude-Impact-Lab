# KHUMMELA

Missing persons identification platform — helping communities identify and locate missing persons.

**Tagline:** Together we find hope

## Features

- Email + password authentication (bcrypt hashed)
- Google OAuth sign-in
- Mobile + password or OTP authentication
- Role-based access: `USER` (volunteers) and `MANAGEMENT` (coordinators)
- 24-hour JWT sessions
- KHUMMELA-themed sign-in and sign-up UI

## Tech Stack

- Next.js 16 (App Router)
- Auth.js (NextAuth v5)
- Prisma 7 + PostgreSQL
- Tailwind CSS 4

## Quick Start

1. Copy environment file and configure variables:
   ```bash
   cp .env.example .env
   ```

2. Follow the full setup guide: **[docs/AUTH_SETUP.md](docs/AUTH_SETUP.md)**

   This covers PostgreSQL, `AUTH_SECRET`, Google OAuth, Twilio SMS for OTP, and database initialization.

3. Install dependencies and start:
   ```bash
   npm install
   npm run db:push
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

| Path | Description |
|------|-------------|
| `app/(auth)/` | Sign-in and sign-up pages |
| `app/dashboard/` | Protected user dashboard |
| `app/management/` | Management-only dashboard |
| `lib/auth.ts` | Auth.js configuration |
| `prisma/schema.prisma` | Database schema |
| `design-system/` | UI design guidelines |
| `skills/khummela-auth/` | Agent skill for auth patterns |
| `docs/AUTH_SETUP.md` | Post-implementation setup guide |
| `CLAUDE.md` | AI agent project guide |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Generate Prisma client and build |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Create and run migrations |
| `npm run db:studio` | Open Prisma Studio |

## Documentation

- [Authentication Setup Guide](docs/AUTH_SETUP.md) — Google, OTP, database, env vars
- [Design System](design-system/DESIGN_SYSTEM.md) — Colors, typography, components
- [CLAUDE.md](CLAUDE.md) — AI agent conventions
