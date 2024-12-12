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

export type Position = [number, number, number];
export interface Star {
  type: "star";
  starClass: "M";
  position: Position;
}
function generateUniverse(): Star[] {
  function getPoint(): Position {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = Math.cbrt(Math.random());
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);
    const x = r * sinPhi * cosTheta;
    const y = r * sinPhi * sinTheta;
    const z = r * cosPhi;
    return [x, y, z];
  }
  const t = (1 + Math.sqrt(5)) / 2;

  const homeStars: Position[] = [
    [-1, t, 0],
    [1, t, 0],
    [-1, -t, 0],
    [1, -t, 0],
    [0, -1, t],
    [0, 1, t],
    [0, -1, -t],
    [0, 1, -t],
    [t, 0, -1],
    [t, 0, 1],
    [-t, 0, -1],
    [-t, 0, 1],
  ];

  function makeStar(position: Position): Star {
    return { type: "star", starClass: "M", position };
  }

  const stars: Star[] = [];
  const NEIGHBOURS = 15;
  function makeNeighbourhood(homeStar: Position) {
    //stars.push(homeStar);

    for (let i = 0; i < NEIGHBOURS; ++i) {
      const star = getPoint();
      let scaleFactor = 0.1;
      if (scaleFactor < 0) scaleFactor = 0.0001;
      stars.push(
        makeStar([
          homeStar[0] + star[0],
          homeStar[1] + star[1],
          scaleFactor * (homeStar[2] + star[2]),
        ]),
      );
    }
  }

  for (const homeStar of homeStars) {
    makeNeighbourhood(homeStar);
  }
  return stars;
}
export function initialGameState(
  gamekey: string,
  options: GameOptions,
): GameState {
  const initialState = {
    tick: 0,
    options,
    objects: {},
    keys: {},
  } as GameState;
  const stars = generateUniverse();
  for (const s of stars) {
    const starId = uuid();
    const starKey = `${Math.trunc(Math.random() * 10)}`;
    initialState.objects[starId] = encrypt(starKey, JSON.stringify(s));
    initialState.keys[starId] = {
      key: encrypt(gamekey, starKey),
    };
  }

  return initialState;
}

export function gameOver(gamestate: GameState) {
  return gamestate.options.winner !== undefined;
}

export function game(
  gamekey: string,
  gamestate: GameState,
  action: GameAction,
) {
  const nextstate = { ...gamestate };
  if (action.type === "join_game") {
    console.log(`joinGame ${action}`);
    const { uid, alias, avatar } = action;
    const publicKey = uid[0];
    const privateKey = publicKey;
    const playerInfo: PlayerInfo = { uid, alias, avatar, publicKey };

    if (nextstate.options.players[playerInfo.uid] === undefined) {
      nextstate.options = { ...nextstate.options };
      nextstate.options.players = { ...nextstate.options.players };
      nextstate.options.players[playerInfo.uid] = playerInfo;
      nextstate.options.playersNeeded -= 1;
    }
    nextstate.keys = { ...nextstate.keys };
    for (const objectId in gamestate.objects) {
      if (nextstate.keys[objectId]) {
        nextstate.keys[objectId] = { ...nextstate.keys[objectId] };
      } else {
        continue;
      }
      const starKey = decrypt(gamekey, nextstate.keys[objectId].key);
      if (starKey !== null) {
        nextstate.keys[objectId][uid] = encrypt(privateKey, starKey);
      }
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
    const roomId = uuid();
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

    const player = nextstate.options.players[creator];
    const privateKey = player.publicKey; // TODO: use an actually private thing
    nextstate.keys[roomId][creator] = encrypt(privateKey, key);
  } else if (action.type === "post_chat") {
    const { content, creator, key, roomId, parentId, timestamp } = action;
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
