# Vercel Deployment — Sangam Connect

## Stack

- **App:** Vercel (Next.js 16)
- **Database:** Supabase PostgreSQL
- **Media:** AWS S3 + CloudFront (see [DEPLOYMENT_AWS_S3.md](./DEPLOYMENT_AWS_S3.md))

## Build

`package.json` already includes:

```json
"build": "prisma generate && next build"
```

## Environment variables (Vercel)

| Variable | Required |
|----------|----------|
| `DATABASE_URL` | Yes — Supabase pooler URL recommended |
| `AUTH_SECRET` | Yes |
| `AUTH_URL` | Yes — `https://your-app.vercel.app` |
| `AWS_REGION` | For photo upload |
| `AWS_ACCESS_KEY_ID` | For photo upload |
| `AWS_SECRET_ACCESS_KEY` | For photo upload |
| `S3_BUCKET_NAME` | For photo upload |
| `CLOUDFRONT_URL` | For photo URLs |
| `GOOGLE_*` | Optional |
| `TWILIO_*` | Optional (SMS OTP) |

## Database setup

Run locally with production `DATABASE_URL`:

```bash
npx prisma migrate deploy
npm run db:seed
```

Do **not** run seed inside Vercel build.

## Prototype data

Vendor CSVs into `data/mumbai-2026/` then:

```bash
npm run db:seed
```

Optional: `SEED_CASE_LIMIT=200` for faster local dev.

## Google OAuth

Add redirect URI: `https://your-app.vercel.app/api/auth/callback/google`

## Deploy

Push to `main` → Vercel auto-deploys.
