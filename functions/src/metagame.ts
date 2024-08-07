import * as admin from "firebase-admin";
import type { GameOptions } from "$common/gamestate";

export async function createGame(options: GameOptions) {
  // console.log(`module createGame ${options.name}`);
  const db = admin.firestore();

  const gameDoc = db.collection("/games").doc();
  return gameDoc.set(options);
}

export async function deleteGame(gameid: string) {
  // console.log(`module createGame ${options.name}`);
  const db = admin.firestore();

  const gameDoc = db.doc(`/games/${gameid}`);
  return gameDoc.update({ deleted: true });
}
