import type { GameOptions } from "$common/gamestate";
import * as admin from "firebase-admin";

export async function createGame(options: GameOptions) {
  // console.log(`module createGame ${options.name}`);
  const db = admin.firestore();

  const gameDoc = db.collection("/games").doc();
  await gameDoc.set({
    ...options,
    playersNeeded: options.playerCount,
    started: false,
    players: {},
  });
  const keyDoc = db.doc(`/gamekeys/${gameDoc.id}`)
  return keyDoc.set({
    key: "8",
  });
}

export async function deleteGame(gameid: string) {
  // console.log(`module createGame ${options.name}`);
  const db = admin.firestore();

  const gameDoc = db.doc(`/games/${gameid}`);
  return gameDoc.update({ deleted: true });
}
