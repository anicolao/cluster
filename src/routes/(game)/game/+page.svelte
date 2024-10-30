<script lang="ts">
import { goto } from "$app/navigation";
import { page } from "$app/stores";
import type { GameAction, GameState } from "$common/gamestate";
import { uid } from "$lib/auth";
import { firestore, realtimeDB } from "$lib/firebase";
import { push, ref } from "@firebase/database";
import { patch } from "@ourway/patch";
import {
  type Unsubscribe,
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { onDestroy, onMount } from "svelte";

let unsubscribeFromGamePatches: Unsubscribe | undefined;

// biome-ignore lint/suspicious/noConfusingLabels: svelte label
$: gameId = $page.url.searchParams.get("id");

let gameState: GameState = {} as GameState;
let lastTimeStamp = 0;

function subscribeToGamePatches() {
  const blocks = collection(firestore, `games/${gameId}/blocks`);
  unsubscribeFromGamePatches = onSnapshot(
    query(blocks, orderBy("initial_timestamp")),
    (querySnapshot) => {
      for (const change of querySnapshot.docChanges()) {
        const doc = change.doc;
        // get all the keys which are valid numbers; they are the timestamps
        // of each patch.
        const block = doc.data();
        const timestamps = Object.keys(block)
          .filter((x) => +x)
          .sort();
        for (const time of timestamps) {
          if (+time > lastTimeStamp) {
            gameState = patch(gameState, JSON.parse(block[time])) as GameState;
            lastTimeStamp = +time;
            console.log(`Applied game state patch for time ${lastTimeStamp}`);
          }
        }
      }
    },
  );
}

onMount(() => {
  subscribeToGamePatches();
});

onDestroy(() => {
  unsubscribeFromGamePatches?.();
});

// TODO: share this duplicated logic
function pushAction(gameid: string, action: GameAction) {
  push(ref(realtimeDB, `games/${gameid}/${uid}`), action);
}

function leaveGame(gameid: string) {
  return () => {
    console.log("Leave: ", gameid);
    if (uid !== undefined) {
      pushAction(gameid, { type: "leave_game", uid });
      goto("/lobby");
    }
  };
}
</script>

<div class="main">
  <h1>Game tick {gameState.tick} started? {gameState.started}</h1>
{#if gameState.options !== undefined}
  <p>Welcome to your game: {gameState.options.name}</p>
  <ul>
    {#each Object.keys(gameState.players) as pk}
      <li>
        <img src="{gameState.players[pk].avatar}"/>
          {gameState.players[pk].alias}</li>
    {/each}
  </ul>
{#if gameId}
    <button on:click={leaveGame(gameId)}>Leave</button>
{/if}
{:else}
    Loading...
{/if}
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
