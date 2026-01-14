# Step-by-Step Vercel Deployment Guide

Follow these steps in order to deploy your Whitman Rides app to Vercel.

## Step 1: Commit and Push Your Code to GitHub

**1.1 Check what files need to be committed:**
```bash
git status
```

**1.2 Add all changes:**
```bash
git add .
```

**1.3 Commit with a descriptive message:**
```bash
git commit -m "Production ready - all build errors fixed"
```

**1.4 Push to GitHub:**
```bash
git push origin main
```

(If you're on a different branch, use that branch name instead of `main`)

---

## Step 2: Create Vercel Account and Project

**2.1 Go to Vercel:**
- Visit https://vercel.com
- Sign in with GitHub (recommended) or create an account

**2.2 Create New Project:**
- Click **"Add New..."** → **"Project"**
- Or click **"New Project"** button

**2.3 Import Your Repository:**
- You'll see a list of your GitHub repositories
- Find **"Whitman-rides"** (or your repo name)
- Click **"Import"**

**2.4 Configure Project:**
- Vercel will auto-detect Next.js
- **Framework Preset:** Next.js (should be auto-selected)
- **Root Directory:** `./` (leave as default)
- **Build Command:** `npm run build` (should be auto-filled)
- **Output Directory:** `.next` (should be auto-filled)
- **Install Command:** `npm install` (should be auto-filled)

**DO NOT CLICK DEPLOY YET** - We need to add environment variables first!

---

## Step 3: Add Environment Variables in Vercel

**3.1 Before deploying, click "Environment Variables" section**

**3.2 Add these 4 variables one by one:**

### Variable 1: NEXT_PUBLIC_SUPABASE_URL
- **Key:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://idjtqaqbvrkgxyrtemru.supabase.co`
- **Environment:** Select all three (Production, Preview, Development)
- Click **"Add"**

### Variable 2: NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** Your anon key (the JWT token you have)
- **Environment:** Select all three (Production, Preview, Development)
- Click **"Add"**

### Variable 3: DATABASE_URL
- **Key:** `DATABASE_URL`
- **Value:** Your direct PostgreSQL connection string from Supabase
  - Go to Supabase Dashboard → Project Settings → Database
  - Copy the **"Connection string"** under **"Connection pooling"** → **"Direct connection"**
  - It should look like: `postgresql://postgres:[YOUR-PASSWORD]@db.idjtqaqbvrkgxyrtemru.supabase.co:5432/postgres`
- **Environment:** Select all three (Production, Preview, Development)
- Click **"Add"**

### Variable 4: NEXT_PUBLIC_SITE_URL
- **Key:** `NEXT_PUBLIC_SITE_URL`
- **Value:** `https://your-app-name.vercel.app` (we'll update this after first deploy)
- For now, use: `https://whitman-rides.vercel.app` (or whatever Vercel suggests)
- **Environment:** Select all three (Production, Preview, Development)
- Click **"Add"**

**3.3 Verify all 4 variables are added:**
- You should see all 4 in the list
- Make sure they're enabled for Production, Preview, and Development

---

## Step 4: Deploy to Vercel

**4.1 Click "Deploy" button**
- Vercel will start building your project
- This takes 2-3 minutes

**4.2 Watch the build:**
- You'll see build logs in real-time
- Wait for it to complete
- Look for: `✓ Build completed successfully`

**4.3 Get your deployment URL:**
- After build completes, you'll see: `https://your-app-name.vercel.app`
- Copy this URL!

---

## Step 5: Update NEXT_PUBLIC_SITE_URL

**5.1 Go back to Environment Variables:**
- Project Settings → Environment Variables

**5.2 Update NEXT_PUBLIC_SITE_URL:**
- Find `NEXT_PUBLIC_SITE_URL`
- Click the three dots → **"Edit"**
- Change value to your actual Vercel URL (e.g., `https://whitman-rides-abc123.vercel.app`)
- Save

**5.3 Redeploy:**
- Go to **Deployments** tab
- Click **"..."** on the latest deployment → **"Redeploy"**
- Or just push a new commit to trigger redeploy

---

## Step 6: Run Database Migrations

**6.1 Get your production DATABASE_URL:**
- Copy the `DATABASE_URL` value from Vercel environment variables
- Or get it from Supabase Dashboard → Database → Connection string

**6.2 Run migrations locally:**
```bash
# Set the production database URL temporarily
export DATABASE_URL="your_production_database_url_here"

# Run production migrations
npm run db:migrate:deploy

# Unset the variable
unset DATABASE_URL
```

**Important:** This applies your Prisma schema to the production database.

---

## Step 7: Apply RLS Policies in Supabase

**7.1 Open Supabase SQL Editor:**
- Go to Supabase Dashboard → SQL Editor

**7.2 Run RLS Policies:**
- Open the file `prisma/rls-policies.sql` from your project
- Copy ALL the SQL code
- Paste it into Supabase SQL Editor
- Click **"Run"** or press Cmd/Ctrl + Enter

**7.3 Verify policies are created:**
- Go to Database → Tables
- Click on any table (e.g., "User")
- Check that "RLS" is enabled (should show a lock icon)

---

## Step 8: Enable Realtime in Supabase

**8.1 Go to Database → Replication:**
- In Supabase Dashboard

**8.2 Enable Realtime for:**
- **Message** table - Toggle ON
- **Notification** table - Toggle ON

**8.3 Verify:**
- Both should show "Realtime: Enabled"

---

## Step 9: Configure Supabase Auth Redirect URLs

**9.1 Go to Authentication → URL Configuration:**
- In Supabase Dashboard

**9.2 Update Site URL:**
- Set to your Vercel URL: `https://your-app-name.vercel.app`

**9.3 Add Redirect URLs:**
- Click **"Add URL"**
- Add: `https://your-app-name.vercel.app/**`
- Add: `https://your-app-name.vercel.app/dashboard`
- Click **"Save"**

---

## Step 10: Test Your Deployment

**10.1 Visit your Vercel URL:**
- Open `https://your-app-name.vercel.app` in browser

**10.2 Test Authentication:**
- Click "Get started" or "Sign in"
- Try signing up with a @whitman.edu email
- Try logging in

**10.3 Test Core Features:**
- Create a ride offer
- Create a ride request
- Check if matches appear
- Test messaging (if you have matches)
- Check notifications

**10.4 Check for Errors:**
- Open browser console (F12)
- Look for any red errors
- Check Vercel deployment logs if issues occur

---

## Troubleshooting Common Issues

### Build Fails
- Check Vercel build logs
- Ensure all environment variables are set
- Verify `package.json` has correct build script

### Database Connection Error
- Verify `DATABASE_URL` uses **direct connection** (not pooled)
- Check Supabase firewall allows connections

### Authentication Not Working
- Verify Supabase redirect URLs are configured
- Check `NEXT_PUBLIC_SITE_URL` matches your Vercel URL
- Ensure email domain validation is working

### RLS Policy Errors
- Re-run `prisma/rls-policies.sql` in Supabase SQL Editor
- Verify user is authenticated before database operations

### Realtime Not Working
- Verify Realtime is enabled for Message and Notification tables
- Check browser console for WebSocket errors

---

## Success Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] All 4 environment variables added
- [ ] First deployment successful
- [ ] NEXT_PUBLIC_SITE_URL updated with actual Vercel URL
- [ ] Database migrations run on production
- [ ] RLS policies applied in Supabase
- [ ] Realtime enabled for Message and Notification tables
- [ ] Supabase auth redirect URLs configured
- [ ] Application accessible at Vercel URL
- [ ] Authentication working
- [ ] All features tested and working

---

## Next Steps After Deployment

1. **Monitor Performance:**
   - Check Vercel Analytics
   - Monitor Core Web Vitals

2. **Set Up Custom Domain (Optional):**
   - Vercel → Settings → Domains
   - Add your custom domain

3. **Enable Automatic Deployments:**
   - Already enabled by default
   - Every push to main branch auto-deploys

4. **Set Up Database Backups:**
   - Supabase Dashboard → Database → Backups
   - Enable automatic backups

---

## Need Help?

If you encounter issues:
1. Check Vercel deployment logs
2. Check Supabase logs
3. Review browser console errors
4. Verify all environment variables are correct
5. Ensure database migrations completed successfully
