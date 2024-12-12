<script lang="ts">
import { goto } from "$app/navigation";
import { page } from "$app/stores";
import { decrypt } from "$common/crypt";
import {
  type ChatRoom,
  type GameAction,
  type GameState,
  type Position,
  type Star,
  gameOver,
} from "$common/gamestate";
import { uid } from "$lib/auth";
import Galaxy from "$lib/components/Galaxy.svelte";
import { firestore, realtimeDB } from "$lib/firebase";
import { push, ref } from "@firebase/database";
import { patch } from "@ourway/patch";
import { Canvas } from "@threlte/core";
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
const chatRooms: { [k: string]: ChatRoom } = {};
let lastTimeStamp = 0;

const stars: Star[] = [];

// biome-ignore lint/suspicious/noExplicitAny: data came from firebase, no type
function processNewObject(key: string, objectId: string, newObject: any) {
  if (newObject.title !== undefined) {
    const chatRoom: ChatRoom = newObject as ChatRoom;
    chatRooms[objectId] = chatRoom;
  } else if (newObject.roomId !== undefined) {
    const { roomId, parentId, id, timestamp, content, creator } = newObject;
    if (!chatRooms[roomId]) {
      // new chat room found.
      function processChats(id: string) {
        const chatOrRoom = JSON.parse(
          decrypt(key, gameState.objects[id]) || "{}",
        );
        if (chatOrRoom.id) {
          gameState.keys[id][uid || ""] = gameState.keys[objectId][uid || ""];
          console.log(
            `Set key for ${chatOrRoom.id} to ${gameState.keys[id][uid || ""]}`,
          );
          processChats(chatOrRoom.parentId);
          chatRooms[roomId].chats[chatOrRoom.timestamp] = { ...chatOrRoom };
        } else if (chatOrRoom.title) {
          gameState.keys[id][uid || ""] = gameState.keys[objectId][uid || ""];
          console.log(
            `Set key for ${chatOrRoom.id} to ${gameState.keys[id][uid || ""]}`,
          );
          processNewObject(key, id, chatOrRoom);
        }
      }
      processChats(newObject.parentId);
    }
    chatRooms[roomId].chats[timestamp] = {
      id,
      roomId: newObject.roomId,
      timestamp,
      creator,
      parentId,
      content,
    };
  } else if (newObject.type === "star") {
    const star = newObject as Star;
    stars.push(star);
  }
}
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
            const patchData = JSON.parse(block[time]);
            gameState = patch(gameState, patchData) as GameState;
            lastTimeStamp = +time;
            console.log(
              `Applied game state patch for time ${lastTimeStamp}`,
              patchData,
            );
            if (uid && (patchData?.keys || patchData?.objects)) {
              const privateKey = uid[0];
              const allKeysTogether = {
                ...patchData?.keys,
                ...patchData?.objects,
              };
              for (const objectId of Object.keys(allKeysTogether)) {
                if (!gameState.keys[objectId]) continue;
                const decryptionKey = gameState.keys[objectId][uid];
                if (decryptionKey) {
                  const key = decrypt(privateKey, decryptionKey);
                  if (key !== null) {
                    const newObject = JSON.parse(
                      decrypt(key, gameState.objects[objectId]) || "{}",
                    );
                    processNewObject(key, objectId, newObject);
                  }
                }
              }
            }
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

let roomName = "";
function createChatRoom() {
  if (gameId && uid) {
    console.log(`Create chat room ${roomName}`);
    const timestamp = `${new Date().getTime()}`;
    const key = `${Math.round(Math.random() * 10)}`;
    pushAction(gameId, {
      type: "create_chat_room",
      title: roomName,
      creator: uid,
      key,
      timestamp,
    });
    roomName = "";
  }
}
let chatContent = "";
function postChat(roomId: string) {
  return () => {
    if (uid !== undefined && gameId) {
      const timestamp = `${new Date().getTime()}`;
      const privateKey = uid[0];
      const key = decrypt(privateKey, gameState.keys[roomId][uid]);
      let parentId = roomId;
      const sortedTimestamps = Object.keys(chatRooms[roomId].chats)
        .filter((x) => +x)
        .sort()
        .reverse();
      if (sortedTimestamps.length) {
        parentId = chatRooms[roomId].chats[sortedTimestamps[0]].id;
      }
      if (key !== null) {
        const content = chatContent;
        pushAction(gameId, {
          type: "post_chat",
          roomId,
          parentId,
          content,
          creator: uid,
          key,
          timestamp,
        });
      }
      chatContent = "";
    }
  };
}
</script>

<div class="main">
  <h1>Game tick {gameState.tick}</h1>
{#if gameState.options?.started}
  {#if gameOver(gameState) && gameState.options.winner !== undefined}
      Game Over. Congratulations to {gameState.options.players[gameState.options.winner].alias}!
  {/if}
{:else}
    {#if gameState.options?.playersNeeded > 0}
      <p>Waiting for players...</p>
    {:else}
      <p>Waiting for first tick...</p>
    {/if}
{/if}

{#if gameState.options !== undefined}
  <p>Welcome to your game: {gameState.options.name}</p>
  <ul>
    {#each Object.keys(gameState.options?.players || {}) as pk}
      <li>
        <img alt="avatar" src="{gameState.options.players[pk].avatar}"/>
          {gameState.options.players[pk].alias}</li>
    {/each}
  </ul>
  <div class="map">
      <Canvas>
        <Galaxy {stars} />
      </Canvas>
  </div>
  <p>Chat rooms</p>
  <ul>
    {#each Object.keys(chatRooms) as roomId}
        <li>{chatRooms[roomId].title}
          <ul>
          {#each Object.keys(chatRooms[roomId].chats) as timestamp}
            <li>{new Date(+timestamp).toLocaleString({dateStyle: "short"})} <b>{chatRooms[roomId].chats[timestamp].content}</b></li>
          {/each}
            <li><input bind:value={chatContent} placeholder="Message" /><button on:click={postChat(roomId)}>Create</button></li>
          </ul>
        </li>
    {/each}
  </ul>
  <p>Create a chat room:
    <input bind:value={roomName} placeholder="New Chat Room Name" />
    <button on:click={createChatRoom}>Create</button>
  </p>
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

  .map {
    border: 1px solid red;
    width: 900px;
    height: 900px;
  }
</style>

