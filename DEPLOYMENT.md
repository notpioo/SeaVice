# Panduan Deploy ke Railway

Aplikasi SeaVice sudah siap untuk di-deploy ke Railway dengan konfigurasi Docker yang sudah dioptimasi.

## Persiapan

### 1. File yang Sudah Dibuat
- ✅ `Dockerfile` - Multi-stage build untuk image yang kecil dan cepat
- ✅ `.dockerignore` - Mengecualikan file yang tidak perlu
- ✅ `railway.toml` - Konfigurasi Railway
- ✅ Server sudah pakai `process.env.PORT` (compatible dengan Railway)

### 2. Cara Deploy ke Railway

#### Opsi 1: Deploy dari GitHub (Recommended)
1. Push kode ke GitHub repository
2. Login ke [Railway.app](https://railway.app)
3. Klik "New Project"
4. Pilih "Deploy from GitHub repo"
5. Pilih repository Anda
6. Railway akan otomatis detect Dockerfile dan build aplikasi

#### Opsi 2: Deploy dari CLI
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

### 3. Environment Variables di Railway

Setelah deploy, set environment variables di Railway Dashboard:

**Required Variables:**
- `NODE_ENV=production`
- `PORT` (otomatis di-inject oleh Railway)

**Optional Variables (sesuai kebutuhan app):**
- `DATABASE_URL` (jika pakai database)
- API keys atau secret lainnya

### 4. Database (Optional)

Jika aplikasi butuh database:
1. Di Railway Dashboard, klik "New" → "Database" → "Add PostgreSQL"
2. Railway akan otomatis inject `DATABASE_URL` ke environment variables
3. Aplikasi akan otomatis connect ke database

### 5. Custom Domain (Optional)

Setelah deploy:
1. Railway akan kasih domain otomatis: `*.up.railway.app`
2. Untuk custom domain:
   - Klik "Settings" → "Domains"
   - Tambah domain Anda
   - Update DNS records sesuai instruksi Railway

## Spesifikasi Docker Image

**Multi-stage Build:**
- Base: `node:20-alpine` (lebih kecil dan cepat)
- Production image size: ~100-150 MB (vs 1GB+ tanpa optimasi)
- Security: Running as non-root user

**Build Process:**
1. Install dependencies (`npm ci`)
2. Build frontend dengan Vite
3. Build backend dengan esbuild
4. Copy hanya production dependencies & built files

**Port Configuration:**
- Server bind ke `0.0.0.0` (required untuk Railway)
- Port dinamis dari `process.env.PORT`
- Default fallback: 5000

## Troubleshooting

### "Cannot GET /"
- Pastikan build berhasil (cek Railway logs)
- Verifikasi `dist` folder ter-generate dengan benar

### "Port already in use"
- Railway inject PORT otomatis, tidak perlu hardcode

### Build Gagal
- Cek Railway build logs
- Pastikan semua dependencies ada di `package.json`
- Verifikasi build script: `npm run build`

### Environment Variables Tidak Terdeteksi
- Set di Railway Dashboard → Variables
- Restart deployment setelah update variables

## Monitoring

Railway Dashboard menyediakan:
- 📊 Real-time logs
- 📈 Resource usage (CPU, Memory, Network)
- 🔄 Deployment history
- ⚡ Auto-deploy on git push (jika connected ke GitHub)

## Cost Estimate

Railway pricing (per Januari 2025):
- Hobby Plan: $5/month (includes $5 credit)
- Pro Plan: $20/month (includes $20 credit)
- Usage-based: $0.000463/GB-hour RAM, $0.000231/vCPU-hour

Aplikasi Node.js kecil biasanya:
- ~100-200 MB RAM
- ~0.1 vCPU average
- Cost: ~$2-5/month untuk traffic rendah-sedang

## Support

Jika ada masalah:
1. Cek Railway Logs di Dashboard
2. Lihat [Railway Docs](https://docs.railway.app)
3. Railway Discord community

## Checklist Sebelum Deploy

- [ ] Push semua perubahan ke Git
- [ ] Test build lokal berhasil (`npm run build`)
- [ ] Set environment variables yang diperlukan
- [ ] Review `Dockerfile` dan `.dockerignore`
- [ ] Backup data penting (jika ada)

Selamat deploy! 🚀
