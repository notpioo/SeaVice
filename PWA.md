# SeaVice PWA (Progressive Web App)

## Overview
SeaVice sekarang merupakan Progressive Web App (PWA) yang dapat di-install seperti aplikasi native di perangkat mobile dan desktop.

## Fitur PWA

### 1. Installable
- **Mobile (Android/iOS)**: Bisa di-install ke home screen
- **Desktop (Chrome/Edge)**: Bisa di-install sebagai aplikasi standalone
- Icon kustom dengan branding SeaVice (orange lightning bolt)

### 2. Offline Support
- Service Worker cache semua assets (HTML, CSS, JS, images)
- Runtime caching untuk Google Fonts dan Firebase Storage
- Aplikasi tetap bisa dibuka saat offline
- Update otomatis saat online kembali

### 3. Auto-Update
- Aplikasi otomatis detect versi terbaru
- Notification muncul saat ada update
- User bisa reload untuk mendapat fitur terbaru

## Cara Install PWA

### Mobile (Android)
1. Buka SeaVice di Chrome browser
2. Tap menu (⋮) di pojok kanan atas
3. Pilih "Install app" atau "Add to Home screen"
4. Icon SeaVice akan muncul di home screen

### Mobile (iOS)
1. Buka SeaVice di Safari browser
2. Tap tombol Share (⬆️)
3. Scroll dan pilih "Add to Home Screen"
4. Tap "Add" di pojok kanan atas

### Desktop (Chrome/Edge)
1. Buka SeaVice di browser
2. Lihat icon install (⊕) di address bar
3. Klik icon atau pilih "Install SeaVice"
4. Aplikasi akan terbuka di window terpisah

## Technical Implementation

### PWA Manifest
```json
{
  "name": "SeaVice - Platform Layanan Digital",
  "short_name": "SeaVice",
  "description": "Platform modern untuk jasa servis digital",
  "theme_color": "#FF6B35",
  "background_color": "#ffffff",
  "display": "standalone",
  "icons": [
    { "src": "/icons/pwa-192x192.png", "sizes": "192x192" },
    { "src": "/icons/pwa-512x512.png", "sizes": "512x512" }
  ]
}
```

### Service Worker Caching
**Precache (Static Assets):**
- HTML, CSS, JavaScript files
- Icons and images
- Fonts (woff, woff2)

**Runtime Cache:**
- Google Fonts (CacheFirst strategy, 1 year)
- Firebase Storage (StaleWhileRevalidate, 30 days)

### Update Flow
1. User membuka aplikasi
2. Service Worker check untuk update
3. Jika ada versi baru, download di background
4. Notification muncul: "Update Tersedia!"
5. User klik "Reload Sekarang"
6. Aplikasi reload dengan versi terbaru

## Development

### Test PWA Locally
```bash
# Build production version
npm run build

# Preview production build
npm run preview

# Open browser DevTools → Application tab
# Check Service Workers and Manifest
```

### Enable PWA in Dev Mode
PWA sudah aktif di development mode dengan `devOptions.enabled: true` di vite.config.ts

### Check PWA Status
1. Open Chrome DevTools
2. Application tab → Manifest
3. Verify icons, theme color, display mode
4. Application tab → Service Workers
5. Verify service worker is active

## PWA Checklist
- ✅ HTTPS (required for PWA)
- ✅ Web App Manifest
- ✅ Service Worker registered
- ✅ Icons (192x192, 512x512)
- ✅ Theme color meta tag
- ✅ Viewport meta tag
- ✅ Offline functionality
- ✅ Install prompt
- ✅ Update notification

## Browser Support
- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Safari (iOS 11.3+)
- ✅ Firefox (Desktop & Mobile)
- ✅ Samsung Internet
- ⚠️ Safari Desktop (limited PWA support)

## Files
- `vite.config.ts` - PWA plugin configuration
- `client/index.html` - PWA meta tags
- `client/public/icons/` - PWA icons
- `client/src/components/PWAUpdatePrompt.tsx` - Update notification
- `client/src/vite-env.d.ts` - TypeScript types
- `dist/public/sw.js` - Generated service worker
- `dist/public/manifest.webmanifest` - Generated manifest

## Deployment

### Replit
PWA akan otomatis aktif setelah deploy. Pastikan HTTPS enabled (default di Replit).

### Railway
1. Set Firebase environment variables (build time required)
2. Deploy
3. Railway domain otomatis HTTPS
4. PWA akan langsung bisa di-install

### Firebase Authorized Domains
Jangan lupa tambahkan domain deployment ke Firebase Console:
- Firebase Console → Authentication → Settings → Authorized domains
- Tambahkan: `.replit.app`, `.up.railway.app`, atau custom domain

## Monitoring
Gunakan Lighthouse audit untuk check PWA score:
1. Chrome DevTools → Lighthouse
2. Pilih "Progressive Web App" category
3. Run audit
4. Target score: 90+

## Future Enhancements
- [ ] Push notifications untuk order updates
- [ ] Background sync untuk offline orders
- [ ] App shortcuts untuk quick actions
- [ ] Share Target API untuk sharing content
- [ ] Periodic background sync

## Resources
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [Vite PWA Plugin Docs](https://vite-pwa-org.netlify.app/)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
