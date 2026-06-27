# SisClub Open Play

A mobile-first web app for managing pickleball open play sessions. Players can browse today's schedule, join sessions, and track available slots. Organizers sign in to manage sessions from a protected admin panel.

Built with **Next.js**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, and **Supabase** (database + auth).

## Features

- **Landing page** — branded hero with quick access to sessions
- **Open Play Dashboard** — today's sessions with join/leave actions
- **Player join flow** — save profile in session for faster sign-ups
- **Organizer login** (`/login`) — Supabase email/password auth
- **Admin panel** (`/admin`) — protected; create, edit, delete, close/reopen sessions, clear players
- **Row Level Security** — public read/join; admin-only session management

## Prerequisites

- Node.js 18+
- pnpm
- A [Supabase](https://supabase.com) project (free tier works)

## Supabase setup

### 1. Create a project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project
2. Wait for the database to finish provisioning

### 2. Run the database migration

Open the **SQL Editor** in your Supabase dashboard and run the contents of:

```
supabase/migrations/001_initial_schema.sql
```

This creates the `sessions`, `players`, and `admins` tables, RLS policies, and sample data for today.

### 3. Enable email auth

1. In Supabase, go to **Authentication → Providers**
2. Ensure **Email** is enabled
3. For local dev, you may disable "Confirm email" under **Authentication → Settings** to skip verification

### 4. Create an admin user

1. Go to **Authentication → Users → Add user**
2. Create a user with email + password (e.g. `organizer@sisclub.ph`)

### 5. Add the admin email to the admins table

In the **SQL Editor**, run:

```sql
insert into public.admins (email)
values ('organizer@sisclub.ph');
```

Replace with the exact email you used when creating the auth user.

Only emails listed in `admins` can access `/admin`.

### 6. Get your API keys

From **Project Settings → API**, copy:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **publishable** key → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Local development

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in your Supabase values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

### 3. Run the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Build for production

```bash
pnpm build
pnpm start
```

## Project structure

```
src/
├── app/
│   ├── page.tsx          # Landing page
│   ├── dashboard/        # Today's open play schedule
│   ├── join/             # Player sign-up flow
│   ├── login/            # Organizer login
│   ├── admin/            # Protected organizer tools
│   └── auth/callback/    # Supabase auth callback
├── components/
├── hooks/                # useSessions, usePlayerProfile
├── lib/
├── utils/
│   └── supabase/         # Client, server, middleware, queries
│   ├── sessions.ts       # Mappers & helpers
│   └── player-profile.ts # Session-scoped player identity
└── types/
supabase/migrations/      # SQL schema + RLS
```

## Data model

**sessions** — `id`, `title`, `date`, `start_time`, `end_time`, `location`, `court_number`, `skill_level`, `max_players`, `status`, `created_at`

**players** — `id`, `session_id`, `name`, `contact_number`, `skill_level`, `joined_at`

**admins** — `id`, `email`, `created_at`

Player profile (name, contact, skill) is stored in `sessionStorage` for convenience. Session membership is stored in Supabase.

## Deploy to Vercel

1. **Push to GitHub**

   ```bash
   git add .
   git commit -m "Add Supabase backend"
   git push -u origin main
   ```

2. **Import in Vercel**
   - Go to [vercel.com](https://vercel.com) → **Add New → Project**
   - Import your repository

3. **Add environment variables**

   In Vercel project **Settings → Environment Variables**, add:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Your Supabase publishable key |

4. **Deploy**
   - Use the free **Hobby** plan
   - Click **Deploy**

5. **Update Supabase auth redirect URLs** (if using email confirmation)

   In Supabase **Authentication → URL Configuration**, add your Vercel domain to **Redirect URLs**:

   ```
   https://your-app.vercel.app/auth/callback
   ```

## License

Private — SisClub PH © 2026
