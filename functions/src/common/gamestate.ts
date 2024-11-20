import { v4 as uuid } from "uuid";
import { decrypt, encrypt } from "./crypt";
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
  publicKey: string;
  keyBox: string;
}

export interface Chat {
  playerid: string;
  content: string;
}
export interface ChatRoom {
  title: string;
  chats: { [timestamp: string]: Chat };
}
export interface GameState {
  tick: number;
  options: GameOptions;
  rooms: { [id: string]: ChatRoom };
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

export interface CreateChatRoom {
  type: "create_chat_room";
  title: string;
  creator: string;
  key: string;
  timestamp: string;
}

export type GameAction =
  | JoinGameAction
  | LeaveGameAction
  | StartGameAction
  | ComputeTickGameAction
  | CreateChatRoom;

export function initialGameState(options: GameOptions): GameState {
  return {
    tick: 0,
    options,
    rooms: {},
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
    const publicKey = uid[0];
    const keyBox = encrypt(publicKey, "{}");
    const playerInfo: PlayerInfo = { uid, alias, avatar, publicKey, keyBox };

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
  } else if (action.type === "create_chat_room") {
    const { title, creator, key, timestamp } = action;
    console.log(title, creator, key, timestamp);
    const decryptedTitle = decrypt(key, title);
    console.log(`decryptedTitle ${decryptedTitle}`);
    nextstate.options = { ...nextstate.options };
    nextstate.options.players = { ...nextstate.options.players };
    nextstate.options.players[creator] = {
      ...nextstate.options.players[creator],
    };
    const player = nextstate.options.players[creator];
    const privateKey = player.publicKey; // TODO: use an actually private thing
    const boxJson = decrypt(privateKey, player.keyBox);
    if (decryptedTitle !== null && boxJson !== null) {
      const roomId = uuid();
      console.log(`roomId ${roomId}`);
      nextstate.rooms = { ...nextstate.rooms };
      nextstate.rooms[roomId] = {
        title,
        chats: {},
      };
      nextstate.rooms[roomId].chats[timestamp] = {
        playerid: encrypt(key, creator),
        content: encrypt(key, `@${creator}`),
      };

      const box = JSON.parse(boxJson);
      box[roomId] = key;
      player.keyBox = encrypt(player.publicKey, JSON.stringify(box));
    }
  }
  return nextstate;
}
