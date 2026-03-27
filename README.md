# 🏎️ Shahzaib Electronics – E-Commerce & CRM Platform

A bespoke, high-performance Direct-to-Consumer (D2C) and B2B e-commerce platform built for the leading automotive accessories wholesaler in Lahore, Pakistan. 

This platform bypasses the limitations of generic SaaS solutions (like Shopify) by providing a completely custom, scalable Next.js architecture tailored specifically for the automotive parts industry. It handles complex product variants, vehicle fitment matrixes, and dynamic pricing, culminating in a seamless WhatsApp-integrated checkout flow.

![Next.js](https://img.shields.io/badge/Next.js_14-black?style=for-the-badge&logo=next.js&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

---

## 📸 Project Showcase
<p align="center">
  <img src="./docs/screenshots/home-page.png" width="48%" alt="Storefront Homepage showing Red/White Theme and Trending Models" />
  <img src="./docs/screenshots/product-detail.png" width="48%" alt="Product Detail Page with Variant Selector" />
</p>
<p align="center">
  <img src="./docs/screenshots/admin-dashboard.png" width="48%" alt="Admin Dashboard with Recharts Analytics" />
  <img src="./docs/screenshots/admin-inventory.png" width="48%" alt="Admin Inventory Data Table with Bulk Actions" />
</p>

---

## ✨ Core Features & Business Logic

### Public Storefront (Conversion-Optimized)
*   **The "Variant Loop":** Handles multi-dimensional product specs (e.g., 2GB/32GB vs 4GB/64GB Android Panels). Variant names, prices, and stock levels sync instantly on the UI and carry through to the cart and final order.
*   **Frictionless WhatsApp Checkout:** "Buy Now" direct-to-checkout flows integrated with the WhatsApp Business API. Generates highly formatted order strings including exact variant specs and customer details.
*   **Next-Gen AEO/SEO:** Server-Side Rendered (SSR) with a dynamic `sitemap.xml`, multi-layered `JSON-LD` schemas (Organization, Product, FAQPage), and edge-cached static generation to dominate Answer Engine Optimization (ChatGPT/Gemini) and Google Search.

### Admin "Mission Control" (Custom CRM)
*   **Mass Inventory Management:** A robust data-grid interface for managing hundreds of SKUs. Features powerful **Bulk Actions** to assign Tags, Categories, and Badges to multiple products simultaneously via atomic database transactions.
*   **Intelligent Analytics:** Interactive Recharts dashboards tracking revenue, active orders, and low-stock alerts, powered by heavily optimized Prisma aggregations.
*   **Automated Workflows:** Cron jobs for stale-order detection, automated Resend email confirmations (Customer & Admin), and Cloudinary media garbage collection (syncing DB deletes with cloud storage).
*   **Secure Team Management:** Role-Based Access Control (RBAC) via Supabase Auth with a custom, passwordless "Magic Link" invite flow for new staff members.

---

## 🏗️ Architecture & Technical Problem Solving

As a showcase of Senior-level engineering, several enterprise challenges were solved to ensure extreme stability on serverless infrastructure:

### 1. Combating N+1 Query Exhaustion & Timeouts
**The Problem:** Serverless functions on Vercel quickly exhausted Supabase's PostgreSQL connection limits, causing 500 errors during traffic spikes.
**The Solution:** 
*   Switched to **Supabase Transaction Pooler (Port 6543)** with `pgbouncer=true`.
*   Conducted a codebase-wide audit to eliminate `Promise.all()` DB spam.
*   Rewrote complex analytics queries using Prisma's `include`, `groupBy`, and single-trip relational fetching (reducing a 6.6s query down to 50ms).

### 2. Next.js Native Edge Caching (Tag-Based Invalidation)
**The Problem:** Standard in-memory caching fails in serverless environments, serving stale products to users.
**The Solution:** Implemented Next.js 14's native `unstable_cache`. Public storefront queries are cached at the Edge and tagged (e.g., `['products:all']`). Admin CUD (Create/Update/Delete) actions trigger `revalidateTag()`, instantly invalidating the global cache only when inventory actually changes.

### 3. The "Ghost Image" Fix
**The Problem:** Deleting a product in the database left the actual image files stranded in Cloudinary, inflating storage costs.
**The Solution:** Implemented a strict **"Fetch-Then-Clean"** architectural pattern. Server Actions securely destroy orphaned assets in Cloudinary *before* committing the Prisma database transaction.

---

## 💻 Developer Reference (Local Setup)

*This section is retained for internal agency use to quickly spin up the environment.*

### Prerequisites
*   Node.js 20.x (LTS recommended)
*   Supabase Project (PostgreSQL)
*   Cloudinary Account
*   Resend API Key

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/shahzaib-electronics.git
    cd shahzaib-electronics
    ```

2.  **Install dependencies:**
    ```bash
    npm install --legacy-peer-deps
    ```

3.  **Environment Variables:**
    Create a `.env.local` file. **Crucial:** Ensure `DATABASE_URL` uses the transaction pooler port (`6543`) with `pgbouncer=true&connection_limit=1`, while `DIRECT_URL` uses port `5432` for migrations.
    ```env
    DATABASE_URL="postgresql://postgres.[ID]:[PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
    DIRECT_URL="postgresql://postgres.[ID]:[PASSWORD]@aws-0-region.pooler.supabase.com:5432/postgres"
    # ... Add Cloudinary, Resend, and NextAuth variables
    ```

4.  **Database Setup:**
    Push the schema and generate the Prisma Client.
    ```bash
    npx prisma db push
    npx prisma generate
    ```

5.  **Run the Development Server:**
    ```bash
    npm run dev
    ```

6. **For Deployment Server:**
    ```bash
    npm run build
    npm run start
    ```

---
*Designed & Engineered by [Junaid Babar](https://junaidbabar.vercel.app) - Lahore, Pakistan (2026)*