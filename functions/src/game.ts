import type {
  GameAction,
  GameOptions,
  GameState,
  JoinGameAction,
  LeaveGameAction,
  PlayerInfo,
} from "$common/gamestate.js";
import type { UserProfile } from "$common/profiles.js";
import * as admin from "firebase-admin";
import type { DocumentData, DocumentReference } from "firebase-admin/firestore";
import { type Patch, diff, patch } from "./patch";

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
    // brand new gamestate
    gamestate.tick = 0;
    gamestate.started = false;
    gamestate.completed = false;
    gamestate.players = {};
    const options = (
      await db.doc(`/games/${gameid}`).get()
    ).data() as GameOptions;
    gamestate.options = options;
  }
  return gamestate;
}

async function getProfile(profileDoc: DocumentReference<DocumentData>) {
  const profile = (await profileDoc.get()).data() as UserProfile;
  if (profile.games === undefined) profile.games = [];
  return profile;
}

export function game(gamestate: GameState, action: GameAction) {
  const nextstate = { ...gamestate };
  if (action.type === "join_game") {
    console.log(`joinGame ${action}`);
    const { uid, alias, avatar } = action;
    const playerInfo: PlayerInfo = { uid, alias, avatar };

    nextstate.players = { ...nextstate.players };
    nextstate.players[playerInfo.uid] = playerInfo;
  } else if (action.type === "leave_game") {
    console.log(`leaveGame ${action}`);
    const { uid } = action;
    nextstate.players = { ...nextstate.players };
    delete nextstate.players[uid];
  }
  return nextstate;
}

export async function executeGameAction(gameid: string, action: GameAction) {
  const gamestate = await getGameState(gameid);
  const nextstate = game(gamestate, action);
  const p = diff(gamestate, nextstate);
  return writePatch(gameid, p);
}
export async function joinGame(gameid: string, action: JoinGameAction) {
  // update the profile for join/leave game
  const db = admin.firestore();
  const profileDoc = db.doc(`/profiles/${action.uid}`);
  const profile = await getProfile(profileDoc);
  profile.games = [...profile.games.filter((x) => x !== gameid), gameid];
  await profileDoc.set(profile);

  return executeGameAction(gameid, action);
}

export async function leaveGame(gameid: string, action: LeaveGameAction) {
  // update the profile for join/leave game
  const db = admin.firestore();
  const profileDoc = db.doc(`/profiles/${action.uid}`);
  const profile = await getProfile(profileDoc);
  profile.games = profile.games.filter((x) => x !== gameid);
  await profileDoc.set(profile);

  return executeGameAction(gameid, action);
}
