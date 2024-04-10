<script lang="ts">
import { app, firestore } from "$lib/firebase";
import { store } from "$lib/store";
import { login, logout } from "$lib/users";
import { initializeApp } from "@firebase/app";
import { GoogleAuthProvider, getAuth } from "@firebase/auth";
import { doc, setDoc } from "@firebase/firestore";
import { Signin } from "@ourway/svelte-firebase-auth";

const auth = getAuth(app);
// console.log("AUTH: ", auth);
const googleAuthProvider = new GoogleAuthProvider();

let uid: string | undefined = undefined;
function user(e: CustomEvent) {
  console.log("CUSTOM EVENT: ", e);
  if (e.detail.signedIn) {
    store.dispatch(login(e.detail));
    uid = e.detail.uid;
    const userRecord = doc(firestore, `/users/${uid}`);
    setDoc(userRecord, e.detail);
  } else {
    if (uid) {
      store.dispatch(logout(uid));
    } else {
      console.error("assertion failure: uid is undefined?");
    }
  }
}
</script>

<h1>Cluster</h1>
<p>Please sign in.</p>
<Signin {auth} {googleAuthProvider} on:user_changed={user}/>
