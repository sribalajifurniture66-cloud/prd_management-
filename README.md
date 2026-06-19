# Furniture Stock & Sales Tracker

A single-admin web app for tracking furniture stock and recording sales in real time.

## Quick Start

### Prerequisites
- Node.js 18+ installed
- A free Supabase account (supabase.com)

### 1. Supabase Setup (5 min)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (pick a region close to you)
3. Wait for the project to initialize
4. Go to **SQL Editor** → paste contents of `migrations/001_init.sql` → click **Run**
5. Go to **Settings** → **API** → copy your **Project URL** and **anon public key**

### 2. Environment Setup

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=<your_project_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
NEXT_PUBLIC_ADMIN_PASSWORD=<pick_a_strong_password>
```

### 3. Install & Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Enter your admin password to login, then start using the app.

## Deployment to Vercel (1 click)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repo
4. Add the three environment variables from `.env.local` in Vercel's settings
5. Deploy

Your app will be live at a Vercel URL instantly.

## Features

### Log a Sale (Daily Workflow)
- Search for an in-stock item by serial number or name
- Item photo and listed price appear for confirmation
- Enter actual sale price (pre-filled with listed price)
- Mark as sold in one click
- Item disappears from in-stock list

### Dashboard (Live Stats)
- Total items added, in stock, sold, total revenue
- Recently sold items table (sortable)
- In-stock items table
- Sales breakdown by category
- Revenue trend chart

### Add Item
- Simple form: serial number, name, category, price, photo
- Photo upload to Supabase Storage (optional)
- Validates duplicate serial numbers

### Bulk Import
- Upload CSV with columns: `serial_number`, `name`, `category`, `listed_price`
- Preview before import
- Validation errors shown clearly
- Batch insert all valid rows

## CSV Import Format

Create a file `items.csv`:

```
serial_number,name,category,listed_price
SN-0001,Oak Dining Chair,Chair,5000
SN-0002,Glass Coffee Table,Table,8000
SN-0003,Grey Sofa,Sofa,35000
```

Then upload via the Import page.

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **React** (UI components)
- **Tailwind CSS** (styling)
- **Supabase** (PostgreSQL + Storage)
- **Vercel** (hosting)
- **recharts** (dashboard charts)
- **papaparse** (CSV parsing)

## FAQ

**Q: Can multiple users login?**  
A: No. This is single-admin only. The password is a simple gate, not full authentication.

**Q: Can I edit/undo a sale?**  
A: Not in v1. Sales are permanent once marked. Plan for accuracy when logging.

**Q: Where are my photos stored?**  
A: In Supabase Storage (`item-photos` bucket). The URLs are stored in the database.

**Q: Can I export data?**  
A: Yes, download the CSV directly from Supabase's SQL Editor or use the Tables view.

**Q: How much will Supabase cost?**  
A: For a small business, the free tier is plenty. Upgrade only if you hit limits.

## Support

For issues:
1. Check `.env.local` is set correctly (copy-paste Project URL and anon key)
2. Re-run `migrations/001_init.sql` if photo uploads fail (it creates the bucket and upload policy)
3. Check database table exists (run the SQL migration)
4. Check browser console for errors (F12)

---

Built with simplicity first — no fancy features, just what the PRD requires. Deploy to Vercel and you're done.
