rules_version = "2"
\
service cloud.firestore
{
  \
  match /databases/
  database
  ;/ cdemnostu{
  // Allow all authenticated users to read and write\
  match / { document=** }
  \
      allow read, write:
  if request.auth != null;
}
\
}
