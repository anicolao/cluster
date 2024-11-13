export interface GameOptions {
  name: string;
  /** automatically create a new similar game each time this one fills */
  autospawn: boolean;
  /** number of players this game holds */
  playerCount: number;
  /** number of players needed to start this game */
  playersNeeded: number;
  started: boolean;
  deleted?: boolean;
  winner?: string;
  players: { [k: string]: PlayerInfo };
}

export interface PlayerInfo {
  uid: string;
  alias: string;
  avatar: string;
}

export interface GameState {
  tick: number;
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

    if (nextstate.options.players[playerInfo.uid] === undefined) {
      nextstate.options = { ...nextstate.options };
      nextstate.options.players = { ...nextstate.options.players };
      nextstate.options.players[playerInfo.uid] = playerInfo;
      nextstate.options.playersNeeded -= 1;
    }
  } else if (action.type === "leave_game") {
    console.log(`leaveGame ${action}`);
    const { uid } = action;
    if (nextstate.options.players[uid] !== undefined) {
      nextstate.options = { ...nextstate.options };
      nextstate.options.players = { ...nextstate.options.players };
      delete nextstate.options.players[uid];
      nextstate.options.playersNeeded += 1;
    }
  } else if (action.type === "compute_tick") {
    if (!gameOver(nextstate) && nextstate.options.started === true) {
      nextstate.tick++;
      if (nextstate.tick > 1 && Math.random() > 0.5) {
        const players = Object.values(nextstate.options.players);
        const winner = Math.trunc(Math.random() * players.length);
        nextstate.options = { ...nextstate.options };
        nextstate.options.winner = players[winner].uid;
      }
    }
  } else if (action.type === "start_game") {
    if (nextstate.options.playersNeeded === 0) {
      nextstate.options = { ...nextstate.options };
      nextstate.options.started = true;
    }
  }
  return nextstate;
}
