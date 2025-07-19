# Firebase Firestore Rules Quraşdırması

## Addım 1: Firebase Console-a daxil olun
1. https://console.firebase.google.com/ saytına daxil olun
2. "ustasan-mmc" layihəsini seçin

## Addım 2: Firestore Rules-unu dəyişin
1. Sol menyudan "Firestore Database" seçin
2. "Rules" tab-ına keçin
3. Mövcud bütün kodu silin
4. Aşağıdakı kodu kopyalayıb yapışdırın:

\`\`\`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
\`\`\`

5. "Publish" düyməsinə basın

## Addım 3: Authentication istifadəçi yaradın
1. Sol menyudan "Authentication" seçin
2. "Users" tab-ına keçin
3. "Add user" düyməsinə basın
4. Email: admin@ustalarmmc.az
5. Password: admin123
6. "Add user" düyməsinə basın

## Test etmək üçün:
- Səhifəni yeniləyin
- Admin: admin / admin123 ilə giriş edin
