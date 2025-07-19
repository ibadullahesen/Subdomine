-- Firebase Console-da bu addımları izləyin:

-- 1. AUTHENTICATION SETUP
-- Firebase Console > Authentication > Sign-in method
-- Email/Password provider-i aktivləşdirin

-- 2. FIRESTORE DATABASE SETUP
-- Firebase Console > Firestore Database > Create database
-- Start in test mode seçin (sonra rules dəyişəcəyik)

-- 3. FIRESTORE RULES (Security Rules tab-da)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all documents
    match /{document=**} {
      allow read, write: if true;
    }
  }
}

-- 4. MANUAL DATA ENTRY
-- Firestore Console-da bu collection və document-ları əl ilə yaradın:

-- Collection: users
-- Document ID: admin-user-id (istənilən ID)
{
  "email": "admin@ustalarmmc.az",
  "role": "admin",
  "name": "Admin",
  "createdAt": "2024-01-01T00:00:00Z"
}

-- Test üçün bir usta əlavə edin:
-- Document ID: worker-test-id
{
  "workerId": "u001",
  "name": "Test",
  "surname": "Usta",
  "phone": "055-123-45-67",
  "role": "worker",
  "currentCompany": "Ustalar MMC",
  "createdAt": "2024-01-01T00:00:00Z"
}

-- Test üçün bir şirkət əlavə edin:
-- Document ID: company-test-id
{
  "email": "test@company.com",
  "name": "Test Company",
  "role": "company",
  "companyName": "Test Company",
  "createdAt": "2024-01-01T00:00:00Z"
}

-- 5. AUTHENTICATION USER CREATION
-- Firebase Console > Authentication > Users tab
-- "Add user" düyməsinə basın və bu istifadəçini yaradın:
-- Email: admin@ustalarmmc.az
-- Password: admin123

-- 6. WEB APP CONFIGURATION
-- Firebase Console > Project Settings > General tab
-- "Your apps" bölməsində Web app əlavə edin
-- App nickname: "Ustalar MMC"
-- Firebase Hosting quraşdırmayın (indi lazım deyil)
