<script lang="ts">
import { uid } from "$lib/auth";
import { realtimeDB } from "$lib/firebase";
import { child, push, ref } from "@firebase/database";

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
</script>

View your profile here.

<input bind:value={alias} on:blur={writeName} placeholder="enter your name" />
<p>Hello {alias || "stranger"}!</p>
