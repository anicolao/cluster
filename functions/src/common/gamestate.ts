export interface GameOptions {
  name: string;
  /** automatically create a new similar game each time this one fills */
  autospawn: boolean;
  /** number of players this game holds */
  playerCount: number;
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

export function initialGameState(options: GameOptions): GameState {
  return {
    tick: 0,
    started: false,
    completed: false,
    players: {},
    options,
  };
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
