---
name: khummela-auth
description: KHUMMELA authentication patterns — email/password, Google OAuth, mobile/OTP login, role-based access, and session management. Use when implementing auth features, protected routes, user roles, or OTP flows in the KHUMMELA missing persons platform.
---

# KHUMMELA Authentication

## When to Use

- Adding sign-in, sign-up, or session features
- Protecting routes by authentication or role
- Implementing OTP or mobile auth flows
- Managing user roles (`USER` vs `MANAGEMENT`)

## Stack

- Auth.js (NextAuth v5) — `lib/auth.ts`
- Prisma adapter + JWT sessions (24h max age)
- bcrypt password hashing — `lib/password.ts`
- Twilio SMS for OTP (dev: console log) — `lib/sms.ts`

## Credential Providers

| Provider ID | Use Case | Credentials |
|-------------|----------|-------------|
| `email-password` | Email sign-in | `email`, `password` |
| `mobile-password` | Mobile sign-in | `mobile`, `password` |
| `mobile-otp` | Mobile OTP sign-in | `mobile`, `otp` |
| `google` | Google OAuth | (redirect flow) |

## Client Sign-In

```tsx
import { signIn } from "next-auth/react";

// Email
await signIn("email-password", { email, password, redirect: false });

// Mobile password
await signIn("mobile-password", { mobile, password, redirect: false });

// Mobile OTP (after OTP sent via /api/send-otp)
await signIn("mobile-otp", { mobile, otp, redirect: false });

// Google
signIn("google", { callbackUrl: "/dashboard" });
```

## Server Session

```tsx
import { auth } from "@/lib/auth";

const session = await auth();
if (!session?.user) redirect("/signin");

// Role check
if (session.user.role !== "MANAGEMENT") redirect("/dashboard");
```

## Registration API

```tsx
// Email signup
await fetch("/api/register", {
  method: "POST",
  body: JSON.stringify({ type: "email", email, password, name }),
});

// Mobile signup (OTP must be sent first)
await fetch("/api/send-otp", {
  method: "POST",
  body: JSON.stringify({ mobile, purpose: "signup" }),
});
await fetch("/api/register", {
  method: "POST",
  body: JSON.stringify({ type: "mobile", mobile, password, otp, name }),
});
```

## OTP API

```tsx
await fetch("/api/send-otp", {
  method: "POST",
  body: JSON.stringify({ mobile, purpose: "login" | "signup" }),
});
```

- OTP expires in 10 minutes
- Rate limit: 5 requests per hour per mobile
- Dev mode: OTP logged to server console when Twilio is not configured

## Protected Routes

Add to `middleware.ts`:

```ts
export const config = {
  matcher: ["/your-route/:path*"],
};
```

Management-only: check `req.auth?.user?.role === "MANAGEMENT"`.

## Password Rules

- Minimum 8 characters
- Always hash with `hashPassword()` before storing
- Never log or return passwords

## Mobile Numbers

- Normalized via `normalizeMobile()` in `lib/mobile.ts`
- 10-digit numbers default to `+91` prefix
- Store and query using normalized format

## User Roles

- `USER` — default for all new registrations and Google sign-ups
- `MANAGEMENT` — set manually in database for coordinators

## Design System

Auth UI must follow `design-system/DESIGN_SYSTEM.md` — use `components/ui/` and KHUMMELA color tokens.

## Setup Reference

- Local auth setup (Google, Twilio, `AUTH_SECRET`): `docs/AUTH_SETUP.md`
- Production EC2 deploy (Supabase, PM2, HTTPS): `docs/DEPLOYMENT_EC2.md`
