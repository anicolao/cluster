import { describe, expect, it } from "vitest";
import {
  type ComputeTickGameAction,
  type CreateChatRoom,
  type GameOptions,
  type JoinGameAction,
  type LeaveGameAction,
  type StartGameAction,
  game,
  initialGameState,
} from "../../src/common/gamestate";
import { decrypt, encrypt } from "../../src/common/crypt";

describe("gamestate tests", () => {
  const startgame: StartGameAction = {
    type: "start_game",
  };
  function initGame() {
    const options: GameOptions = {
      name: "test game",
      started: false,
      autospawn: true,
      playerCount: 1,
      playersNeeded: 1,
      players: {},
    };
    return initialGameState(options);
  }
  function joinGame(
    optional_uid?: string,
    optional_alias?: string,
    optional_avatar?: string,
  ) {
    const gamestate = initGame();
    const uid = optional_uid || "ABCD";
    const alias = optional_alias || "anAlias";
    const avatar = optional_avatar || "anAvatar";
    const joingame: JoinGameAction = {
      type: "join_game",
      uid,
      alias,
      avatar,
    };
    expect(gamestate.options.players[uid]).toBe(undefined);
    return game(gamestate, joingame);
  }
  it("joining a game adds the player", () => {
    const uid = "ABCD";
    const alias = "anAlias";
    const avatar = "anAvatar";
    const gamestate = joinGame(uid, alias, avatar);
    expect(gamestate.options.players[uid].uid).toBe(uid);
    expect(gamestate.options.players[uid].alias).toBe(alias);
    expect(gamestate.options.players[uid].avatar).toBe(avatar);
  });

  it("leaving a game removes the player", () => {
    const uid = "ABCDEF";
    let gamestate = joinGame(uid);
    expect(gamestate.options.players[uid].uid).toBe(uid);
    expect(Object.keys(gamestate.options.players).length).toBe(1);

    const leavegame: LeaveGameAction = {
      type: "leave_game",
      uid,
    };
    gamestate = game(gamestate, leavegame);
    expect(gamestate.options.players[uid]).toBe(undefined);
    expect(Object.keys(gamestate.options.players).length).toBe(0);
  });
  it("starts the game", () => {
    let gamestate = joinGame();
    expect(gamestate.options.started).toBe(false);
    expect(gamestate.tick).toBe(0);
    expect(gamestate.options.winner).toBe(undefined);

    gamestate = game(gamestate, startgame);
    expect(gamestate.options.started).toBe(true);
    expect(gamestate.tick).toBe(0);
    expect(gamestate.options.winner).toBe(undefined);
  });
  it("advances the first tick", () => {
    const computetick: ComputeTickGameAction = {
      type: "compute_tick",
    };
    let gamestate = joinGame();
    expect(gamestate.tick).toBe(0);
    expect(gamestate.options.started).toBe(false);
    expect(gamestate.options.winner).toBe(undefined);

    gamestate = game(gamestate, startgame);
    expect(gamestate.tick).toBe(0);
    expect(gamestate.options.started).toBe(true);
    expect(gamestate.options.winner).toBe(undefined);

    gamestate = game(gamestate, computetick);
    expect(gamestate.tick).toBe(1);
    expect(gamestate.options.started).toBe(true);
    expect(gamestate.options.winner).toBe(undefined);
  });
  it("advances ticks", () => {
    const computetick: ComputeTickGameAction = {
      type: "compute_tick",
    };
    let gamestate = joinGame();
    expect(gamestate.tick).toBe(0);
    expect(gamestate.options.started).toBe(false);
    expect(gamestate.options.winner).toBe(undefined);

    gamestate = game(gamestate, startgame);
    expect(gamestate.tick).toBe(0);
    expect(gamestate.options.started).toBe(true);
    expect(gamestate.options.winner).toBe(undefined);

    let gameover = false;
    const N = 20;
    let i = 0;
    while (i < N) {
      ++i;
      gamestate = game(gamestate, computetick);
      gameover = gamestate.options.winner !== undefined;
      expect(gamestate.options.started).toBe(true);
      if (gameover) {
        break;
      }
      expect(gamestate.tick).toBe(i);
      expect(gamestate.options.winner).toBe(undefined);
    }
    expect(gamestate.tick).toBe(i);
    expect(gamestate.options.started).toBe(true);
    if (gameover) {
      expect(gamestate.options.winner).toBe("ABCD");
    } else {
      expect(gamestate.options.winner).toBe(undefined);
    }
  });
  it("makes a chat room", () => {
    let gamestate = joinGame();
    expect(Object.keys(gamestate.rooms).length).toBe(0);
    const key = "!";
    const title = "Chat room title";
    const timestamp = "2783467823";
    const createChat: CreateChatRoom = {
      type: "create_chat_room",
      title: encrypt(key, title),
      creator: "ABCD",
      key,
      timestamp,
    };
    gamestate = game(gamestate, createChat);
    const rooms = Object.keys(gamestate.rooms);
    expect(rooms.length).toBe(1);
    const roomId = rooms[0];
    const room = gamestate.rooms[roomId];
    expect(decrypt(key, room.title)).toBe(title);
    expect(decrypt(key, room.chats[timestamp].playerid)).toBe("ABCD");
    expect(decrypt(key, room.chats[timestamp].content)).toBe("@ABCD");
  });
});
