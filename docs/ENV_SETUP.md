# 🔑 Quick Environment Setup Reference

## For Local Development (.env.local)
✅ Already configured with your credentials

## For Production Deployment

### Copy these to your deployment platform (Vercel/Railway/Render):

```env
# REQUIRED - Database
DATABASE_URL="postgresql://postgres.[REF]:[PASS]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require"
DIRECT_URL="postgresql://postgres.[REF]:[PASS]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require"

# REQUIRED - Supabase Auth
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGci..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."

# REQUIRED - Auth Secret (generate: openssl rand -base64 32)
BETTER_AUTH_SECRET="YOUR-SECRET-HERE"

# REQUIRED - Cloudinary Images
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="123456789"
CLOUDINARY_API_SECRET="secret"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="unsigned-preset"

# REQUIRED - WhatsApp
NEXT_PUBLIC_WHATSAPP_NUMBER="923021191771"
WHATSAPP_BUSINESS_PHONE="+92 302 1191771"

# REQUIRED - Email
RESEND_API_KEY="re_your_key"

# OPTIONAL - Admin Seed
ADMIN_EMAIL="owner.shahzaib.autos@gmail.com"
ADMIN_PASSWORD="YourPassword"
ADMIN_NAME="Shahzaib"
```

## 🚀 Deployment Commands

```bash
# 1. Build locally to verify
npm run build

# 2. Deploy to Vercel
npx vercel --prod

# 3. Run migrations (one time)
npx prisma migrate deploy

# 4. Seed database (one time)
npx prisma db seed
```

## 📁 Files Created

✅ `.env.example` - Template with all variables documented
✅ `.env.production` - Production template with placeholders
✅ `DEPLOYMENT.md` - Complete deployment guide
✅ Your `.env.local` - Updated with correct SSL settings

## ⚠️ Security Checklist

- [x] .env files in .gitignore
- [x] No secrets committed to Git
- [ ] Generate new BETTER_AUTH_SECRET for production
- [ ] Use strong ADMIN_PASSWORD
- [ ] Verify Cloudinary preset is "unsigned"
- [ ] Enable Supabase RLS policies

## 🎯 Next Steps

1. Copy `.env.production` values to your deployment platform
2. Replace all `[PLACEHOLDER]` values with real credentials
3. Run `npm run build` locally to verify
4. Deploy to Vercel/Railway
5. Run database migrations in production
6. Test the live site

---

**Everything is ready for deployment! 🚀**
