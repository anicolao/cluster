export interface GameOptions {
  name: string;
  /** automatically create a new similar game each time this one fills */
  autospawn: boolean;
  /** number of players this game holds */
  playerCount: number;
  /** number of players needed to start this game */
  playersNeeded: number;
  started?: boolean;
  deleted?: boolean;
  winner?: string;
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

export function gameOver(gamestate: GameState) {
  return gamestate.options.winner !== undefined;
}

export function game(gamestate: GameState, action: GameAction) {
  const nextstate = { ...gamestate };
  if (action.type === "join_game") {
    console.log(`joinGame ${action}`);
    const { uid, alias, avatar } = action;
    const playerInfo: PlayerInfo = { uid, alias, avatar };

    if (nextstate.players[playerInfo.uid] === undefined) {
      nextstate.players = { ...nextstate.players };
      nextstate.players[playerInfo.uid] = playerInfo;
      nextstate.options = { ...nextstate.options };
      nextstate.options.playersNeeded -= 1;
    }
  } else if (action.type === "leave_game") {
    console.log(`leaveGame ${action}`);
    const { uid } = action;
    nextstate.players = { ...nextstate.players };
    if (nextstate.players[uid] !== undefined) {
      delete nextstate.players[uid];
      nextstate.options = { ...nextstate.options };
      nextstate.options.playersNeeded += 1;
    }
  } else if (action.type === "compute_tick") {
    if (!gameOver(nextstate)) {
      nextstate.tick++;
      if (Math.random() > 0.5) {
        const players = Object.values(nextstate.players);
        const winner = Math.trunc(Math.random() * players.length);
        nextstate.options = { ...nextstate.options };
        nextstate.options.winner = players[winner].uid;
      }
    }
  } else if (action.type === "start_game") {
    nextstate.started = true;
    nextstate.options = { ...nextstate.options };
    nextstate.options.started = true;
  }
  return nextstate;
}
