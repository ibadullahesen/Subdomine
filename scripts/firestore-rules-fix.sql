-- Firebase Console > Firestore Database > Rules tab-da bu qaydaları yapışdırın:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all authenticated users to read and write
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}

-- Əgər yuxarıdakı işləmirsə, test üçün bu qaydaları istifadə edin:
-- (YALNIZ TEST ÜÇÜN - production-da istifadə etməyin!)

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all operations for testing
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
