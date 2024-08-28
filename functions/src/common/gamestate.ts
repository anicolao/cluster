export interface GameOptions {
  name: string;
  autospawn: boolean; // automatically create a new similar game each time this one fills
  playerCount: number; // number of players this game holds
  deleted?: boolean;
}

export interface PlayerInfo {
  uid: string;
  alias: string;
  avatar: string;
}

export interface GameState {
  tick: number;
  started: boolean;
  completed: boolean;
  players: { [k: string]: PlayerInfo };
  options: GameOptions;
}

export interface JoinGameAction {
  type: "join_game";
  uid: string;
  alias: string;
  avatar: string;
}

export interface LeaveGameAction {
  type: "leave_game";
  uid: string;
}

export interface StartGameAction {
  type: "start_game";
}

export interface ComputeTickGameAction {
  type: "compute_tick";
}

export type GameAction =
  | JoinGameAction
  | LeaveGameAction
  | StartGameAction
  | ComputeTickGameAction;
