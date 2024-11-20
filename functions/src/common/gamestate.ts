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
}

export interface ChatRoom {
  title: string;
  chats: { [timestamp: string]: ChatMessage };
}
export interface ChatMessage {
  roomId: string;
  id: string;
  parentId: string;
  creator: string;
  content: string;
  timestamp: number;
}
export interface GameState {
  tick: number;
  options: GameOptions;
  keys: { [id: string]: { [playerid: string]: string } };
  objects: { [id: string]: string };
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

export interface PostChat {
  type: "post_chat";
  roomId: string;
  parentId: string;
  content: string;
  creator: string;
  key: string;
  timestamp: string;
}

export type GameAction =
  | JoinGameAction
  | LeaveGameAction
  | StartGameAction
  | ComputeTickGameAction
  | CreateChatRoom
  | PostChat;

export function initialGameState(options: GameOptions): GameState {
  return {
    tick: 0,
    options,
    objects: {},
    keys: {},
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
    const playerInfo: PlayerInfo = { uid, alias, avatar, publicKey };

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
    nextstate.options = { ...nextstate.options };
    nextstate.options.players = { ...nextstate.options.players };
    nextstate.options.players[creator] = {
      ...nextstate.options.players[creator],
    };
    const player = nextstate.options.players[creator];
    const privateKey = player.publicKey; // TODO: use an actually private thing
    const roomId = uuid();
    console.log(`roomId ${roomId}`);
    nextstate.objects = { ...nextstate.objects };
    const chatRoom: ChatRoom = {
      title,
      chats: {},
    };
    chatRoom.chats[timestamp] = {
      id: roomId,
      roomId,
      parentId: roomId,
      timestamp: +timestamp,
      creator,
      content: `@${creator}`,
    };
    nextstate.objects[roomId] = encrypt(key, JSON.stringify(chatRoom));

    nextstate.keys = { ...nextstate.keys };
    nextstate.keys[roomId] = {};
    for (const playerId in nextstate.options.players) {
      nextstate.keys[roomId][playerId] = "badkey";
    }
    nextstate.keys[roomId][creator] = encrypt(privateKey, key);
  } else if (action.type === "post_chat") {
    const { content, creator, key, roomId, parentId, timestamp } = action;
    const player = nextstate.options.players[creator];
    const privateKey = player.publicKey; // TODO: use an actually private thing
    const chatId = uuid();
    nextstate.objects = { ...nextstate.objects };
    const chat: ChatMessage = {
      roomId,
      id: chatId,
      parentId,
      creator,
      timestamp: +timestamp,
      content,
    };
    nextstate.objects[chatId] = encrypt(key, JSON.stringify(chat));

    nextstate.keys = { ...nextstate.keys };
    nextstate.keys[chatId] = { ...nextstate.keys[parentId] };
    nextstate.keys[chatId][creator] = encrypt(privateKey, key);
    if (content.match(/^@[A-Za-z0-9]*$/) !== null) {
      const shareId = content.substring(1);
      if (nextstate.keys[chatId][shareId]) {
        const shareKey = nextstate.options.players[shareId].publicKey; // TODO: use an actually private thing
        nextstate.keys[chatId][shareId] = encrypt(shareKey, key);
      }
    }
  }
  return nextstate;
}
