<script lang="ts">
import type { ProfileAction } from "$common/profiles";
import { uid } from "$lib/auth";
import { firestore, realtimeDB } from "$lib/firebase";
import { push, ref } from "@firebase/database";
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

function pushAction(action: ProfileAction) {
  push(ref(realtimeDB, `users/${uid}/profile`), action);
}

function writeName() {
  console.log(`Write the user's name now: [${alias}]`);
  pushAction({ type: "set_alias", alias });
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

let users: { [k: string]: { alias: string; profile_image: string } } = {};

function subscribeToProfilesCollection() {
  const profiles = collection(firestore, "profiles");
  unsubscribeProfiles = onSnapshot(query(profiles), (querySnapshot) => {
    for (const change of querySnapshot.docChanges()) {
      const doc = change.doc;
      console.log(doc.data());
      console.log(doc.ref.id);
      users[doc.ref.id] = change.doc.data() as {
        alias: string;
        profile_image: string;
      };
      if (doc.ref.id === uid) {
        alias = users[uid].alias;
        profileSelection = profileImages.indexOf(users[uid].profile_image);
        if (profileSelection < 0) profileSelection = 0;
      }
      // biome-ignore lint/correctness/noSelfAssign: necessary for svelte to react
      users = users;
    }
  });
}

onMount(() => {
  subscribeToProfilesCollection();
});

onDestroy(() => {
  unsubscribeProfiles?.();
});

const profileImages = [
  "images/A1-small128.webp",
  "images/A2-small128.webp",
  "images/G1-small128.webp",
  "images/G2-small128.webp",
  "images/M1-small128.webp",
  "images/M2-small128.webp",
  "images/O1-small128.webp",
  "images/O2-small128.webp",
];

let dropdownOpen = "";
let profileSelection = 0;

function toggleDropdown() {
  if (dropdownOpen !== "") {
    dropdownOpen = "";
  } else {
    dropdownOpen = "ddopen";
  }
}
function chooseProfile(i: number) {
  return () => {
    profileSelection = i;
    toggleDropdown();
    pushAction({ type: "set_avatar", profile_image: profileImages[i] });
  };
}
</script>

<p>
View your profile here.
</p>
<input bind:value={alias} on:blur={writeName} placeholder="enter your name" />
<p>Hello {alias || "stranger"}!</p>
<div class="dropdown {dropdownOpen}">
  <img src={profileImages[profileSelection]} alt="profile" on:click={toggleDropdown}>
  <div class="dropdown-content">
    {#each profileImages as profileOption, i}
      <img on:click={chooseProfile(i)} src={profileOption} alt={profileOption} />
    {/each}
  </div>
</div>

<ul>
{#each Object.keys(users) as user}
  <li><img src={users[user].profile_image} alt={users[user].profile_image} /> {users[user].alias}</li>
{/each}
</ul>

<style>
.dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-content {
  display: none;
  position: aboslute;
  box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
  z-index: 1;
}

.dropdown-content img {
  padding: 0.6em;
}

.dropdown-content img {
  border: 1px solid rgba(0,0,0,0);
  border-radius: 0.5em;
}
.dropdown-content img:hover {
  border: 1px solid green;
}

.ddopen .dropdown-content {
  display: block;
}

li img {
width: 64px;
}
</style>

