import admin from 'firebase-admin';

// Get Firestore instance (reusing the Firebase Admin initialization from fcm.ts)
let db: admin.firestore.Firestore | null = null;

function getFirestore(): admin.firestore.Firestore {
  if (db) return db;

  // Check if Firebase Admin is already initialized
  try {
    const app = admin.app();
    db = admin.firestore(app);
  } catch {
    // Initialize Firebase Admin if not already done
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

    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
    }, 'firestore-app');

    db = admin.firestore(app);
    console.log('📦 [Firestore] Admin SDK initialized for Firestore');
  }

  return db;
}

// Collection names
const PRODUCT_CUSTOMIZATIONS_COLLECTION = 'productCustomizations';
const GLOBAL_MARKUP_SETTINGS_COLLECTION = 'globalMarkupSettings';

// Product Customization Functions
export async function getAllProductCustomizations(): Promise<any[]> {
  try {
    const firestore = getFirestore();
    const snapshot = await firestore.collection(PRODUCT_CUSTOMIZATIONS_COLLECTION).get();
    
    const customizations = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });
    
    console.log(`📦 [Firestore] Fetched ${customizations.length} product customizations`);
    return customizations;
  } catch (error) {
    console.error('❌ [Firestore] Error fetching product customizations:', error);
    throw error;
  }
}

export async function getProductCustomization(code: string): Promise<any | null> {
  try {
    const firestore = getFirestore();
    const doc = await firestore.collection(PRODUCT_CUSTOMIZATIONS_COLLECTION).doc(code).get();
    
    if (!doc.exists) {
      return null;
    }
    
    const data = doc.data()!;
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('❌ [Firestore] Error fetching product customization:', error);
    throw error;
  }
}

export async function saveProductCustomization(customization: any): Promise<any> {
  try {
    const firestore = getFirestore();
    const id = customization.productCode;
    const now = admin.firestore.Timestamp.now();
    
    const existing = await getProductCustomization(id);
    
    const customizationData = {
      ...customization,
      id,
      createdAt: existing?.createdAt ? admin.firestore.Timestamp.fromDate(existing.createdAt) : now,
      updatedAt: now,
    };
    
    await firestore.collection(PRODUCT_CUSTOMIZATIONS_COLLECTION).doc(id).set(customizationData);
    
    console.log(`✅ [Firestore] Product customization saved: ${id}`);
    
    return {
      ...customizationData,
      createdAt: customizationData.createdAt.toDate(),
      updatedAt: customizationData.updatedAt.toDate(),
    };
  } catch (error) {
    console.error('❌ [Firestore] Error saving product customization:', error);
    throw error;
  }
}

export async function saveBulkProductCustomizations(customizations: any[]): Promise<number> {
  try {
    const firestore = getFirestore();
    const batch = firestore.batch();
    const now = admin.firestore.Timestamp.now();
    
    for (const customization of customizations) {
      const id = customization.productCode;
      const docRef = firestore.collection(PRODUCT_CUSTOMIZATIONS_COLLECTION).doc(id);
      
      const customizationData = {
        ...customization,
        id,
        createdAt: now,
        updatedAt: now,
      };
      
      batch.set(docRef, customizationData, { merge: true });
    }
    
    await batch.commit();
    console.log(`✅ [Firestore] Bulk saved ${customizations.length} product customizations`);
    
    return customizations.length;
  } catch (error) {
    console.error('❌ [Firestore] Error saving bulk product customizations:', error);
    throw error;
  }
}

export async function deleteProductCustomization(code: string): Promise<void> {
  try {
    const firestore = getFirestore();
    await firestore.collection(PRODUCT_CUSTOMIZATIONS_COLLECTION).doc(code).delete();
    console.log(`✅ [Firestore] Product customization deleted: ${code}`);
  } catch (error) {
    console.error('❌ [Firestore] Error deleting product customization:', error);
    throw error;
  }
}

// Global Markup Settings Functions
export async function getAllGlobalMarkupSettings(): Promise<any[]> {
  try {
    const firestore = getFirestore();
    const snapshot = await firestore.collection(GLOBAL_MARKUP_SETTINGS_COLLECTION).get();
    
    const settings = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });
    
    console.log(`📦 [Firestore] Fetched ${settings.length} global markup settings`);
    return settings;
  } catch (error) {
    console.error('❌ [Firestore] Error fetching global markup settings:', error);
    throw error;
  }
}

export async function getGlobalMarkupSetting(productType: string): Promise<any | null> {
  try {
    const firestore = getFirestore();
    const doc = await firestore.collection(GLOBAL_MARKUP_SETTINGS_COLLECTION).doc(productType).get();
    
    if (!doc.exists) {
      return null;
    }
    
    const data = doc.data()!;
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('❌ [Firestore] Error fetching global markup setting:', error);
    throw error;
  }
}

export async function saveGlobalMarkupSetting(setting: any): Promise<any> {
  try {
    const firestore = getFirestore();
    const id = setting.productType;
    const now = admin.firestore.Timestamp.now();
    
    const existing = await getGlobalMarkupSetting(id);
    
    const settingData = {
      ...setting,
      id,
      createdAt: existing?.createdAt ? admin.firestore.Timestamp.fromDate(existing.createdAt) : now,
      updatedAt: now,
    };
    
    await firestore.collection(GLOBAL_MARKUP_SETTINGS_COLLECTION).doc(id).set(settingData);
    
    console.log(`✅ [Firestore] Global markup setting saved: ${id}`);
    
    return {
      ...settingData,
      createdAt: settingData.createdAt.toDate(),
      updatedAt: settingData.updatedAt.toDate(),
    };
  } catch (error) {
    console.error('❌ [Firestore] Error saving global markup setting:', error);
    throw error;
  }
}

export async function initializeDefaultGlobalMarkup(): Promise<void> {
  try {
    const pulsaMarkup = await getGlobalMarkupSetting('pulsa');
    
    if (!pulsaMarkup) {
      await saveGlobalMarkupSetting({
        productType: 'pulsa',
        markupType: 'fixed',
        markupValue: 500,
        isActive: true,
      });
      console.log('📦 [Firestore] Default pulsa markup initialized');
    }

    const kuotaMarkup = await getGlobalMarkupSetting('kuota');
    
    if (!kuotaMarkup) {
      await saveGlobalMarkupSetting({
        productType: 'kuota',
        markupType: 'fixed',
        markupValue: 500,
        isActive: true,
      });
      console.log('📦 [Firestore] Default kuota markup initialized');
    }
  } catch (error) {
    console.error('❌ [Firestore] Error initializing default markup:', error);
  }
}

// Export getFirestore for use in routes
export { getFirestore };
