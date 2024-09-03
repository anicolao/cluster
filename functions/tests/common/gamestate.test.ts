import { describe, expect, it } from "vitest";
import {
  type GameOptions,
  type JoinGameAction,
  type LeaveGameAction,
  game,
  initialGameState,
} from "../../src/common/gamestate";

describe("gamestate tests", () => {
  function initGame() {
    const options = {} as GameOptions;
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
    expect(gamestate.players[uid]).toBe(undefined);
    return game(gamestate, joingame);
  }
  it("joining a game adds the player", () => {
    const uid = "ABCD";
    const alias = "anAlias";
    const avatar = "anAvatar";
    const gamestate = joinGame(uid, alias, avatar);
    expect(gamestate.players[uid].uid).toBe(uid);
    expect(gamestate.players[uid].alias).toBe(alias);
    expect(gamestate.players[uid].avatar).toBe(avatar);
  });

  it("leaving a game removes the player", () => {
    const uid = "ABCDEF";
    let gamestate = joinGame(uid);
    const leavegame: LeaveGameAction = {
      type: "leave_game",
      uid,
    };
    gamestate = game(gamestate, leavegame);
  });
});
