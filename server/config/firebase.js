const admin = require("firebase-admin");

const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");

// Temporary debug — remove after fixing
console.log("Private key starts with:", privateKey.substring(0, 50));
console.log(
  "Private key ends with:",
  privateKey.substring(privateKey.length - 50),
);

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
  }),
});

const db = admin.firestore();

module.exports = { admin, db };
