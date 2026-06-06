const admin = require("firebase-admin");

let credential;

if (process.env.FIREBASE_PRIVATE_KEY_BASE64) {
  credential = admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: Buffer.from(
      process.env.FIREBASE_PRIVATE_KEY_BASE64,
      "base64",
    ).toString("utf8"),
  });
} else {
  const serviceAccount = require("../serviceAccountKey.json");
  credential = admin.credential.cert(serviceAccount);
}

admin.initializeApp({ credential });

const db = admin.firestore();

module.exports = { admin, db };
