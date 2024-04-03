<script lang="ts">
import { firebaseConfig } from "$lib/firebase";
import { initializeApp } from "@firebase/app";
import { GoogleAuthProvider, getAuth } from "@firebase/auth";
import { Signin } from "@ourway/svelte-firebase-auth";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
console.log("AUTH: ", auth);
const googleAuthProvider = new GoogleAuthProvider();

function user(e: CustomEvent) {
  console.log("CUSTOM EVENT: ", e);
}
</script>

<h1>Cluster</h1>
<p>Please sign in.</p>
<Signin {auth} {googleAuthProvider} on:user_changed={user}/>
