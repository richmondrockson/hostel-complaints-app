import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "./config/firebase.js";

export const testSignUp = async () => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      "testuser@example.com",
      "testpassword123",
    );
    console.log("User created:", userCredential.user);
  } catch (error) {
    console.error("Signup error:", error);
  }
};
