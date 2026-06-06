const admin = require("firebase-admin");

const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");

console.log("Project ID:", process.env.FIREBASE_PROJECT_ID);
console.log("Client Email:", process.env.FIREBASE_CLIENT_EMAIL);

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
  }),
});

const db = admin.firestore();

module.exports = { admin, db };
