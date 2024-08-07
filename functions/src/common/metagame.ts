import type { GameOptions } from "./gamestate";

export interface CreateGameAction {
  type: "create_game";
  gameOptions: GameOptions;
}

export interface DeleteGameAction {
  type: "delete_game";
  gameid: string;
}

export type MetaGameAction = CreateGameAction | DeleteGameAction;
