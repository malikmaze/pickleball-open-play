# SisClub Open Play

A mobile-first web app for managing pickleball open play sessions — registration, check-in, fair queueing, court assignment, and scoring.

Built with **Next.js**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **Supabase**, and **Framer Motion**.

## Features

- **Public registration** — no account needed; name, contact, skill level, optional note
- **Payment-aware flow** — optional payment required; admins mark players as Secured
- **Check-in** — moderators mark Present, Secured, No Show
- **Fair queue engine** — skill-matched groups of 4, balanced teams, games-played priority
- **Court management** — assign matches, record scores, winner animation
- **Public live courts** — `/sessions/[sessionId]/courts` (no login; admin controls when signed in)
- **Player status page** — queue position, games played, payment info

## Player flow

1. Browse today's sessions on `/dashboard`
2. Register at `/join?sessionId=...`
3. Track status at `/session/[sessionId]`
4. Watch live courts at `/sessions/[sessionId]/courts`
5. Organizer checks you in → you enter the queue
6. When called, you play → return to queue after the match

## Admin flow

1. Sign in at `/login`
2. Create sessions at `/admin`, or click **Sample play** for a demo session with live courts
3. Open **Manage** → `/admin/sessions/[id]`
   - **Overview** — snapshot
   - **Registrations** — all sign-ups
   - **Check-in** — mark Present / Secured / No Show
   - **Queue** — who's up next
   - **Courts** — `/sessions/[id]/courts` (public; admin controls when signed in)
   - **Settings** — full open play config (payment, match rules, courts, queue)

## Supabase setup

### 1. Run migrations (in order)

In Supabase **SQL Editor**:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_registration_queue_courts.sql`
3. `supabase/migrations/003_court_live_view.sql`
4. `supabase/migrations/004_test_players.sql`

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

### 4. Test players (optional)

Migration `004_test_players.sql` creates:
- `test_player_templates` — 24 reusable demo players (including Test Ace, Test Smash, etc.)
- `add_test_players_to_session(session_id)` — admin-only function to copy templates into a session

From the app: **Admin → Manage session → Registrations → Add test players**

Or in SQL Editor:

```sql
select public.add_test_players_to_session('your-session-uuid-here');
```

## Local development

```bash
pnpm install
pnpm dev
```

```bash
pnpm build
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
