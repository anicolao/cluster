import * as admin from "firebase-admin";

import { onValueCreated } from "firebase-functions/v2/database";
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
  },
);
