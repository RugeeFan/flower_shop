# Royal Rose — VPS Deployment Runbook

Self-contained step-by-step for taking this repo from a fresh VPS to a
running Royal Rose store, with strict isolation from any other project
already on the same machine.

The whole pipeline is **two containers** (`royalrose-app` + `royalrose-db`)
under a private docker network, fronted by **your existing nginx** on the
host. Uploads + DB data live on the host as bind mounts — backups are just
`tar` + `pg_dump`.

> **Before you run any of this**, finish the **Stage 0 audit** (§1).
> You and I should both know what's already on this VPS before adding more.

---

## 1. Stage 0 — Server audit (READ-ONLY, run this first)

SSH into your VPS as the user that will own the deploy. Paste this whole
block into the shell; it doesn't modify anything, only reports.

```bash
echo "── OS ─────────────────────────────────────────"
uname -a
cat /etc/os-release 2>/dev/null

echo
echo "── Disk ───────────────────────────────────────"
df -h / /home /var /opt 2>/dev/null | sort -u

echo
echo "── Memory + CPU ───────────────────────────────"
free -h
nproc

echo
echo "── Docker ─────────────────────────────────────"
which docker && docker --version || echo "(docker not installed)"
docker compose version 2>/dev/null || echo "(compose plugin missing)"

echo
echo "── Running containers ─────────────────────────"
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null

echo
echo "── All containers (running + stopped) ─────────"
docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}' 2>/dev/null

echo
echo "── Docker networks ────────────────────────────"
docker network ls 2>/dev/null

echo
echo "── Docker volumes ─────────────────────────────"
docker volume ls 2>/dev/null

echo
echo "── Ports occupied ─────────────────────────────"
ss -tlnp 2>/dev/null | grep LISTEN | sort -k4 -t: -V

echo
echo "── Web servers ────────────────────────────────"
which nginx && nginx -v 2>&1 || echo "(no nginx)"
which caddy && caddy version || echo "(no caddy)"
ls /etc/nginx/sites-enabled/ 2>/dev/null
ls /etc/nginx/conf.d/ 2>/dev/null

echo
echo "── Existing postgres (host) ───────────────────"
which psql && psql --version || echo "(no host psql)"
systemctl is-active postgresql 2>/dev/null || echo "(no host postgres service)"

echo
echo "── Existing project dirs ──────────────────────"
ls /opt/ 2>/dev/null
ls /srv/ 2>/dev/null
ls /var/www/ 2>/dev/null

echo
echo "── Firewall ───────────────────────────────────"
sudo ufw status 2>/dev/null || sudo iptables -L INPUT -n 2>/dev/null | head -10
```

Paste the output back. We confirm together that:
- `3000`, `5432` are NOT in use (or pick alternates)
- No existing container is named `royalrose-*`
- No existing volume / network is named `royalrose*`
- You have enough disk (need ~5 GB headroom)
- Nginx is present and ready for a new server block

If anything is unexpected, stop. Don't continue.

---

## 2. Stage 2 — Prepare host directories (does NOT touch other projects)

Pick a project root. Default: `/opt/royalrose`. Adjust if your VPS has a
different convention.

```bash
sudo mkdir -p /opt/royalrose
sudo chown $USER:$USER /opt/royalrose
cd /opt/royalrose

mkdir -p uploads/products uploads/content uploads/settings
mkdir -p data/postgres
mkdir -p backups
```

Copy this repo into `/opt/royalrose` (`git clone` or `rsync` from your laptop).
Leave the local development clone elsewhere — these are separate copies.

Set up the env file. The example lives at `.env.example`:

```bash
cp .env.example .env
chmod 600 .env
vim .env
```

Fill in real values. Generate secrets:

```bash
openssl rand -hex 32   # use for SESSION_SECRET
openssl rand -hex 32   # use for JWT_SECRET
openssl rand -hex 24   # use for POSTGRES_PASSWORD (or longer)
```

Stripe keys are optional at first — leave them empty to run in dev-mode
bypass while you confirm everything else works.

---

## 3. Stage 3 — Dry-run + bring up

Validate first. This does not start anything:

```bash
docker compose config           # validates yaml + .env expansion
docker compose config --services # lists `app` and `db`
```

Build the image (does not start containers):

```bash
docker compose build app
```

Then start. The DB is brought up first because `app` has `depends_on: db`:

```bash
docker compose up -d
```

Watch the logs:

```bash
docker compose logs -f app
```

The `app` healthcheck should turn green within ~30 s. If not:

```bash
docker compose ps             # see health states
docker compose exec app sh    # poke around inside the container
```

Verify isolation on the host:

```bash
docker ps --filter name=royalrose
docker network ls   | grep royalrose
docker volume ls    | grep royalrose       # (none expected — we use bind mounts)
ss -tlnp | grep -E ':(3000|5432)'
```

Expected:
- Port 3000 listening **only on 127.0.0.1** (Nginx will proxy)
- Port 5432 not listening at all on the host
- Container names start with `royalrose-`
- Network `royalrose_net` exists; no other networks were touched

---

## 4. Stage 4 — Database migration + first admin

First-time migration:

```bash
docker compose exec app npx prisma migrate deploy
```

This applies every migration in `prisma/migrations/`. It's safe to re-run.

Seed (optional, only if first time and you want demo data):

```bash
docker compose exec app npx tsx prisma/seed.ts
```

Create the admin account:

```bash
docker compose exec app npx tsx prisma/create-admin.ts
```

This script prompts for email + password, or uses defaults — read the
file first. Change the password the moment you log in.

---

## 5. Stage 5 — Nginx reverse-proxy (host-level, ONE new server block)

Pick your subdomain (e.g. `royalrose.example.com`) and point DNS to the VPS
**before** you continue.

Create a new file — do NOT edit any existing site:

```bash
sudo vim /etc/nginx/sites-available/royalrose
```

Paste:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name royalrose.example.com;
    # Let certbot rewrite this to HTTPS after you run it (Step 5b).

    # Cap uploads at 10 MB at the proxy too (Remix enforces 8 MB).
    client_max_body_size 10m;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        "upgrade";
        proxy_read_timeout 60s;
    }

    # Optional: let Nginx serve uploads directly (skip Node) for speed.
    # Comment out if you want everything to go through Remix's route.
    location /uploads/ {
        alias /opt/royalrose/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
}
```

Enable and test:

```bash
sudo ln -s /etc/nginx/sites-available/royalrose /etc/nginx/sites-enabled/royalrose
sudo nginx -t
sudo systemctl reload nginx
```

If `nginx -t` fails, fix the config before reload. Never reload nginx with
a broken config — it would crash the entire web layer (other projects too).

### 5b. HTTPS via certbot (optional but recommended)

```bash
sudo certbot --nginx -d royalrose.example.com
```

Certbot rewrites the server block to add the 443/SSL listener and
auto-redirect 80 → 443. Re-`nginx -t`, re-reload.

---

## 6. Stage 6 — Smoke test from outside

From your laptop (not the VPS):

```bash
curl -I  https://royalrose.example.com/                   # 200
curl -I  https://royalrose.example.com/admin/login        # 200
curl -sI https://royalrose.example.com/api/page-content/home-promotion-bar
```

Then in a browser:
1. Visit homepage, scroll through, confirm visuals
2. Add to cart, /checkout, place a dev-mode order (Stripe disabled)
3. Log into `/admin`, edit a product, **upload an image**, save
4. SSH into VPS, confirm the uploaded file exists at
   `/opt/royalrose/uploads/products/<date>/<hex>.webp`
5. Verify the product detail page shows it

If you have STRIPE_SECRET_KEY set, run a `4242 4242 4242 4242` test card
through real Stripe.

---

## 7. Backups (Stage 7 — set this up before walking away)

A simple combined script is shipped at `scripts/backup.sh`. Cron entry:

```bash
crontab -e
```

Add:

```cron
# Royal Rose nightly backup at 03:30, keep last 14 days
30 3 * * * cd /opt/royalrose && ./scripts/backup.sh >> backups/backup.log 2>&1
```

The script tars `uploads/` and `pg_dump`s the DB into `/opt/royalrose/backups/`.
Restore is documented in `scripts/restore.sh` (read before running — it WILL
overwrite the live DB).

---

## 8. Updating later

Pull new code on the VPS, rebuild, restart — only the app container.
Database stays warm and uploads aren't touched.

```bash
cd /opt/royalrose
git pull origin main
docker compose build app
docker compose up -d app
docker compose exec app npx prisma migrate deploy   # only if migrations changed
docker compose logs -f app
```

Rolling back the app is similarly cheap — `git checkout <prev-sha>` + rebuild.

---

## 9. Things that are DESTRUCTIVE — never run by accident

| Command | What it kills |
|---------|---------------|
| `docker compose down -v` | named volumes — we use none, but check first |
| `rm -rf /opt/royalrose/data/postgres` | nukes the database |
| `rm -rf /opt/royalrose/uploads`       | nukes every uploaded image |
| `docker volume prune`                 | other projects' data too |
| `docker network prune`                | other projects' networks too |
| `docker system prune -a`              | every dangling image on the host |

Always have a recent backup before any of these. The cron job above
gives you up-to-14-days of rollback room.

---

## 10. Operations cheat sheet

```bash
# Status
docker compose ps
docker compose top
docker compose stats

# Logs
docker compose logs -f app
docker compose logs --tail=200 db

# Restart app only (e.g. after .env change)
docker compose restart app

# Shell into app container
docker compose exec app sh
docker compose exec app npx prisma studio   # NOT for prod, dev tooling

# Shell into db (psql)
docker compose exec db psql -U royalrose -d royalrose
```

---

## 11. Open questions you still need to answer

Before any of this lands on the VPS, confirm:

- [ ] Server IP / hostname / SSH user
- [ ] OS version (`uname -a`, `cat /etc/os-release`)
- [ ] Output of the Stage 0 audit block
- [ ] Whether port 3000 is free (or which alt port to use — also update compose)
- [ ] Whether nginx already exists and where its config lives
- [ ] Whether the DNS for `royalrose.<your-domain>` is set up
- [ ] Whether you want real Stripe keys on day one, or stay in dev-mode bypass

Until those are answered, this runbook is just documentation. Nothing
deploys on its own.
