-- Firebase Firestore Collections Structure
-- Bu script Firebase konsolunda collection'ları yaratmaq üçün istifadə edilir

-- 1. users collection
-- Document structure:
{
  "id": "auto-generated",
  "email": "user@example.com",
  "role": "admin|company|worker",
  "name": "İstifadəçi adı",
  "surname": "Soyad (worker üçün)",
  "phone": "Telefon nömrəsi (worker üçün)",
  "workerId": "u001 (worker üçün)",
  "companyName": "Şirkət adı (company üçün)",
  "currentCompany": "Hazırki şirkət (worker üçün)",
  "createdAt": "timestamp"
}

-- 2. jobs collection
-- Document structure:
{
  "id": "auto-generated",
  "title": "İş başlığı",
  "description": "İş təsviri",
  "companyId": "Şirkət ID",
  "companyName": "Şirkət adı",
  "workerId": "Usta ID",
  "workerName": "Usta adı",
  "stages": [
    {
      "id": "stage-id",
      "name": "Mərhələ adı",
      "description": "Mərhələ təsviri",
      "completed": false,
      "completedAt": "timestamp (optional)",
      "order": 1
    }
  ],
  "createdAt": "timestamp",
  "status": "active|completed"
}

-- 3. stages collection (template stages)
-- Document structure:
{
  "id": "auto-generated",
  "name": "Mərhələ adı",
  "description": "Mərhələ təsviri",
  "order": 1,
  "isDefault": true,
  "createdAt": "timestamp"
}

-- Firebase Security Rules
-- Firestore Rules:
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
    
    // Jobs collection
    match /jobs/{jobId} {
      allow read, write: if request.auth != null;
    }
    
    // Stages collection
    match /stages/{stageId} {
      allow read, write: if request.auth != null;
    }
  }
}

-- Firebase Authentication Rules:
-- Admin email: admin@ustalarmmc.az
-- Admin password: admin123 (dəyişdirilə bilər)
