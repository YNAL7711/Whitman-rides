# Whitman Rides - Campus Ride-Sharing Application

A Next.js application for connecting Whitman College students to share rides.

## Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (via Supabase) with Prisma ORM
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **Real-time**: Supabase Realtime

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase project
- PostgreSQL database (via Supabase)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Whitman-rides
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `DATABASE_URL`: Your PostgreSQL connection string

4. Set up the database:
```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# Or create a migration (for production)
npm run db:migrate
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
Whitman-rides/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js App Router pages
│   ├── components/            # React components
│   │   └── ui/                # shadcn/ui components
│   ├── lib/                   # Utilities and configurations
│   │   ├── supabase/          # Supabase client setup
│   │   ├── actions/           # Server Actions
│   │   └── utils/             # Helper functions
│   ├── hooks/                 # React hooks
│   └── styles/                # Global styles
└── public/                    # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:studio` - Open Prisma Studio

## Features

- **Authentication**: Email/password auth with @whitman.edu domain validation
- **Ride Offers**: Create, view, and manage ride offers
- **Ride Requests**: Create, view, and manage ride requests
- **Matching**: Automatic matching algorithm based on origin, destination, time, and price
- **Real-time Messaging**: Chat with matched users via Supabase Realtime
- **Ratings**: Rate completed rides (1-5 stars with comments)
- **Notifications**: Real-time notifications for matches, messages, and ride updates
- **Ride History**: View completed rides and submit ratings
- **Profile Management**: Edit profile and view statistics

## Database Setup

After setting up your Supabase project:

1. Run Prisma migrations:
```bash
npm run db:migrate
```

2. Apply Row Level Security policies:
   - Open your Supabase SQL Editor
   - Copy and paste the contents of `prisma/rls-policies.sql`
   - Execute the SQL script

3. Enable Realtime for Message and Notification tables in Supabase Dashboard:
   - Go to Database > Replication
   - Enable replication for `Message` and `Notification` tables

## Deployment

### Vercel Deployment

1. Push your code to GitHub

2. Import your project in Vercel:
   - Go to [Vercel](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. Configure environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `DATABASE_URL` (from Supabase)
   - `NEXT_PUBLIC_SITE_URL` (your Vercel deployment URL)

4. Run database migrations:
   ```bash
   npm run db:migrate
   ```

5. Deploy!

### Post-Deployment Checklist

- [ ] Verify RLS policies are applied
- [ ] Enable Realtime for Message and Notification tables
- [ ] Test authentication flow
- [ ] Test ride creation and matching
- [ ] Test real-time messaging
- [ ] Verify notifications work

## Security

- **Row Level Security (RLS)**: All database tables protected with RLS policies
- **Email Validation**: Strict @whitman.edu domain validation in signup and middleware
- **Server Actions**: Input validation and sanitization
- **Type Safety**: Full TypeScript coverage
- **Environment Variables**: Sensitive data stored securely

## Architecture

- **Frontend**: Next.js 16 App Router with Server Components
- **Backend**: Server Actions for API logic
- **Database**: PostgreSQL via Supabase with Prisma ORM
- **Real-time**: Supabase Realtime subscriptions
- **Authentication**: Supabase Auth with custom email domain validation
- **Styling**: Tailwind CSS with shadcn/ui components

## License

ISC