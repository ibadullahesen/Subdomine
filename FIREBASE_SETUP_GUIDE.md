# Firebase Quraşdırma Təlimatı

## 1. Firebase Console-da Layihə Yaradın
1. https://console.firebase.google.com/ saytına daxil olun
2. "Create a project" düyməsinə basın
3. Project name: "ustasan-mmc" yazın
4. Google Analytics-i deaktiv edin (lazım deyil)
5. "Create project" düyməsinə basın

## 2. Authentication Quraşdırın
1. Sol menyudan "Authentication" seçin
2. "Get started" düyməsinə basın
3. "Sign-in method" tab-ına keçin
4. "Email/Password" seçin və "Enable" edin
5. "Save" düyməsinə basın

## 3. Admin İstifadəçi Yaradın
1. "Users" tab-ına keçin
2. "Add user" düyməsinə basın
3. Email: admin@ustalarmmc.az
4. Password: admin123
5. "Add user" düyməsinə basın

## 4. Firestore Database Yaradın
1. Sol menyudan "Firestore Database" seçin
2. "Create database" düyməsinə basın
3. "Start in test mode" seçin
4. Location: europe-west (və ya yaxın region)
5. "Done" düyməsinə basın

## 5. Firestore Rules Dəyişin
1. "Rules" tab-ına keçin
2. Aşağıdakı kodu yapışdırın:

\`\`\`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
\`\`\`

3. "Publish" düyməsinə basın

## 6. Test Məlumatları Əlavə Edin
1. "Data" tab-ına keçin
2. "Start collection" düyməsinə basın
3. Collection ID: "users"
4. İlk document yaradın:
   - Document ID: admin-doc
   - Field: email, Type: string, Value: admin@ustalarmmc.az
   - Field: role, Type: string, Value: admin
   - Field: name, Type: string, Value: Admin
5. "Save" düyməsinə basın

## 7. Web App Konfiqurasiyası
1. Project Settings > General
2. "Your apps" bölməsində "</>" (Web) ikonuna basın
3. App nickname: "Ustalar MMC"
4. "Register app" düyməsinə basın
5. Konfiqurasiya kodunu kopyalayın (artıq kodda var)

## Test Etmək Üçün:
- Admin giriş: admin@ustalarmmc.az / admin123
- Usta giriş: u001 (şifresiz)

## Əgər Problem Olarsa:
1. Browser cache-ni təmizləyin
2. Incognito/Private mode-da test edin
3. Console-da xətaları yoxlayın (F12)
