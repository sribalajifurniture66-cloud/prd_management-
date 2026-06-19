# Furniture Stock & Sales Tracker
### Product Requirements Document

**Version 1.0 — June 19, 2026**
*Single-admin internal tool — no worker accounts*

---

## Table of Contents

1. [Overview](#1-overview)
2. [Core User Flow](#2-core-user-flow)
3. [Data Model](#3-data-model)
4. [Screens & Features](#4-screens--features)
5. [UI/UX Principles](#5-uiux-principles)
6. [Technical Setup](#6-technical-setup)
7. [Success Metrics](#7-success-metrics)
8. [Open Questions / Future Considerations](#8-open-questions--future-considerations)

---

## 1. Overview

### 1.1 Purpose
This document defines the requirements for a simple, internal web tool that lets the business owner track furniture stock and record sales. The tool replaces manual/mental tracking of what has sold, what is left, and at what price, with a single source of truth.

### 1.2 Background
The business sells furniture (chairs, tables, sofas, etc.). Each physical item in stock is unique and identified by a serial number. Previously there was no stock database — this PRD also covers setting one up from scratch.

### 1.3 Who Uses This
This is a single-user (admin/owner) tool. There are no worker accounts, no login roles, and no multi-user permissions. The owner is the only person who adds stock and records sales.

### 1.4 Goals
- Maintain an accurate, real-time record of every item: in stock or sold.
- Make recording a sale fast — pick item, see photo, enter sold price, done.
- Give the owner instant visibility into total stock, total sold, and revenue.
- Keep the interface extremely simple — minimal clicks, minimal typing, no clutter.

### 1.5 Non-Goals (Out of Scope for v1)
- Worker accounts, logins, or per-worker sales attribution.
- Customer-facing storefront or online checkout.
- Multi-location / multi-warehouse stock tracking.
- Automated reordering or supplier integration.

---

## 2. Core User Flow

### 2.1 Adding a New Item to Stock
1. Owner opens "Add Item" screen (or uses CSV bulk import for multiple items at once).
2. Owner enters: serial number, item name, category, listed price, and uploads a photo.
3. Item is saved to the database with status "In Stock" and a date-added timestamp.

### 2.2 Recording a Sale (End of Day)
1. Owner opens the "Log a Sale" screen.
2. Owner searches or picks a serial number from a list of in-stock items only.
3. The item's photo, name, and listed price automatically appear for confirmation.
4. Owner enters the price it actually sold for (pre-filled with listed price as a starting suggestion, editable).
5. Owner taps "Mark as Sold."
6. Item status flips to "Sold," sale price and sale date are recorded, and it disappears from the in-stock list immediately.

### 2.3 Viewing Stats (Dashboard)
The owner opens the Dashboard at any time to see live totals — no extra steps required. See section 4.2 for full detail.

---

## 3. Data Model

### 3.1 Database
Supabase (PostgreSQL + file storage), free tier. Chosen for reliability, real-time updates, and built-in image storage — over spreadsheet or browser-only storage options.

### 3.2 `items` Table

| Field | Type | Notes |
|---|---|---|
| `serial_number` | text (unique, primary key) | e.g. SN-0001. Entered manually or auto-suggested on add. |
| `name` | text | e.g. "Oak Dining Chair" |
| `category` | text | Chair / Table / Sofa / etc. — dropdown, not free text |
| `image_url` | text | Link to photo in Supabase Storage |
| `listed_price` | numeric | Intended selling price, set when item is added |
| `status` | text | "in_stock" or "sold" |
| `price_sold` | numeric, nullable | Filled in only when sold |
| `date_sold` | timestamp, nullable | Filled in only when sold |
| `date_added` | timestamp | Set automatically when item is created |

### 3.3 Why This Schema
- Tracking both `listed_price` and `price_sold` lets the dashboard show discounts and pricing accuracy with zero extra owner effort.
- `status` as a simple two-value field keeps filtering ("what's left," "what sold") trivial and fast.
- Each serial number is a unique single item (quantity is always 1 → 0); there is no batch/quantity logic to maintain.

---

## 4. Screens & Features

### 4.1 Log a Sale (primary daily screen)
This is the screen the owner will use most. It must be usable in under 15 seconds per sale.
- Search/select box showing only in-stock serial numbers (type-to-filter).
- Selected item auto-displays: photo, name, category, listed price.
- Single input: price sold (numeric keypad on mobile, pre-filled with listed price).
- One large, obvious "Mark as Sold" button.
- Confirmation message after submit (e.g. "SN-0001 marked sold for ₹12,000").

### 4.2 Dashboard (Admin Stats)
A read-only overview screen, viewable any time, always reflecting live data.

**Summary cards (top of screen)**
- Total items ever added
- Total currently in stock
- Total sold
- Total revenue (sum of price_sold)

**Tables**
- Sold items: serial, name, category, listed price, price sold, date sold — sortable, most recent first.
- In-stock items: serial, name, category, listed price, date added.

**Breakdowns**
- Sales by category (count and revenue).
- Optional: sales over time (daily/weekly revenue trend).

### 4.3 Add Item
- Form: serial number, name, category (dropdown), listed price, photo upload.
- Validation: serial number must be unique; clear error if duplicate.
- Saves item with status "in_stock."

### 4.4 Bulk Import (CSV)
- Owner uploads a CSV with columns matching the item fields (serial_number, name, category, listed_price; photos added/matched separately or after import).
- Tool validates the file, flags duplicate serial numbers, and shows a preview before committing.
- On confirm, all valid rows are inserted as "in_stock" items.

---

## 5. UI/UX Principles
The owner is the sole user and is not deeply technical, so every screen favors clarity over density.
- Large tap targets, minimal text entry, dropdowns and pickers over free-typing wherever possible.
- No nested menus — at most two screens away from any action (Home → Log a Sale, Home → Dashboard).
- Mobile-friendly by default, since end-of-day sale logging may happen from a phone in-store.
- Plain language only — no technical jargon, error codes, or database terms shown to the owner.
- Immediate visual confirmation after every action (item marked sold, item added, import complete).

---

## 6. Technical Setup

### 6.1 Stack
- **Frontend:** simple web app (mobile-friendly), built to call Supabase directly.
- **Backend/Database:** Supabase (PostgreSQL, free tier).
- **Image storage:** Supabase Storage bucket for item photos.

### 6.2 Setup Steps (Owner)
1. Create a free Supabase account at supabase.com.
2. Create a new project (name, database password, region).
3. Retrieve Project URL and anon public API key from Project Settings → API.
4. Share both with the developer to connect the app to the live database.

### 6.3 Security Note
Since this is a single-admin internal tool with no public sales features, access can be protected with a simple app-level password rather than full user-account infrastructure, keeping setup and daily use lightweight.

---

## 7. Success Metrics
- Owner can log a sale in under 15 seconds without assistance.
- Dashboard numbers always match reality with zero manual reconciliation.
- Zero data loss — every recorded sale persists in Supabase, accessible from any device.

---

## 8. Open Questions / Future Considerations
- Should sold items be editable/reversible (undo a mistaken sale)?
- Should there be low-stock or aging-inventory alerts in a future version?
- Should the dashboard support date-range filtering (e.g. "this month's sales")?
- Should there be a simple export (CSV) of sales data for accounting?
