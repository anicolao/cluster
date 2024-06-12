import * as admin from "firebase-admin";

import { onValueCreated } from "firebase-functions/v2/database";

admin.initializeApp();

exports.profileChanged = onValueCreated(
  "/users/{uid}/profile/{actionid}",
  (event) => {
    console.log("*** Event");
    console.log(event);
    console.log("*** Value");
    console.log(event.data.val());
  },
);
