<script lang="ts">
import { goto } from "$app/navigation";
import type { GameAction, GameOptions } from "$common/gamestate";
import type { UserProfile } from "$common/profiles";
import { uid } from "$lib/auth";
import { auth, googleAuthProvider, user } from "$lib/auth";
import { firestore, realtimeDB } from "$lib/firebase";
import { push, ref } from "@firebase/database";
import { Signin } from "@ourway/svelte-firebase-auth";
import {
  type Unsubscribe,
  collection,
  onSnapshot,
  query,
} from "firebase/firestore";
import { onDestroy, onMount } from "svelte";

let games: { [gameid: string]: GameOptions } = {};
let joinedGames: string[] = [];
let joinableGames: string[] = [];

let unsubscribeGames: Unsubscribe | undefined;

function subscribeToGamesCollection() {
  const gamedata = collection(firestore, "games");
  unsubscribeGames = onSnapshot(query(gamedata), (querySnapshot) => {
    for (const change of querySnapshot.docChanges()) {
      const doc = change.doc;
      games[doc.ref.id] = change.doc.data() as GameOptions;
      if (games[doc.ref.id]?.deleted) {
        delete games[doc.ref.id];
      }
      // biome-ignore lint/correctness/noSelfAssign: necessary for svelte to react
      games = games;
      if (uid !== undefined) {
        updateGameList(uid);
      }
    }
  });
}

onMount(() => {
  subscribeToGamesCollection();
  subscribeToProfilesCollection();
});

onDestroy(() => {
  unsubscribeGames?.();
  unsubscribeProfiles?.();
});

let unsubscribeProfiles: Unsubscribe | undefined;

let users: { [k: string]: UserProfile } = {};

function updateGameList(userid: string) {
  if (userid === uid && users[uid]) {
    joinedGames = users[uid].games || [];
    joinableGames = Object.keys(games).filter(
      (x) => joinedGames.indexOf(x) === -1 && !games[x].started,
    );
  }
}
function subscribeToProfilesCollection() {
  const profiles = collection(firestore, "profiles");
  unsubscribeProfiles = onSnapshot(query(profiles), (querySnapshot) => {
    for (const change of querySnapshot.docChanges()) {
      const doc = change.doc;
      users[doc.ref.id] = change.doc.data() as UserProfile;
      // biome-ignore lint/correctness/noSelfAssign: necessary for svelte to react
      users = users;
      updateGameList(doc.ref.id);
    }
  });
}

function pushAction(gameid: string, action: GameAction) {
  push(ref(realtimeDB, `games/${gameid}/${uid}`), action);
}

function joinGame(gameid: string) {
  return () => {
    console.log("Join: ", gameid);
    if (uid !== undefined) {
      const alias = users[uid].alias;
      const avatar = users[uid].profile_image;
      pushAction(gameid, { type: "join_game", uid, alias, avatar });
      goto(`/game/?id=${gameid}`);
    }
  };
}
function openGame(gameid: string) {
  return () => {
    goto(`/game/?id=${gameid}`);
  };
}
</script>

<div class="main">
  <h1>Cluster</h1>
  <p>Cluster is a space conquest game.</p>
  <p>Your games are: ....</p>
<ul>
{#each joinedGames as game}
  {#if games[game].winner === undefined}
    <li><button on:click={openGame(game)}>Open</button> {games[game].name}</li>
  {/if}
{/each}
</ul>
  <p>Completed games:</p>
<ul>
{#each joinedGames as game}
  {#if games[game].winner !== undefined}
    <li><button on:click={openGame(game)}>Open</button> {games[game].name} - Won by {users[games[game].winner].alias}</li>
  {/if}
{/each}
</ul>
  <p>Join a new game! Choose one or more of: ....</p>
<ul>
{#each joinableGames as game}
  {#if games[game].playersNeeded}
    <li><button on:click={joinGame(game)}>Join</button> {games[game].name} (needs {games[game].playersNeeded} more players)</li>
  {:else}
    <li><button disabled>Full</button> {games[game].name}</li>
  {/if}
{/each}
</ul>
  <p>
    Cluster is an obsessive slow real-time strategy game in which you compete to
    dominate the galaxy, but in which no single player has the resources or
    power to win on their own, making diplomacy and cooperation key to
    establishing a winning alliance or a winning play.
  </p>

  <Signin {auth} {googleAuthProvider} on:user_changed={user} />
</div>

<style>
  h1 {
    margin-top: 0;
  }
  .main {
    padding-left: 2em;
    padding-right: 2em;
  }
</style>
