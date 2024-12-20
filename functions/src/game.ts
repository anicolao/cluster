import { type Patch, diff, patch } from "@ourway/patch";
import * as admin from "firebase-admin";
import {
  type GameAction,
  type GameOptions,
  type GameState,
  game,
  initialGameState,
} from "./common/gamestate";
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
  const p = diff(gamestate, nextstate) as GameState;
  if (p?.options !== undefined) {
    // patch contains changes to the options, write them to
    // the doc that contains options
    const db = admin.firestore();
    const gameDoc = db.doc(`/games/${gameid}`);
    await gameDoc.set(nextstate.options);
  }
  return writePatch(gameid, p);
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
      if (gameOptions.autospawn) {
        // create a replacement game
        createGame({
          name: randomName(),
          autospawn: true,
          playerCount: gameOptions.playerCount,
          playersNeeded: gameOptions.playerCount,
          players: {},
        });
      }
    }
  }
  return Promise.all(ret);
}
