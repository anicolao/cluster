<script lang="ts">
import { randomName } from "$common/gamenames";
import type { GameOptions } from "$common/gamestate";
import type {
  CreateGameAction,
  DeleteGameAction,
  MetaGameAction,
} from "$common/metagame";
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

function pushAction(action: MetaGameAction) {
  push(ref(realtimeDB, `users/${uid}/games`), action);
}

let unsubscribeGames: Unsubscribe | undefined;

let games: { [gameid: string]: GameOptions } = {};

function subscribeToGamesCollection() {
  const gamedata = collection(firestore, "games");
  unsubscribeGames = onSnapshot(query(gamedata), (querySnapshot) => {
    for (const change of querySnapshot.docChanges()) {
      const doc = change.doc;
      console.log(doc.data());
      console.log(doc.ref.id);
      games[doc.ref.id] = change.doc.data() as GameOptions;
      if (games[doc.ref.id]?.deleted) {
        delete games[doc.ref.id];
      }
      // biome-ignore lint/correctness/noSelfAssign: necessary for svelte to react
      games = games;
    }
  });
}

onMount(() => {
  subscribeToGamesCollection();
});

onDestroy(() => {
  unsubscribeGames?.();
});

function createGame() {
  const action: CreateGameAction = {
    type: "create_game",
    gameOptions: { name, autospawn, playerCount },
  };
  pushAction(action);

  name = randomName();
  autospawn = true;
  playerCount = 2;
}

function deleteGame(gameid: string) {
  return () => {
    const action: DeleteGameAction = {
      type: "delete_game",
      gameid,
    };
    pushAction(action);
  };
}

let name = randomName();
let autospawn = true;
let playerCount = 2;
</script>

<p>
Create and view game list.
</p>

<input bind:value={name} placeholder="Enter Game Name" />
<label>
	<input bind:value={playerCount} />
	Players
</label>
<label>
	<input bind:checked={autospawn} type="checkbox"/>
	Autospawn
</label>
<button on:click={createGame}>Create</button>

<ul>
{#each Object.keys(games) as game}
  <li><button on:click={deleteGame(game)}>❌</button> {games[game].name}</li>
{/each}
</ul>

<style>
</style>

