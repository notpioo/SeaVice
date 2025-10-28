# Push Notification Debugging Guide

## Checklist Masalah yang Sudah Diperiksa

### ✅ Server Configuration
- [x] Firebase Admin SDK initialized with service account
- [x] API endpoint `/api/send-notification` configured
- [x] Router registered to app
- [x] VAPID key available in environment variables

### ⚠️ Yang Perlu Dicek Lebih Lanjut

1. **FCM Registration API Status**
   - Apakah FCM Registration API sudah di-enable di Google Cloud Console?
   - Cek di: https://console.cloud.google.com/apis/library/fcmregistrations.googleapis.com
   - Project ID: seavice-a25e0

2. **FCM Token Generation**
   - Apakah user berhasil mendapatkan FCM token saat login?
   - Check browser console untuk pesan "✅ FCM Token obtained"
   - Apakah token tersimpan ke Firestore collection `fcmTokens`?

3. **Firebase Cloud Messaging API (V1)**
   - Pastikan sudah ENABLED di Firebase Console
   - Buka: Firebase Console → Project Settings → Cloud Messaging
   - Pastikan "Firebase Cloud Messaging API (V1)" = Enabled

## Cara Test Manual

### Step 1: Login dan Cek Console Logs
1. Buka browser devtools (F12)
2. Login ke aplikasi
3. Cari log berikut di console:
   - "✅ FCM Service Worker registered"
   - "🔔 Requesting notification permission..."
   - "✅ FCM Token obtained: [token]"
   - "✅ Token saved to Firestore"

### Step 2: Verifikasi Token di Firestore
1. Buka Firebase Console
2. Pergi ke Firestore Database
3. Check collection `fcmTokens`
4. Pastikan ada document dengan userId dan token

### Step 3: Test dari Admin Panel
1. Login sebagai admin
2. Buka `/admin/notifications`
3. Buat notification baru dengan target "all" atau user tertentu
4. Click send
5. Check browser console untuk response dari server

### Step 4: Check Server Logs
- Check untuk pesan: "✅ Sent to X devices, failed: Y"
- Jika ada error, akan muncul di console server

## Common Issues

### Issue 1: No Token Generated
**Symptom:** Log "⚠️ No FCM token obtained - permission might be denied"
**Solution:**
- Allow notification permission di browser
- Test di incognito mode (untuk bypass extension yang blocking)
- Pastikan testing di HTTPS atau localhost

### Issue 2: Token Not Saved to Firestore  
**Symptom:** Error saat save token
**Solution:**
- Check Firestore rules
- Check Firebase Authentication status
- Verify user is logged in

### Issue 3: Notification Not Sent
**Symptom:** Server returns error saat send notification
**Solutions:**
1. Enable FCM Registration API di Google Cloud Console
2. Enable Firebase Cloud Messaging API (V1)
3. Check service account permissions
4. Verify VAPID key is correct

### Issue 4: FCM Registration API Not Enabled
**Error:** "Request is missing required authentication credential"
**Solution:**
1. Go to: https://console.cloud.google.com/apis/library/fcmregistrations.googleapis.com
2. Select project: seavice-a25e0
3. Click "ENABLE"
4. Wait a few minutes for propagation

## Environment Variables

Current configuration:
- `VITE_FIREBASE_API_KEY`: ✅ Set
- `VITE_FIREBASE_PROJECT_ID`: ✅ Set (seavice-a25e0)
- `VITE_FIREBASE_APP_ID`: ✅ Set
- `VITE_FIREBASE_VAPID_KEY`: ✅ Set

## Next Steps for Debugging

1. Check browser console logs saat login
2. Verify FCM token tersimpan di Firestore
3. Test send notification dari admin panel
4. Check server response dan errors
5. Enable FCM Registration API jika belum
6. Enable FCM API V1 di Firebase Console
