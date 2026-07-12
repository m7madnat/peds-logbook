# Peds Anesthesia Logbook

A personal, single-user, de-identified case logbook for a pediatric cardiac
anesthesia fellow. No patient identifiers of any kind — this is a training
log, not a hospital record system.

## Running it locally

You need a Postgres database (local or hosted) — see "Local Postgres"
below if you don't have one yet.

1. `cp .env.local.example .env.local`, then fill in `DATABASE_URL`, a
   passphrase for `APP_PASSWORD`, and a random `AUTH_SECRET`
   (`openssl rand -hex 32`).
2. Run `db/schema.sql` once against your database (see below for how).
   **Already have a database from before the fellowship-level expansion?**
   Run `db/migration_002_fellowship_expansion.sql` instead — it only adds
   the new columns and does not touch any case you've already logged.
3. `npm install`
4. `npm run dev`, then open `http://localhost:3000`.

### Local Postgres (optional, only if not hosting yet)

- Install Postgres, then: `createdb peds_logbook`
- Apply the schema: `psql peds_logbook -f db/schema.sql`
- Use `DATABASE_URL=postgresql://localhost:5432/peds_logbook` (add a
  username/password if your local setup requires one)

---

## Putting it on the web (Render, free, no credit card)

This deploys the app so you can open it from your phone or any browser
without your computer running. Render's free tier is used for both the
database and the app.

**1. Push this project to GitHub.**
If you don't already have it in a repo: create a new repository on
github.com, then from this folder run:
```
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-new-repo-url>
git push -u origin main
```

**2. Create the database.**
- Go to [render.com](https://render.com) and sign up (no card required).
- Click **New → PostgreSQL**. Pick the free instance type. Create it.
- Once it's ready, open it and copy the **Internal Database URL** (you'll
  use this in step 4) — or the **External Database URL** if you want to
  run the schema step from your own computer instead of Render's console.
- Run `db/schema.sql` against it once, either:
  - from your computer: `psql "<External Database URL>" -f db/schema.sql`, or
  - by pasting the contents of `db/schema.sql` into Render's built-in
    database "Shell" / query console.

**3. Create the web service.**
- Click **New → Web Service**, connect your GitHub repo.
- Runtime: Node. Build command: `npm install && npm run build`.
  Start command: `npm run start`.
- Pick the free instance type.

**4. Add environment variables.**
On the web service's **Environment** tab, add:
- `DATABASE_URL` — the Internal Database URL from step 2
- `APP_PASSWORD` — your passphrase
- `AUTH_SECRET` — a long random string (`openssl rand -hex 32`)

**5. Deploy.**
Render builds and deploys automatically. When it's done, you'll get a
`https://your-app-name.onrender.com` URL — open it, log in with your
passphrase, and it's live.

**One thing to know:** on Render's free tier, the app "sleeps" after 15
minutes with no visitors, and the first request after that takes
30–60 seconds to wake back up. For a personal logbook you check between
cases, that's a non-issue — it's just not instant on the very first load
of the day. If that delay ever bothers you, Render's paid tier (a few
dollars/month) removes it.

## Backing up your data

Since your data now lives in Postgres instead of a local file, back it up
with `pg_dump` (Render also offers a **Backups** tab on the database
itself with one-click snapshots).

## Notes on privacy

The `cases` table intentionally has no name, MRN, date-of-birth, or other
identifier columns (see `db/schema.sql`). The API additionally rejects any
request body containing identifier-shaped field names as a second layer
of protection.
