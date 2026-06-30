# SisClub Open Play

A mobile-first web app for managing pickleball open play sessions — anonymous player join flow, check-in, fair queueing, court assignment, live scoring, and activity feeds.

Built with **Next.js**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **Supabase**, and **Framer Motion**.

## Features

### Roles

| Role | Who | Can do |
|------|-----|--------|
| **Guest (player)** | Anyone — no account | Join open play with name/contact/skill, watch live & queue, cancel before check-in |
| **Admin** | Single organizer account in `public.admins` | Manage sessions, queue, check-in, courts, scores — **cannot** join open play |

**Guest navigation:** Dashboard, Sessions, Live (no login tab).

**Admin login:** `/login` only (link in landing page footer). Non-admin sign-in is rejected.

```sql
-- Create admin user in Supabase Auth, then:
insert into public.admins (email) values ('your-email@example.com');
```

**Guest join flow:** `/dashboard` → **Join** → `/join?sessionId=...` (details saved in browser for next time).

**Withdraw:** guests can leave while status is `Registered` (shown as Joined) or `Secured`. After `Present`, admin removes them from the queue.

### Live page

- `/live` — pick today's session
- `/sessions/[sessionId]/live` — public live view with:
  - Session header (title, location, courts, queue size, rules)
  - Queue panel (position, skill, games played, waiting time)
  - All courts on one page (existing court design)
  - Winner history (newest first)
  - Activity feed (latest 20 events from `activity_logs`)

### Queue system

Fair ordering and skill-aware matching are documented in **[docs/MATCHING-ENGINE.md](docs/MATCHING-ENGINE.md)**.

Summary (see doc for full detail):

1. Fewest games played
2. Longest waiting (`checked_in_at` / `last_played_at`)
3. Newbie lane when 4+ Newbies are waiting
4. Skill spread limits (Strict / Balanced / Flexible) for main pool

**Player-facing guide:** [docs/OPEN-PLAY-GUIDE.md](docs/OPEN-PLAY-GUIDE.md) — share with your group.

### Activity feed

Structured events in `activity_logs` (admins only write):

- Match finished / started
- Now calling
- Player checked in
- Payment confirmed
- Side change

## Guest (player) flow

1. Browse sessions on `/dashboard`
2. Tap **Join** → enter details at `/join?sessionId=...`
3. Track status at `/session/[sessionId]`
4. Watch live at `/sessions/[sessionId]/live`
5. Admin checks you in → you enter the queue
6. Cancel anytime before check-in; after that, ask admin to remove you

## Admin flow

1. Sign in at `/login` (admin email in `admins` table)
2. Create sessions at `/admin`, or **Sample play** for a demo
3. **Manage** → `/admin/sessions/[id]` (joined list, check-in, queue, settings)
4. Run courts at `/admin/sessions/[id]/courts`

## Supabase setup

### 1. Run migrations (in order)

In Supabase **SQL Editor**:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_registration_queue_courts.sql`
3. `supabase/migrations/003_court_live_view.sql`
4. `supabase/migrations/004_test_players.sql`
5. `supabase/migrations/005_feminine_test_roster.sql`
6. `supabase/migrations/006_auth_profiles_activity.sql`
7. `supabase/migrations/007_profile_on_signup_trigger.sql` — auto-creates `profiles` on signup (avoids 401 when email confirmation is enabled)
8. `supabase/migrations/008_profiles_player_only.sql` — profiles are always players; admins only via `admins` table
9. `supabase/migrations/009_secure_admin_check.sql` — `is_admin()` RPC; lock down direct `admins` reads
10. `supabase/migrations/010_player_withdraw_rls.sql` — withdraw before check-in; admin can remove
11. `supabase/migrations/011_anonymous_open_play.sql` — join open play without accounts
12. `supabase/migrations/012_player_skill_newbie.sql` — add **Newbie** player skill level
13. `supabase/migrations/013_player_wins_losses.sql` — per-session win/loss tallies for matching & leaderboard

### 2. Environment variables

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

### 3. Create admin user

1. **Authentication → Users** — create user with email/password
2. SQL Editor:

```sql
insert into public.admins (email) values ('your-email@example.com');
```

Only this account can sign in at `/login`. Players do not use accounts.

### 4. Test players (optional)

Migration `004_test_players.sql` adds `test_player_templates` and `add_test_players_to_session()`.

**Admin → Manage session → Joined → Add test players**

## Local development

```bash
pnpm install
pnpm dev
```

```bash
pnpm lint
pnpm build
```

## Queue engine

`src/lib/queue/queue-engine.ts`:

- `getEligiblePlayers()` — Present and Waiting (checked-in) players only
- `selectNextFourPlayers()` — fair + skill-aware selection
- `balanceTeams()` — balanced doubles teams
- `createNextMatchForCourt()` — full assignment
- `validateMatchScore()` — target score + win-by rules

## Player statuses

`Registered` (Joined) → `Secured` (if payment) → `Present` → `Waiting` → `Playing` → `Waiting` (after match) · `No Show`

## Deploy to Vercel

1. Push to GitHub
2. Import in [vercel.com](https://vercel.com)
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Run all migrations in Supabase SQL Editor
5. Deploy

## License

Private — SisClub PH © 2026
