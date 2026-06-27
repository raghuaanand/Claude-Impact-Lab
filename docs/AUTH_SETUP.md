# KHUMMELA Authentication Setup Guide

Follow these steps after the authentication code has been written. Complete each section in order.

---

## 1. PostgreSQL Database

### Option A: Local PostgreSQL

1. Install PostgreSQL if not already installed:
   ```bash
   # Ubuntu/Debian
   sudo apt install postgresql postgresql-contrib

   # macOS
   brew install postgresql@16
   ```

2. Create the database:
   ```bash
   sudo -u postgres psql
   CREATE DATABASE khummela;
   CREATE USER khummela_user WITH ENCRYPTED PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE khummela TO khummela_user;
   \q
   ```

3. Set `DATABASE_URL` in `.env`:
   ```
   DATABASE_URL="postgresql://khummela_user:your_password@localhost:5432/khummela?schema=public"
   ```

### Option B: Hosted PostgreSQL (Recommended for production)

Use any hosted provider:
- [Supabase](https://supabase.com) — free tier available
- [Neon](https://neon.tech) — serverless PostgreSQL
- [Railway](https://railway.app)
- AWS RDS, Google Cloud SQL, etc.

Copy the connection string into `DATABASE_URL` in your `.env` file.

---

## 2. Environment File

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Generate `AUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```
   Paste the output into `AUTH_SECRET` in `.env`.

3. Set `AUTH_URL` to your app URL:
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`

---

## 3. Initialize Database Schema

This project uses Prisma 7 with the `@prisma/adapter-pg` PostgreSQL driver adapter (configured in `lib/prisma.ts`).

Run Prisma commands:

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (development)
npm run db:push

# OR create a migration (recommended for production)
npm run db:migrate
```

Verify tables were created:
```bash
npm run db:studio
```
Open Prisma Studio in your browser and confirm `User`, `Account`, `Session`, `OtpCode`, etc. exist.

---

## 4. Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., "KHUMMELA")
3. Navigate to **APIs & Services → Credentials**

### Step 2: Configure OAuth Consent Screen

1. Go to **OAuth consent screen**
2. Choose **External** (or Internal for workspace)
3. Fill in app name: **KHUMMELA**
4. Add your email as developer contact
5. Add scopes: `email`, `profile`, `openid`

### Step 3: Create OAuth Client ID

1. Go to **Credentials → Create Credentials → OAuth client ID**
2. Application type: **Web application**
3. Name: `KHUMMELA Web`
4. Authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - `https://your-domain.com` (production)
5. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://your-domain.com/api/auth/callback/google`

### Step 4: Add to `.env`

```
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

Restart the dev server after updating `.env`.

---

## 5. SMS OTP Setup (Twilio)

OTP works in **development without Twilio** — codes are printed to the server console. For production, configure Twilio.

### Step 1: Create Twilio Account

1. Sign up at [Twilio](https://www.twilio.com/try-twilio)
2. Verify your phone number

### Step 2: Get a Phone Number

1. In Twilio Console, go to **Phone Numbers → Manage → Buy a number**
2. Choose a number with SMS capability
3. Note the number (e.g., `+1234567890`)

### Step 3: Get API Credentials

From the Twilio Console dashboard:
- **Account SID** — visible on the home dashboard
- **Auth Token** — click to reveal on the dashboard

### Step 4: Add to `.env`

```
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"
```

### Step 5: Test OTP

1. Start the dev server: `npm run dev`
2. Go to `/signup`, choose Mobile tab
3. Enter a phone number and click **Send OTP**
4. **Without Twilio:** Check terminal console for `[KHUMMELA SMS DEV]` log
5. **With Twilio:** Check the phone for the SMS

### Alternative SMS Providers

To use a different provider (AWS SNS, MessageBird, etc.), modify `lib/sms.ts` to call your provider's API. The rest of the OTP flow (`lib/otp.ts`) stays the same.

---

## 6. Create a Management User

New users default to the `USER` role. To create a management/coordinator account:

### After email registration

```bash
npm run db:studio
```
Open the `User` table, find the user, change `role` from `USER` to `MANAGEMENT`.

### Via SQL

```sql
UPDATE "User" SET role = 'MANAGEMENT' WHERE email = 'coordinator@example.com';
```

### Via Prisma in a script

```typescript
import { prisma } from "@/lib/prisma";

await prisma.user.update({
  where: { email: "coordinator@example.com" },
  data: { role: "MANAGEMENT" },
});
```

---

## 7. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Test Checklist

- [ ] **Home page** loads with KHUMMELA branding
- [ ] **Email sign up** at `/signup` → creates user → redirects to sign in
- [ ] **Email sign in** at `/signin` → redirects to `/dashboard`
- [ ] **Google sign in** → OAuth flow → redirects to `/dashboard`
- [ ] **Mobile sign up** → Send OTP → verify → create account
- [ ] **Mobile sign in (password)** → works with registered mobile
- [ ] **Mobile sign in (OTP)** → Send OTP → sign in with code
- [ ] **Session persists** for 24 hours (check browser cookies)
- [ ] **Sign out** clears session and redirects to sign in
- [ ] **Management user** can access `/management`
- [ ] **Regular user** is redirected away from `/management`

---

## 8. Production Deployment

### Environment Variables

Set all variables from `.env.example` in your hosting platform (Vercel, Railway, etc.):

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Production PostgreSQL URL |
| `AUTH_SECRET` | Yes | New secret for production |
| `AUTH_URL` | Yes | Production URL (e.g., `https://khummela.org`) |
| `GOOGLE_CLIENT_ID` | For Google login | Add production redirect URI |
| `GOOGLE_CLIENT_SECRET` | For Google login | |
| `TWILIO_*` | For SMS OTP | Required in production |

### Build Commands

```bash
npm run db:generate
npm run build
npm start
```

On Vercel, add `prisma generate` to the build script or use:
```json
"build": "prisma generate && next build"
```

### Google OAuth Production

Add your production domain to:
- Authorized JavaScript origins
- Authorized redirect URIs (`https://your-domain.com/api/auth/callback/google`)

---

## Troubleshooting

### "Invalid email or password"
- Confirm user exists in database (`npm run db:studio`)
- Ensure password was set during registration
- Check `password` field is not null

### Google sign-in redirects to error page
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`
- Confirm redirect URI matches exactly in Google Console
- Restart dev server after `.env` changes

### OTP not received
- **Dev mode:** Check server terminal for `[KHUMMELA SMS DEV]` log
- **Production:** Verify Twilio credentials and phone number has SMS capability
- Check rate limit (max 5 OTPs per hour per number)

### "AdapterError" or session issues
- Run `npm run db:push` to ensure all Auth.js tables exist
- Verify `AUTH_SECRET` is set

### Prisma client not found
```bash
npm run db:generate
```

### Management page redirects to dashboard
- User `role` must be `MANAGEMENT` in the database

---

## Quick Reference

| Task | Command / URL |
|------|---------------|
| Start dev server | `npm run dev` |
| Generate Prisma client | `npm run db:generate` |
| Push schema | `npm run db:push` |
| Database GUI | `npm run db:studio` |
| Sign in page | `/signin` |
| Sign up page | `/signup` |
| User dashboard | `/dashboard` |
| Management panel | `/management` |
| Auth API | `/api/auth/*` |
| Register API | `/api/register` |
| Send OTP API | `/api/send-otp` |
