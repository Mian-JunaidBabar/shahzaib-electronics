# 🚀 Deployment Guide - Shahzaib Electronics

## ✅ Build Status
Your application is now **production-ready** with all dependencies at stable versions.

---

## 📦 Package Versions (Stable)
- **Next.js**: 16.1.4 ✅
- **React**: 19.2.3 ✅
- **Prisma**: 7.4.2 ✅
- **TypeScript**: 5.x ✅
- **Tailwind CSS**: 4.x ✅

All dependencies are locked at stable versions for reliable deployments.

---

## 🔐 Environment Variables Setup

### Required for Production

Copy `.env.example` to create your production `.env` file and fill in the following variables:

#### 1. **Database (PostgreSQL)**
```env
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
DIRECT_URL="postgresql://user:password@host:5432/database?sslmode=require"
```
- Get these from your Supabase project dashboard
- Both URLs should point to your Supabase PostgreSQL instance
- `sslmode=require` is required for secure connections

#### 2. **Supabase Authentication**
```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```
📍 **Where to find**: Supabase Dashboard → Settings → API
- `NEXT_PUBLIC_*` vars are safe to expose to the client
- `SERVICE_ROLE_KEY` must be kept secret (server-side only)

#### 3. **Cloudinary (Image Management)**
```env
# Server-side (keep secret)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Client-side (safe to expose)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="your-unsigned-preset"
```
📍 **Where to find**: Cloudinary Dashboard → Settings → Access Keys
- Create an unsigned upload preset for client-side uploads
- Upload preset: Settings → Upload → Add upload preset

#### 4. **WhatsApp Integration**
```env
NEXT_PUBLIC_WHATSAPP_NUMBER="923021191771"
WHATSAPP_BUSINESS_PHONE="+92 302 1191771"
```
- Use your business WhatsApp number (without spaces for `NEXT_PUBLIC_*`)
- Format with country code (92 for Pakistan)

#### 5. **Email (Resend)**
```env
RESEND_API_KEY="re_your_api_key"
```
📍 **Where to find**: https://resend.com/api-keys
- Sign up for Resend if you don't have an account
- Create an API key in the dashboard

#### 6. **Auth Secret**
```env
BETTER_AUTH_SECRET="your-secret-key"
```
🔑 **Generate with**: `openssl rand -base64 32`

#### 7. **Admin Credentials (for seeding)**
```env
ADMIN_EMAIL="owner.shahzaib.autos@gmail.com"
ADMIN_PASSWORD="YourSecurePassword123!"
ADMIN_NAME="Shahzaib"
```

---

## 🚢 Deployment Platforms

### **Vercel (Recommended)**

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Production ready build"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Vercel will auto-detect Next.js

3. **Set Environment Variables**
   - In Vercel Dashboard → Settings → Environment Variables
   - Copy all variables from your `.env.local` or `.env.example`
   - Add them one by one (or use Vercel CLI)

4. **Deploy**
   ```bash
   npx vercel --prod
   ```

5. **Run Database Migrations**
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

### **Railway / Render / AWS**

Similar process:
1. Set all environment variables in the platform dashboard
2. Connect your GitHub repository
3. Set build command: `npm run build`
4. Set start command: `npm run start`
5. Deploy and run migrations

---

## 🗄️ Database Setup

1. **Create Database** (if not already done)
   - Use Supabase, Railway, or any PostgreSQL provider

2. **Run Migrations**
   ```bash
   npm run db:migrate
   ```

3. **Seed Initial Data**
   ```bash
   npm run db:seed
   ```

---

## ✅ Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database connection tested (`npm run db:studio`)
- [ ] Local build succeeds (`npm run build`)
- [ ] Admin user seeded
- [ ] Cloudinary upload preset created (unsigned)
- [ ] Supabase auth configured
- [ ] WhatsApp number verified
- [ ] Resend API key active

---

## 🧪 Testing Production Build Locally

```bash
# Build the app
npm run build

# Start production server
npm run start
```

Visit `http://localhost:3000` to test the production build.

---

## 🔒 Security Notes

### **Never commit these to Git:**
- `.env.local`
- `.env`
- Any file containing real API keys

### **Always keep secret:**
- `CLOUDINARY_API_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `BETTER_AUTH_SECRET`
- Database passwords

### **Safe to expose (client-side):**
- `NEXT_PUBLIC_*` variables
- These are bundled in the client JavaScript

---

## 📊 Monitoring

After deployment, monitor:
- Vercel Analytics (if using Vercel)
- Database connections in Supabase dashboard
- Cloudinary bandwidth usage
- Resend email quota

---

## 🆘 Troubleshooting

### Build Fails on Deployment
- Verify all env vars are set correctly
- Check build logs for missing dependencies
- Ensure PostgreSQL database is accessible

### Database Connection Errors
- Verify `DATABASE_URL` format
- Check if database allows connections from deployment IP
- Ensure SSL mode is correct (`sslmode=require`)

### Images Not Loading
- Verify `CLOUDINARY_CLOUD_NAME` is correct
- Check if upload preset is "unsigned" and active
- Ensure `NEXT_PUBLIC_*` vars are set

---

## 📚 Additional Resources

- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Prisma Deployment**: https://www.prisma.io/docs/guides/deployment

---

**Built with ❤️ by Deep Dev Solutions Team**
