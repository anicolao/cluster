import type { GameAction } from "$common/gamestate";
import type { MetaGameAction } from "$common/metagame";
import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/scheduler";
import { onValueCreated } from "firebase-functions/v2/database";
import { executeGameAction, joinGame, leaveGame } from "./game";
import { createGame, deleteGame } from "./metagame";
import { processProfileAction } from "./profile";

admin.initializeApp();

exports.profileChanged = onValueCreated(
  "/users/{uid}/profile/{actionid}",
  (event) => {
    //console.log("*** Event");
    //console.log(event);
    //console.log("*** Value");
    //console.log(event.data.val());

    const path = `/profiles/${event.params.uid}`;
    const { type, alias, profile_image } = event.data.val();
    if (type === "set_alias" && alias !== undefined) {
      const action = { type, alias };
      return processProfileAction(path, action);
    }
    if (type === "set_avatar" && profile_image !== undefined) {
      const action = { type, profile_image };
      return processProfileAction(path, action);
    }
    return undefined;
  },
);

exports.gameAction = onValueCreated(
  "/games/{gameid}/{uid}/{actionid}",
  (event) => {
    console.log(event.params);
    const action = event.data.val() as GameAction;
    const gameid = event.params.gameid;
    if (action.type === "join_game") {
      return joinGame(gameid, action);
    }
    if (action.type === "leave_game") {
      return leaveGame(gameid, action);
    }
    return executeGameAction(gameid, action);
  },
);

exports.metaGameAction = onValueCreated(
  "/users/{uid}/games/{actionid}",
  (event) => {
    // console.log(event.params);
    const action = event.data.val() as MetaGameAction;
    if (action.type === "create_game") {
      const options = action.gameOptions;
      return createGame(options);
    }
    if (action.type === "delete_game") {
      const gameid = action.gameid;
      return deleteGame(gameid);
    }
    return undefined;
  },
);

exports.tick = onSchedule("every 15 minutes", async () => {
  console.log("empty tick function to be added");
});
