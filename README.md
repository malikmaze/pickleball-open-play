# SisClub Open Play

A mobile-first web app for managing pickleball open play sessions — registration, check-in, fair queueing, court assignment, and scoring.

Built with **Next.js**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **Supabase**, and **Framer Motion**.

## Features

- **Public registration** — no account needed; name, contact, skill level, optional note
- **Payment-aware flow** — optional payment required; admins mark players as Secured
- **Check-in** — moderators mark Present, Secured, No Show
- **Fair queue engine** — skill-matched groups of 4, balanced teams, games-played priority
- **Court management** — assign matches, record scores, winner animation
- **Player status page** — queue position, games played, payment info

## Player flow

1. Browse today's sessions on `/dashboard`
2. Register at `/join?sessionId=...`
3. Track status at `/session/[sessionId]`
4. Organizer checks you in → you enter the queue
5. When called, you play → return to queue after the match

## Admin flow

1. Sign in at `/login`
2. Create sessions at `/admin`
3. Open **Manage** → `/admin/sessions/[id]`
   - **Overview** — snapshot
   - **Registrations** — all sign-ups
   - **Check-in** — mark Present / Secured / No Show
   - **Queue** — who's up next
   - **Courts** — `/admin/courts/[id]`
   - **Settings** — courts, scoring, payment rules

## Supabase setup

### 1. Run migrations (in order)

In Supabase **SQL Editor**:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_registration_queue_courts.sql`

### 2. Environment variables

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

### 3. Create admin user

1. **Authentication → Users** — add user with email/password
2. SQL Editor:

```sql
insert into public.admins (email) values ('your-email@example.com');
```

## Local development

```bash
npm install
npm run dev
```

```bash
npm run build
```

## Queue engine

`src/lib/queue/queue-engine.ts` exposes:

- `getEligiblePlayers()` — who's allowed in queue
- `selectNextFourPlayers()` — fair + skill-aware selection
- `balanceTeams()` — high+low vs mid+mid pairing
- `createNextMatchForCourt()` — full assignment
- `validateMatchScore()` — target score + win-by rules

Skill values: Beginner=1, Novice=2, Intermediate Low=3, Intermediate High=4, Advanced=5

## Player statuses

`Registered` → `Secured` (if payment) → `Present` → `Waiting` → `Playing` → `Waiting` (after match) · `No Show` / `Finished`

## Deploy to Vercel

1. Push to GitHub
2. Import in [vercel.com](https://vercel.com) (Hobby plan)
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Deploy

## License

Private — SisClub PH © 2026
