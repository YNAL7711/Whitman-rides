# Quick Start Guide - Production Deployment

## Pre-Deployment Checklist

✅ **Supabase Setup:**
- [x] Project created
- [x] Email authentication enabled
- [x] Site URL configured
- [x] Environment variables ready

✅ **Database:**
- [x] Prisma migrations applied locally
- [x] RLS policies applied (from `prisma/rls-policies.sql`)
- [x] Realtime enabled for `Message` and `Notification` tables

✅ **Code:**
- [x] All files reviewed and fixed
- [x] No linting errors
- [x] Build script configured

## Quick Deployment Steps

### 1. Environment Variables

Create `.env.local` (if not already done):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://idjtqaqbvrkgxyrtemru.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
DATABASE_URL=your_direct_postgres_uri
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. Test Local Build

```bash
npm install
npm run db:generate
npm run build
```

If build succeeds, you're ready for production!

### 3. Deploy to Vercel

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Production ready"
   git push
   ```

2. **Create Vercel Project:**
   - Go to vercel.com
   - Import GitHub repository
   - Auto-detects Next.js

3. **Add Environment Variables in Vercel:**
   - Project Settings → Environment Variables
   - Add all 4 variables from `.env.local`
   - Set for Production, Preview, Development

4. **Run Production Migrations:**
   ```bash
   # Option 1: Locally (recommended)
   export DATABASE_URL="your_production_database_url"
   npm run db:migrate:deploy
   unset DATABASE_URL
   
   # Option 2: After first deployment, run in Vercel CLI
   ```

5. **Deploy:**
   - Click "Deploy" in Vercel
   - Wait for build to complete
   - Copy your Vercel URL

6. **Update Supabase Auth URLs:**
   - Supabase Dashboard → Authentication → URL Configuration
   - Add Vercel URL to Redirect URLs
   - Update Site URL to Vercel URL

7. **Update NEXT_PUBLIC_SITE_URL:**
   - Update in Vercel environment variables
   - Redeploy

### 4. Verify Deployment

- [ ] Visit Vercel URL
- [ ] Test signup/login
- [ ] Test creating rides
- [ ] Test matching
- [ ] Test messaging
- [ ] Test notifications

## Common Issues & Fixes

### Build Fails
- **Error:** Prisma Client not generated
- **Fix:** Build script includes `prisma generate` - should auto-fix

### Database Connection
- **Error:** Can't connect to database
- **Fix:** Verify `DATABASE_URL` uses direct connection (not pooled)

### RLS Errors
- **Error:** Row-level security policy violation
- **Fix:** Re-run `prisma/rls-policies.sql` in Supabase SQL Editor

### Realtime Not Working
- **Error:** Messages/notifications not updating
- **Fix:** Enable replication for `Message` and `Notification` in Supabase Dashboard

## Production Migration Command

For production deployments, always use:
```bash
npm run db:migrate:deploy
```

This applies migrations without creating new migration files (safe for production).

## Need Help?

See `DEPLOYMENT.md` for detailed instructions and troubleshooting.
