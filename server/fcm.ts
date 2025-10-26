
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
let firebaseAdmin: admin.app.App | null = null;

function initializeFirebaseAdmin() {
  if (firebaseAdmin) return firebaseAdmin;

  try {
    const serviceAccount = {
      type: "service_account",
      project_id: "seavice-a25e0",
      private_key_id: "392a4b8d24a3a74c96ee9bba7f690028bf238a8d",
      private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCMKE/0WXcgj27i\nRJ/jAHK/nrPS2ZE5Nxx17PVpinjLTBoXTnfrNJuKvnj/ea5jcpA/tspudKMwmkGg\nLRsksrm40rwhrDp/k+u0PVq1F/5AoFZdQs/Mb55wBKFtKyqQZmAWghJQkqtPxleh\nfDt4KMNeE3JT0QiXd2jKLYmp/POYalpZBowe5JSkxnkgL6njNyn/4TtqDpmpTxgr\nCO0O1pFyRuE6DfqdpH23GUQH0hx6ypwkj/S+iGjO/iJIGX5t99UwnWRsWDscqxG5\np+vIBa6TEoQLdanDv7Qc4O6lSfkBaPWJ+LlsYNt4a7Kz5/97yl+Gen3x62TRA6OS\nHC0ne2FZAgMBAAECggEABWGOLEymXmQottw5TURY+NLAMbIJDtV3AhoOaWEXy9UI\nqBNrAZHxVNgvmhNoZsi2Zr5/CChHPwL1I7qyRkGXECmwb78xNxu38CFuPZywYM0n\nHl6FzuIMMbMj0CauSYFSDXCCASuYaIWDcMpDGD/BvHdqVh3PmCJ4A1HQmBZY8zri\nMlSBJtPsjnHH4oR2ktwgOCP9KEpfT3I06r0Ow8DqbzsLEqQnHrHkWCK+5Ky+VeYU\nteKhYUWq8ukmJvpZH00Kve4+uwpk9dy1A3ARE6qiwtsiOW/oD9nl1x8T5zUM18IP\nam9166E3Cn2u7dInQh27vALdxQGpXpKoufMhDYO4AQKBgQDF55qFfJEz/GK8iSop\nMzYx1bMxrd8VHS9XjwumogBSzysF8VUTQYx1Ror2KQOXDHDd5SIf8sG/1lp600cV\n+HlNjKK0CAr082QvTnhMJsdOkZ2we065Y5fbaJH9XAlr/hlux5pCmyRldMWemVhh\neS0mAY2wQHWoQNqKH0B6K0eOAQKBgQC1TQux6r3LamCd88IFfvGdgJ9ZLyawmmrE\nZXVL542qnxee0EVH/wyvSzlub5a28rELL2dk/ctaAuwWi7a9r8rvDBRlewdK2WRv\nrD3vDLq+vs8dRJy9SrWJaVDbLdq4CRGmSGSQ/WDiXZU25iwjq/+kNG/RltyCOV8l\nFkmhlvEDWQKBgQCcLY0VANv6IZet37Uk9GQ1acbTUrp1CCYfPCTeqIQG1bTHKM+R\nta3psvThFDbgEhJUGooWmlXqVXfr7CXyIbdgyrZvytUSv6z1ZECtIAEzcNj3uCfF\nR+JEZT6oqeRJlCpv8Rc8rwBHDKMT6UIFEkLd9mXhjM0NLbkJPWZ9wv/iAQKBgGaR\nE9CvkHgH0mkJgfZB/sawAXYe6rB2a3h4PYeXk9m271H1WXyFmdOBpxgHISiW2/oL\n8157BhQCGzYWDGf7j771AoT2uQVrPxq+Qrt+ZBeNMvbH3jRok5MNdaTJqDb9SnLb\n+ajc73agos3QIaB8qb9nuurDgjRZ6K2+kiFMl0ThAoGAMVYxOYK0dbl5YsrXJUiD\ncStF9s2DFjOm4XOFZeMeR7sJ5vh5YTOLPxHUledepxVgYDe6pb7T2cS/FJ6qT2C+\n7YIKxc/71yvb6cBXz3/KlWyGYqAk1n5lUzdml7Q+ymeY4lvMAYZf3qBIiocaxSUt\nYZWm498767RqiJleDh2RHIk=\n-----END PRIVATE KEY-----\n",
      client_email: "firebase-adminsdk-fbsvc@seavice-a25e0.iam.gserviceaccount.com",
      client_id: "116525630905869828738",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40seavice-a25e0.iam.gserviceaccount.com",
      universe_domain: "googleapis.com"
    };

    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
    });

    console.log('Firebase Admin SDK initialized successfully');
    return firebaseAdmin;
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw error;
  }
}

export interface SendNotificationPayload {
  tokens: string[];
  title: string;
  body: string;
  imageUrl?: string;
  actionUrl?: string;
  data?: Record<string, string>;
}

export async function sendFCMNotification(payload: SendNotificationPayload): Promise<{
  successCount: number;
  failureCount: number;
  errors?: string[];
}> {
  const { tokens, title, body, imageUrl, actionUrl, data } = payload;

  if (tokens.length === 0) {
    return { successCount: 0, failureCount: 0 };
  }

  // Initialize Firebase Admin
  const app = initializeFirebaseAdmin();
  const messaging = admin.messaging(app);

  let successCount = 0;
  let failureCount = 0;
  const errors: string[] = [];

  // Firebase Admin SDK supports sending to multiple tokens at once
  const message: admin.messaging.MulticastMessage = {
    tokens,
    notification: {
      title,
      body,
      ...(imageUrl && { imageUrl }),
    },
    data: {
      ...(data || {}),
      ...(actionUrl && { actionUrl }),
    },
    webpush: {
      notification: {
        icon: '/icons/pwa-192x192.png',
        badge: '/icons/pwa-192x192.png',
        requireInteraction: true,
        ...(actionUrl && { 
          data: { url: actionUrl },
          actions: [{ action: 'open', title: 'Buka' }]
        }),
      },
      fcmOptions: {
        link: actionUrl || '/',
      },
    },
  };

  try {
    const response = await messaging.sendEachForMulticast(message);
    
    successCount = response.successCount;
    failureCount = response.failureCount;

    // Collect error details
    response.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error) {
        errors.push(`Token ${idx}: ${resp.error.message}`);
      }
    });

    console.log(`✅ Sent to ${successCount} devices, failed: ${failureCount}`);
  } catch (error: any) {
    console.error('Error sending FCM notification:', error);
    failureCount = tokens.length;
    errors.push(error.message);
  }

  return {
    successCount,
    failureCount,
    ...(errors.length > 0 && { errors }),
  };
}
