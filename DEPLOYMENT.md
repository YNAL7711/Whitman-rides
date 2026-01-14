# Deployment Guide - Whitman Rides

This guide covers deploying the Whitman Rides application to production on Vercel.

## Prerequisites

- ✅ Supabase project created and configured
- ✅ Environment variables set up locally
- ✅ Prisma migrations applied locally
- ✅ RLS policies applied in Supabase
- ✅ Realtime enabled for Message and Notification tables

## Step 1: Prepare Your Code

1. **Ensure all changes are committed:**
   ```bash
   git add .
   git commit -m "Production ready"
   ```

2. **Push to GitHub:**
   ```bash
   git push origin main
   ```

## Step 2: Set Up Vercel Project

1. Go to [Vercel](https://vercel.com) and sign in
2. Click **"New Project"**
3. Import your GitHub repository
4. Vercel will auto-detect Next.js

## Step 3: Configure Environment Variables in Vercel

In your Vercel project settings, add these environment variables:

### Required Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://idjtqaqbvrkgxyrtemru.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
DATABASE_URL=your_direct_postgres_connection_string
NEXT_PUBLIC_SITE_URL=https://your-vercel-app.vercel.app
```

**Important Notes:**
- Use the **direct connection string** (not pooled) for `DATABASE_URL`
- `NEXT_PUBLIC_SITE_URL` should be your Vercel deployment URL (you can update this after first deployment)
- All `NEXT_PUBLIC_*` variables are exposed to the browser - this is safe for anon keys

### How to Add Variables:

1. Go to **Project Settings → Environment Variables**
2. Add each variable for **Production**, **Preview**, and **Development**
3. Click **Save**

## Step 4: Run Production Database Migrations

**IMPORTANT:** Run migrations BEFORE deploying to ensure the database schema is ready.

### Option A: Run Migrations Locally (Recommended)

1. Set your production `DATABASE_URL` temporarily:
   ```bash
   export DATABASE_URL="your_production_database_url"
   ```

2. Run production migrations:
   ```bash
   npm run db:migrate:deploy
   ```

3. Unset the variable:
   ```bash
   unset DATABASE_URL
   ```

### Option B: Run Migrations via Vercel Build Command

Add this to your `package.json` scripts (already added):
```json
"build": "prisma generate && next build"
```

Vercel will automatically run `prisma generate` during build, but you still need to run migrations separately.

### Option C: Use Vercel CLI (Alternative)

```bash
# Install Vercel CLI
npm i -g vercel

# Link your project
vercel link

# Run migrations in production
vercel env pull .env.production
export DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2)
npx prisma migrate deploy
```

## Step 5: Deploy to Vercel

1. **First Deployment:**
   - After adding environment variables, click **"Deploy"**
   - Vercel will build and deploy your application
   - Wait for the build to complete

2. **Update Site URL:**
   - After first deployment, copy your Vercel URL (e.g., `https://whitman-rides.vercel.app`)
   - Update `NEXT_PUBLIC_SITE_URL` in Vercel environment variables
   - Redeploy (or it will update on next push)

## Step 6: Verify Deployment

1. **Check Build Logs:**
   - Go to your Vercel project → **Deployments**
   - Click on the latest deployment
   - Review build logs for any errors

2. **Test the Application:**
   - Visit your Vercel URL
   - Test authentication (signup/login)
   - Test creating rides
   - Test matching and messaging

3. **Check Database:**
   - Verify tables exist in Supabase
   - Check that RLS policies are active
   - Test that realtime subscriptions work

## Step 7: Configure Supabase Auth Redirect URLs

1. Go to **Supabase Dashboard → Authentication → URL Configuration**
2. Add your Vercel URL to **Redirect URLs:**
   ```
   https://your-app.vercel.app/**
   https://your-app.vercel.app/dashboard
   ```
3. Update **Site URL** to your Vercel URL

## Step 8: Post-Deployment Checklist

- [ ] Environment variables configured in Vercel
- [ ] Database migrations applied to production
- [ ] RLS policies active in Supabase
- [ ] Realtime enabled for Message and Notification tables
- [ ] Supabase auth redirect URLs configured
- [ ] Application accessible at Vercel URL
- [ ] Authentication working
- [ ] Database operations working
- [ ] Real-time features working (messages, notifications)

## Troubleshooting

### Build Fails with Prisma Errors

**Error:** `Prisma Client not generated`

**Solution:**
```bash
# The build script should handle this, but if it doesn't:
npm run db:generate
```

### Database Connection Errors

**Error:** `Can't reach database server`

**Solution:**
- Verify `DATABASE_URL` is correct in Vercel
- Ensure you're using the **direct connection** string (not pooled)
- Check Supabase firewall settings

### RLS Policy Errors

**Error:** `new row violates row-level security policy`

**Solution:**
- Verify RLS policies are applied: Run the SQL from `prisma/rls-policies.sql` again
- Check that policies allow the operations you're trying to perform
- Verify user authentication is working

### Realtime Not Working

**Error:** Messages/notifications not updating in real-time

**Solution:**
- Verify Realtime is enabled in Supabase Dashboard → Database → Replication
- Check that `Message` and `Notification` tables have replication enabled
- Verify WebSocket connections are not blocked

### Environment Variable Issues

**Error:** `NEXT_PUBLIC_SUPABASE_URL is undefined`

**Solution:**
- Ensure all `NEXT_PUBLIC_*` variables are set in Vercel
- Redeploy after adding environment variables
- Check variable names for typos

## Continuous Deployment

After initial setup, Vercel will automatically deploy on every push to your main branch:

1. Push changes to GitHub
2. Vercel detects the push
3. Builds and deploys automatically
4. Updates are live in seconds

## Production Best Practices

1. **Monitor Builds:** Check Vercel deployment logs regularly
2. **Database Backups:** Set up regular backups in Supabase
3. **Error Tracking:** Consider adding error tracking (Sentry, etc.)
4. **Performance:** Monitor Core Web Vitals in Vercel Analytics
5. **Security:** Regularly rotate API keys and review RLS policies

## Rollback Deployment

If something goes wrong:

1. Go to **Vercel → Deployments**
2. Find the last working deployment
3. Click **"..." → Promote to Production"**

## Support

For issues:
- Check Vercel deployment logs
- Check Supabase logs
- Review browser console for client-side errors
- Check network tab for API errors
