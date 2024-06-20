<script lang="ts">
import { uid } from "$lib/auth";
import { firestore, realtimeDB } from "$lib/firebase";
import { child, push, ref } from "@firebase/database";
import {
  type Unsubscribe,
  collection,
  onSnapshot,
  query,
} from "firebase/firestore";
import { onDestroy, onMount } from "svelte";

let alias = "";

alias = "";

const WRITE_DELAY = 500;
let writeTimeout = 0;

function writeName() {
  console.log(`Write the user's name now: [${alias}]`);
  const newAction = push(child(ref(realtimeDB), `users/${uid}/profile`), {
    type: "set_alias",
    alias,
  }).key;
}

function setNameTimeout() {
  writeTimeout = new Date().getTime() + WRITE_DELAY;
  setTimeout(() => {
    if (writeTimeout < new Date().getTime() + 10) {
      writeName();
    }
  }, WRITE_DELAY);
}

// biome-ignore lint/correctness/noUnusedLabels: no lint support for $
// biome-ignore lint/suspicious/noConfusingLabels: no lint support for $
$: if (alias) setNameTimeout();

let unsubscribeProfiles: Unsubscribe | undefined;

let users: { [k: string]: { alias: string } } = {};

function subscribeToProfilesCollection() {
  const profiles = collection(firestore, "profiles");
  unsubscribeProfiles = onSnapshot(query(profiles), (querySnapshot) => {
    // biome-ignore lint/complexity/noForEach: <explanation>
    querySnapshot.docChanges().forEach((change) => {
      const doc = change.doc;
      console.log(doc.data());
      console.log(doc.ref.id);
      users[doc.ref.id] = change.doc.data() as { alias: string };
      // biome-ignore lint/correctness/noSelfAssign: <explanation>
      users = users;
    });
  });
}

onMount(() => {
  subscribeToProfilesCollection();
});

onDestroy(() => {
  unsubscribeProfiles?.();
});
</script>

View your profile here.

<input bind:value={alias} on:blur={writeName} placeholder="enter your name" />
<p>Hello {alias || "stranger"}!</p>
<ul>
{#each Object.keys(users) as user}
	<li>{users[user].alias}</li>
{/each}
</ul>
