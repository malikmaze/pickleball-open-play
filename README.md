# SisClub Open Play

A mobile-first web app for managing pickleball open play sessions. Players can browse today's schedule, join sessions, and track available slots. Organizers can create and manage sessions from a simple admin panel.

Built with **Next.js**, **TypeScript**, **Tailwind CSS**, and **shadcn/ui**. Data is stored in the browser's local storage for the MVP, making it easy to extend with a real backend later.

## Features

- **Landing page** — branded hero with quick access to sessions
- **Open Play Dashboard** — today's sessions with join/leave actions
- **Player join flow** — save profile locally for faster sign-ups
- **Organizer admin** (`/admin`) — create, edit, delete, close/reopen sessions, clear players
- **Mobile-first UI** — bottom navigation, soft cards, toast notifications, confirmation dialogs

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install & run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for production

```bash
npm run build
npm start
```

## Project structure

```
src/
├── app/              # Next.js App Router pages
│   ├── page.tsx      # Landing page
│   ├── dashboard/    # Today's open play schedule
│   ├── join/         # Player sign-up flow
│   └── admin/        # Organizer tools
├── components/       # UI components
├── hooks/            # React hooks (useAppData)
├── lib/              # Storage, auth placeholder, constants
└── types/            # TypeScript types
```

## Data model

Data is persisted in `localStorage` under the key `sisclub-open-play-data`.

**Session:** `id`, `title`, `date`, `startTime`, `endTime`, `location`, `courtNumber`, `skillLevel`, `maxPlayers`, `status`, `players[]`

**Player:** `id`, `name`, `contactNumber`, `skillLevel`, `joinedAt`

Sample sessions are seeded automatically on first load.

## Deploy to Vercel (Hobby plan)

The Hobby plan is free for personal and small projects.

1. **Push to GitHub**
   ```bash
   git init   # if not already a repo
   git add .
   git commit -m "Initial SisClub Open Play MVP"
   git remote add origin https://github.com/YOUR_USERNAME/pickleball-open-play.git
   git push -u origin main
   ```

2. **Import in Vercel**
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click **Add New → Project**
   - Import your GitHub repository

3. **Use the free Hobby plan**
   - Vercel auto-detects Next.js — no extra config needed
   - Keep the default **Hobby** plan

4. **Deploy**
   - Click **Deploy**
   - Your app will be live at `https://your-project.vercel.app`

## Extending the MVP

- **Authentication:** Replace stubs in `src/lib/auth.ts` with NextAuth, Clerk, or similar
- **Backend:** Swap `src/lib/storage.ts` for API calls to Supabase, Firebase, or a custom API
- **Multi-day schedule:** Filter sessions by date instead of today only

## License

Private — SisClub PH © 2026
