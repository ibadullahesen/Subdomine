# Ustalar MMC - Santexnik İşləri İdarəetmə Sistemi

Bu sistem Firebase ilə inteqrasiya edilmiş müasir bir santexnik işləri idarəetmə platformasıdır.

## Xüsusiyyətlər

### Admin Paneli
- Usta əlavə etmə və silmə
- Şirkət əlavə etmə və silmə
- Mərhələ idarəetməsi
- Real-time məlumat yeniləmə
- Admin məlumatlarını dəyişdirmə

### Şirkət Paneli
- İş gedişatını izləmə
- Mərhələlərin vəziyyətini görüntüləmə
- Real-time yenilənmələr

### Usta Paneli
- Təyin edilmiş işləri görüntüləmə
- Mərhələləri tamamlama
- Şifresiz giriş (ID ilə)

## Firebase Quraşdırılması

1. Firebase Console-da yeni layihə yaradın
2. Authentication-ı aktivləşdirin (Email/Password)
3. Firestore Database yaradın
4. Environment dəyişənlərini `.env.local` faylında təyin edin

### Firestore Collections

#### users
\`\`\`json
{
  "email": "user@example.com",
  "role": "admin|company|worker",
  "name": "İstifadəçi adı",
  "surname": "Soyad",
  "phone": "Telefon",
  "workerId": "u001",
  "companyName": "Şirkət adı",
  "currentCompany": "Hazırki şirkət",
  "createdAt": "timestamp"
}
\`\`\`

#### jobs
\`\`\`json
{
  "title": "İş başlığı",
  "description": "İş təsviri",
  "companyId": "Şirkət ID",
  "companyName": "Şirkət adı",
  "workerId": "Usta ID",
  "workerName": "Usta adı",
  "stages": [...],
  "createdAt": "timestamp",
  "status": "active|completed"
}
\`\`\`

### Firestore Security Rules

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
    
    match /jobs/{jobId} {
      allow read, write: if request.auth != null;
    }
  }
}
\`\`\`

## İstifadə

1. Admin hesabı yaradın: admin@ustalarmmc.az
2. Şirkətləri və ustaları əlavə edin
3. İşləri təyin edin və mərhələləri izləyin

## Təhlükəsizlik

- Firebase Authentication ilə təhlükəsiz giriş
- Role-based access control
- Real-time data validation
- Secure Firestore rules

## Texniki Detallar

- Next.js 14 (App Router)
- TypeScript
- Firebase v9
- Tailwind CSS
- shadcn/ui components
- Real-time updates
