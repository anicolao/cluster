<script lang="ts">
import { app, firestore } from "$lib/firebase";
import { store } from "$lib/store";
import { login, logout } from "$lib/users";
import { getVersion } from "$lib/version";
import { GoogleAuthProvider, getAuth } from "@firebase/auth";
import { doc, setDoc } from "@firebase/firestore";
import { Signin } from "@ourway/svelte-firebase-auth";

const auth = getAuth(app);
// console.log("AUTH: ", auth);
const googleAuthProvider = new GoogleAuthProvider();

let uid: string | undefined = undefined;
let signedIn = false;

function user(e: CustomEvent) {
  console.log("CUSTOM EVENT: ", e);
  if (e.detail.signedIn) {
    signedIn = true;
    store.dispatch(login(e.detail));
    uid = e.detail.uid;
    const userRecord = doc(firestore, `/users/${uid}`);
    setDoc(userRecord, e.detail);
  } else {
    signedIn = false;
    if (uid) {
      store.dispatch(logout(uid));
    } else {
      console.error("assertion failure: uid is undefined?");
    }
  }
}
</script>

<div class="top">
<h1>Cluster</h1>
<p>Cluster is a space conquest game.</p>
{#if signedIn}
  <p>Your games are: ....</p>
  <p>  1</p>
  <p>  2</p>
  <p>  3</p>
{/if}
<p>Cluster is an obsessive slow real-time strategy
game in which you compete to dominate the galaxy, but in which no
single player has the resources or power to win on their own, making diplomacy
and cooperation key to establishing a winning alliance or a winning play.</p>

{#if !signedIn}
  <p>Please sign in.</p>
{/if}
<Signin {auth} {googleAuthProvider} on:user_changed={user}/>
<p>Version {getVersion()}</p>
</div>

<style>
  .top {
    height: 100vh;
    padding-left: 2em;
    padding-right: 2em;
    color: darkorchid;
    background-color: black;
  }
  h1 {
    margin-top: 0;
  }
</style>