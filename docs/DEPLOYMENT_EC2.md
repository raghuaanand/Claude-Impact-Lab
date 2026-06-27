# KHUMMELA — EC2 Deployment Guide

Deploy KHUMMELA on AWS EC2 with **Supabase (PostgreSQL)**, **PM2**, **Elastic IP**, and **HTTPS**.

---

## Architecture overview

```
                    ┌─────────────────────────────────────────┐
                    │              AWS EC2 (Ubuntu)              │
  Browser           │                                          │
  HTTPS :443  ─────►│  Nginx (SSL termination)                 │
                    │       │                                  │
                    │       ▼ HTTP :3000 (localhost only)      │
                    │  PM2 → next start (KHUMMELA app)         │
                    └───────────────┬──────────────────────────┘
                                    │
                                    │ DATABASE_URL (TLS)
                                    ▼
                    ┌─────────────────────────────────────────┐
                    │     Supabase PostgreSQL (managed)        │
                    └─────────────────────────────────────────┘
```

**You need a domain name** (e.g. `khummela.org` or `app.khummela.org`). Let's Encrypt does not issue certificates for bare IP addresses, so HTTPS requires a domain whose **A record** points to your Elastic IP.

---

## Database choice: Supabase vs alternatives

| Option | Ease with this stack | Notes |
|--------|----------------------|-------|
| **Supabase** (recommended) | Excellent | Managed PostgreSQL, dashboard, free tier. Works with Prisma via `DATABASE_URL`. |
| **Neon** | Excellent | Serverless Postgres, similar setup to Supabase. |
| **AWS RDS** | Moderate | Same VPC/networking concerns, more ops work. |
| **PostgreSQL on EC2** | Harder | You manage backups, patches, and security. |

**Recommendation:** Use **Supabase**. It is the easiest fit for Prisma on EC2 — no VPC peering, just a connection string in `.env`.

---

## Prerequisites checklist

- [ ] AWS account
- [ ] Domain name (Route 53, Namecheap, Cloudflare, etc.)
- [ ] Supabase account (free tier is fine for development)
- [ ] SSH key pair for EC2
- [ ] Git repo access (GitHub/GitLab) or a way to copy code to the server

**Estimated monthly cost (dev/small):**

| Service | Approx. cost |
|---------|----------------|
| EC2 `t3.small` | ~$15/month |
| Elastic IP (attached to running instance) | Free |
| Supabase free tier | Free (500 MB DB) |
| Domain | ~$10–15/year |
| **Total** | ~$15–20/month + domain |

---

## Part 1 — Supabase database setup

### Step 1.1: Create a Supabase project

1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Click **New project**.
3. Choose organization, name (e.g. `khummela`), region (pick closest to your EC2 region, e.g. `ap-south-1` for Mumbai).
4. Set a strong database password and save it securely.
5. Wait for the project to finish provisioning (~2 minutes).

### Step 1.2: Get the connection string

1. In Supabase: **Project Settings → Database**.
2. Under **Connection string**, select **URI**.
3. Choose **Direct connection** (best for a long-running Node app on EC2 with Prisma).

   Example format:
   ```
   postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres
   ```

   Or the direct host:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[project-ref].supabase.co:5432/postgres
   ```

4. Replace `[YOUR-PASSWORD]` with your database password.
5. Add `?sslmode=require` if not already present:
   ```
   postgresql://postgres:...@db.xxx.supabase.co:5432/postgres?sslmode=require
   ```

**Note:** Use **Direct connection** or **Session pooler** for PM2/Prisma. Avoid **Transaction pooler** (port 6543) unless you add `?pgbouncer=true` — direct connection is simpler on EC2.

### Step 1.3: Push schema from your machine (before or after EC2 deploy)

On your local machine with the project cloned:

```bash
# Set DATABASE_URL to Supabase URI in .env
npm run db:push
```

Or on EC2 after clone (same command). This creates `User`, `Account`, `Session`, etc.

### Step 1.4: Optional — restrict database access

Supabase allows connections from anywhere by default. For tighter security:

- Supabase Dashboard → **Database → Network restrictions** (if available on your plan)
- Or rely on strong password + SSL (`sslmode=require`)

---

## Part 2 — AWS EC2 instance

### Step 2.1: Launch EC2 instance

1. AWS Console → **EC2 → Instances → Launch instance**.
2. Settings:
   - **Name:** `khummela-app`
   - **AMI:** Ubuntu Server 24.04 LTS (64-bit)
   - **Instance type:** `t3.small` (minimum for Next.js; `t3.medium` for more traffic)
   - **Key pair:** Create or select an SSH key — download the `.pem` file
   - **Network:** Default VPC is fine for a simple deploy
3. **Security group** — create or edit rules:

   | Type | Port | Source | Purpose |
   |------|------|--------|---------|
   | SSH | 22 | Your IP only | Admin access |
   | HTTP | 80 | 0.0.0.0/0 | Certbot + redirect to HTTPS |
   | HTTPS | 443 | 0.0.0.0/0 | Public web traffic |

   Do **not** expose port 3000 publicly — Nginx proxies to it locally.

4. **Storage:** 20–30 GB gp3 is enough.
5. Launch the instance.

### Step 2.2: Allocate and attach Elastic IP

1. EC2 → **Elastic IPs → Allocate Elastic IP address**.
2. **Actions → Associate Elastic IP address** → select your instance.
3. Note the Elastic IP (e.g. `54.xxx.xxx.xxx`).

### Step 2.3: Point domain to Elastic IP

At your domain registrar (or Route 53):

1. Create an **A record**:
   - **Name:** `@` (root) or `app` (subdomain)
   - **Value:** your Elastic IP
   - **TTL:** 300 or default
2. Wait for DNS propagation (often 5–30 minutes; up to 48 hours).

Verify:
```bash
dig +short yourdomain.com
# Should return your Elastic IP
```

Use this domain everywhere below as `yourdomain.com`.

---

## Part 3 — Server initial setup

SSH into the instance:

```bash
chmod 400 /path/to/your-key.pem
ssh -i /path/to/your-key.pem ubuntu@YOUR_ELASTIC_IP
```

### Step 3.1: System packages

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx certbot python3-certbot-nginx
```

### Step 3.2: Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # v20.x
npm -v
```

### Step 3.3: Install PM2

```bash
sudo npm install -g pm2
pm2 -v
```

### Step 3.4: Create app directory

```bash
sudo mkdir -p /var/www/khummela
sudo chown ubuntu:ubuntu /var/www/khummela
cd /var/www/khummela
```

### Step 3.5: Clone the repository

```bash
git clone https://github.com/YOUR_ORG/YOUR_REPO.git .
# Or: git clone ... claude-imapct-lab && mv claude-imapct-lab/* .
```

If the repo is private, use a deploy key or personal access token.

---

## Part 4 — Application configuration

### Step 4.1: Production environment file

```bash
cd /var/www/khummela
cp .env.production.example .env
nano .env
```

Fill in all values (see `.env.production.example` in the repo). Critical production values:

```env
DATABASE_URL="postgresql://postgres:...@db.xxx.supabase.co:5432/postgres?sslmode=require"
AUTH_SECRET="<run: openssl rand -base64 32>"
AUTH_URL="https://yourdomain.com"

GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

TWILIO_ACCOUNT_SID="..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="..."
```

**`AUTH_URL` must use `https://` and match your public domain** (no trailing slash).

### Step 4.2: Install dependencies and build

```bash
cd /var/www/khummela
npm ci
npm run db:push    # apply schema to Supabase (first deploy only)
npm run build
```

Build runs `prisma generate && next build`. Fix any errors before continuing.

### Step 4.3: Test the app manually (optional)

```bash
npm run start
# On the server: curl http://localhost:3000
# Ctrl+C to stop
```

---

## Part 5 — PM2 (keep app running)

### Step 5.1: Use the project PM2 config

```bash
cd /var/www/khummela
pm2 start deploy/ecosystem.config.cjs
pm2 status
pm2 logs khummela
```

### Step 5.2: Save PM2 process list and enable startup on reboot

```bash
pm2 save
pm2 startup
# Run the command PM2 prints (sudo env PATH=...)
pm2 save
```

After a reboot, the app should auto-start.

### Useful PM2 commands

```bash
pm2 restart khummela    # after code/env changes
pm2 stop khummela
pm2 logs khummela --lines 100
pm2 monit
```

### Deploy updates (routine)

```bash
cd /var/www/khummela
git pull
npm ci
npm run build
pm2 restart khummela
```

---

## Part 6 — Nginx reverse proxy

Nginx receives HTTPS traffic and forwards to Next.js on port 3000.

### Step 6.1: Copy site config

```bash
sudo cp /var/www/khummela/deploy/nginx/khummela.conf /etc/nginx/sites-available/khummela
```

Edit the domain:

```bash
sudo nano /etc/nginx/sites-available/khummela
# Replace YOUR_DOMAIN with yourdomain.com (two places)
```

### Step 6.2: Enable site and test

```bash
sudo ln -sf /etc/nginx/sites-available/khummela /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

At this stage HTTP works: `http://yourdomain.com` → your app (no SSL yet).

---

## Part 7 — HTTPS with Let's Encrypt (Certbot)

**Requirements:** Domain A record must point to Elastic IP before running Certbot.

```bash
sudo certbot --nginx -d yourdomain.com
```

If you use `www` as well:

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow prompts (email, agree, redirect HTTP to HTTPS — choose **Redirect**).

Certbot updates Nginx for SSL and sets auto-renewal.

### Verify HTTPS

```bash
curl -I https://yourdomain.com
```

Open `https://yourdomain.com` in a browser — padlock should appear.

### Test certificate renewal

```bash
sudo certbot renew --dry-run
```

---

## Part 8 — Post-deploy: auth and OAuth

### Step 8.1: Update Google OAuth (if used)

Google Cloud Console → **Credentials → OAuth client**:

- **Authorized JavaScript origins:** `https://yourdomain.com`
- **Authorized redirect URIs:** `https://yourdomain.com/api/auth/callback/google`

### Step 8.2: Smoke test authentication

- [ ] Home page loads over HTTPS
- [ ] Email sign-up / sign-in
- [ ] Google sign-in (if configured)
- [ ] Mobile OTP (Twilio or check server logs in dev)
- [ ] Dashboard after login
- [ ] Session persists (24h cookie)

See also: [AUTH_SETUP.md](./AUTH_SETUP.md)

### Step 8.3: Create a management user

```bash
cd /var/www/khummela
npx prisma studio
# Or use Supabase Table Editor → User → set role to MANAGEMENT
```

---

## Part 9 — Security hardening (recommended)

### 9.1 SSH

- Keep port 22 restricted to your IP in the security group.
- Disable password auth (Ubuntu default uses keys only).

### 9.2 Firewall (UFW) on EC2

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

### 9.3 Environment secrets

- Never commit `.env` to git.
- Rotate `AUTH_SECRET` if compromised (forces re-login).

### 9.4 Automatic security updates (optional)

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## Troubleshooting

### App not loading

```bash
pm2 status
pm2 logs khummela --lines 50
curl http://127.0.0.1:3000
sudo nginx -t
sudo systemctl status nginx
```

### Database connection errors

- Confirm `DATABASE_URL` in `.env` on EC2.
- Test from EC2: `cd /var/www/khummela && npx prisma db execute --stdin <<< "SELECT 1"`
- Ensure Supabase project is active and password is correct.
- Include `?sslmode=require` for Supabase.

### HTTPS / Certbot fails

- DNS must resolve to Elastic IP: `dig +short yourdomain.com`
- Port 80 must be open (Certbot HTTP challenge).
- Nginx site must use correct `server_name`.

### Auth redirects to HTTP or wrong URL

- Set `AUTH_URL=https://yourdomain.com` in `.env`.
- Restart: `pm2 restart khummela`.

### 502 Bad Gateway from Nginx

- App not running: `pm2 restart khummela`.
- Wrong upstream port (should be `127.0.0.1:3000`).

### Build fails on EC2 (memory)

`t3.micro` may OOM during `next build`. Use `t3.small` or build locally and deploy artifacts, or:

```bash
export NODE_OPTIONS="--max-old-space-size=2048"
npm run build
```

---

## Alternative: Caddy instead of Nginx + Certbot

Caddy obtains and renews HTTPS automatically.

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

Use `deploy/caddy/Caddyfile` from the repo, then:

```bash
sudo cp /var/www/khummela/deploy/caddy/Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Disable Nginx if switching: `sudo systemctl stop nginx`.

---

## Quick reference

| Item | Value |
|------|--------|
| App directory | `/var/www/khummela` |
| PM2 app name | `khummela` |
| Internal port | `3000` (not public) |
| Public ports | `80`, `443` |
| PM2 config | `deploy/ecosystem.config.cjs` |
| Nginx config | `deploy/nginx/khummela.conf` |
| Env template | `.env.production.example` |
| Restart app | `pm2 restart khummela` |
| Auth setup | [AUTH_SETUP.md](./AUTH_SETUP.md) |

---

## Summary order of operations

1. Supabase project + `DATABASE_URL`
2. EC2 launch + security group (22, 80, 443)
3. Elastic IP + domain A record
4. SSH → Node, PM2, Nginx, clone repo
5. `.env` + `npm ci` + `db:push` + `build`
6. `pm2 start` + `pm2 startup`
7. Nginx reverse proxy
8. `certbot --nginx` for HTTPS
9. Update Google OAuth URLs + smoke test

After this, KHUMMELA runs on **HTTPS** at your domain, backed by **Supabase**, kept alive by **PM2** on **EC2**.
