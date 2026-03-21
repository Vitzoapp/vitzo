# Vitzo | Fresh Groceries & Daily Essentials

Vitzo is a professional, high-performance e-commerce platform built with Next.js 15 and Supabase. It features an optimized delivery batching system, role-based access control, and real-time order tracking.

---

## 🚀 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Components)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, RLS, RPC, Security Definer Functions)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Deployment**: [Vercel](https://vercel.com/)

---

## 🛠️ Local Development

### 1. Prerequisites
- Node.js 18+ and npm
- A Supabase Project

### 2. Environment Setup
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (optional, for admin scripts)
```

### 3. Database Migration
All schema definitions, RLS policies, and database functions are located in `supabase/schema.sql`. Run this script in your Supabase SQL Editor to set up the environment.

### 4. Install & Run
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the result.

---

## 🏗️ Project Architecture

### **Core Design Principles**
1. **Server-First**: We use React Server Components (RSC) for data fetching to ensure zero layout shift, instant page loads, and superior SEO.
2. **Transactional Integrity**: Critical operations (like checkout) use Supabase RPC functions (`process_checkout`) with pessimistic locking (`FOR UPDATE`) to prevent race conditions and ensure stock accuracy.
3. **Role-Based Security (RBAC)**: Security is enforced at the database level via Row Level Security (RLS) based on the `role` column in the `profiles` table.
4. **Smart Batching Logistics**: The application logic (Triggers and RPCs) group orders into delivery batches for eco-friendly routing.

### **Directory Structure**
- `/src/app`: Routes and Page components.
- `/src/app/actions`: Server Actions for state-changing operations (Auth, Search).
- `/src/components`: Reusable UI components.
- `/src/context`: React Context for client-side state (Cart, Search).
- `/supabase`: SQL schema and database logic.

---

## 🚢 Production Workflow

1. **Build Verification**: Always run `npm run build` locally before pushing to verify TypeScript and ESLint compliance.
2. **Branding & Assets**: Standard icons are managed via the Next.js file-based convention in `src/app/` (`favicon.ico`, `apple-icon.png`, `og-image.jpg`).
3. **Deployment**: Pushing to the `main` branch triggers an automatic build on Vercel.

---

## 📚 What to Learn for This Project
- **Next.js App Router**: Understand RSC vs RCC (Client Components) and Server Actions.
- **Supabase / PostgreSQL**: Familiarize yourself with RLS (Row Level Security) and PL/pgSQL for writing database functions.
- **Tailwind CSS**: Utility-first styling for consistent UI.

---

## ✍️ Coding Standards
- **Keep it Clean**: Avoid "AI-style" enthusiastic comments. Focus on self-documenting code.
- **Security Check**: Never perform sensitive checks only on the client. Always verify user identities via `auth.uid()` in RLS or RPC.
- **Type Safety**: Avoid using `any`. Define clear interfaces for your data models.

Developed with 💚 by the Vitzo Team.
