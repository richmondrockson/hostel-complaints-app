const { admin } = require("../firebase");

const UID = "W0IDyyirUeY4NBydh7I5jMfBQ2i1";

async function makeAdmin(uid) {
  try {
    const userRecord = await admin.auth().getUser(uid);
    console.log("Found user:", userRecord.email);

    await admin.auth().setCustomUserClaims(uid, { role: "admin" });
    console.log(`✅ Success! ${userRecord.email} is now an admin.`);
    console.log("👉 Sign out and sign back in for the claim to take effect.");

    const updatedUser = await admin.auth().getUser(uid);
    console.log("Custom claims are set:", updatedUser.customClaims);
  } catch (error) {
    console.error("❌Error setting admin claim:", error.message);
  }
}

makeAdmin(UID);
