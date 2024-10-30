import type { UserProfile } from "$common/profiles";
import { type Patch, diff, patch } from "@ourway/patch";
import * as admin from "firebase-admin";
import type { DocumentData, DocumentReference } from "firebase-admin/firestore";
import {
  type GameAction,
  type GameOptions,
  type GameState,
  type JoinGameAction,
  type LeaveGameAction,
  game,
  initialGameState,
} from "./common/gamestate";
import { CreateGameAction } from "$common/metagame";
import { randomName } from "$common/gamenames";
import { createGame } from "./metagame";

async function writePatch(gameid: string, p: Patch) {
  const db = admin.firestore();
  const blockCollection = db.collection(`/games/${gameid}/blocks`);
  let blockName = "Block_0";
  const now = new Date().getTime();
  const blocks = await blockCollection
    .orderBy("initial_timestamp", "desc")
    .limit(1)
    .get();
  const blockChanges = blocks.docChanges();
  if (blockChanges.length === 1) {
    blockName = blockChanges[0].doc.id;
  }
  let blockNumber = Number.parseInt(blockName.split("_")[1]);
  const data: { [k: string]: string | number } = { last_timestamp: now };
  data[`${now}`] = JSON.stringify(p);
  const path = `/games/${gameid}/blocks/${blockName}`;
  try {
    await db.doc(path).update(data);
  } catch (err) {
    ++blockNumber;
    const newBlock = `/games/${gameid}/blocks/Block_${blockNumber}`;
    await db.doc(newBlock).set({
      initial_timestamp: now,
      ...data,
    });
  }
}

async function getGameState(gameid: string) {
  const db = admin.firestore();
  const game = db.collection(`/games/${gameid}/blocks`);
  const snapshot = await game.get();
  let gamestate = {} as GameState;
  for (const block of snapshot.docs) {
    console.log(`${block.id} contains ${block.data()}`);
    const keys = Object.keys(block.data())
      .filter((x) => +x)
      .sort();
    for (const k of keys) {
      gamestate = patch(gamestate, JSON.parse(block.data()[k])) as GameState;
    }
  }
  if (gamestate.tick === undefined) {
    const options = (
      await db.doc(`/games/${gameid}`).get()
    ).data() as GameOptions;
    gamestate = initialGameState(options);
    await writePatch(gameid, gamestate);
  }
  return gamestate;
}

export async function executeGameAction(gameid: string, action: GameAction) {
  const gamestate = await getGameState(gameid);
  const nextstate = game(gamestate, action);
  const p = diff(gamestate, nextstate);
  return writePatch(gameid, p);
}

async function getProfile(profileDoc: DocumentReference<DocumentData>) {
  const profile = (await profileDoc.get()).data() as UserProfile;
  if (profile.games === undefined) profile.games = [];
  return profile;
}

export async function joinGame(gameid: string, action: JoinGameAction) {
  // update the profile for join/leave game
  const db = admin.firestore();
  const profileDoc = db.doc(`/profiles/${action.uid}`);
  const profile = await getProfile(profileDoc);
  profile.games = [...profile.games.filter((x) => x !== gameid), gameid];
  await profileDoc.set(profile);
  // decrement the players needed counter on the game options
  const gameDoc = db.doc(`/games/${gameid}`);
  const options = (await gameDoc.get()).data();
  if (options) {
    options.playersNeeded--;
    await gameDoc.update(options);
  }

  return executeGameAction(gameid, action);
}

export async function leaveGame(gameid: string, action: LeaveGameAction) {
  // update the profile for join/leave game
  const db = admin.firestore();
  const profileDoc = db.doc(`/profiles/${action.uid}`);
  const profile = await getProfile(profileDoc);
  profile.games = profile.games.filter((x) => x !== gameid);
  await profileDoc.set(profile);
  // increment the players needed counter on the game options
  const gameDoc = db.doc(`/games/${gameid}`);
  const options = (await gameDoc.get()).data();
  if (options) {
    options.playersNeeded++;
    await gameDoc.update(options);
  }

  return executeGameAction(gameid, action);
}

export async function updateGames() {
  const ret = [];
  const db = admin.firestore();
  const games = db.collection(`/games`);
  const snapshot = await games.get();
  for (const game of snapshot.docs) {
    const gameOptions = game.data();
    console.log("JSON: ", JSON.stringify(gameOptions, null, 2));
    if (gameOptions.started) {
      ret.push(executeGameAction(game.id, { type: "compute_tick" }));
    } else if (gameOptions.playersNeeded === 0) {
      ret.push(executeGameAction(game.id, { type: "start_game" }));
      gameOptions.started = true;
      await game.ref.update(gameOptions);
      if (gameOptions.autospawn) {
        // create a replacement game
        createGame({
          name: randomName(),
          autospawn: true,
          playerCount: gameOptions.playerCount,
        });
      }
    }
  }
  return Promise.all(ret);
}
