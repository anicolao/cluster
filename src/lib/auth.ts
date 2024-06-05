import { app, firestore } from "$lib/firebase";
import { store } from "$lib/store";
import { login, logout } from "$lib/users";
import { GoogleAuthProvider, getAuth } from "@firebase/auth";
import { doc, setDoc } from "@firebase/firestore";
import { writable } from "svelte/store";

export const auth = getAuth(app);
// console.log("AUTH: ", auth);
export const googleAuthProvider = new GoogleAuthProvider();

let uid: string | undefined = undefined;
export const signedIn = writable(false);

export function user(e: CustomEvent) {
  console.log("auth.ts: CUSTOM EVENT: ", e);
  if (e.detail.signedIn) {
    signedIn.set(true);
    store.dispatch(login(e.detail));
    uid = e.detail.uid;
    const userRecord = doc(firestore, `/users/${uid}`);
    setDoc(userRecord, e.detail);
  } else {
    signedIn.set(false);
    if (uid) {
      store.dispatch(logout(uid));
    } else {
      console.error("assertion failure: uid is undefined?");
    }
  }
}
