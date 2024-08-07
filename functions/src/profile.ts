import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { ProfileAction } from "$common/profiles";

export interface Profile {
  alias?: string;
  profile_image?: string;
  timestamp: FieldValue;
}

export async function processProfileAction(
  path: string,
  action: ProfileAction,
) {
  console.log(`module processProfileAction ${path}: ${action.type}`);

  const db = admin.firestore();
  const timestamp = FieldValue.serverTimestamp();
  const profile: Profile = { timestamp };
  if (action.alias) {
    profile.alias = action.alias;
  }
  if (action.profile_image) {
    profile.profile_image = action.profile_image;
  }
  const profileSnapshot = await db.doc(path).get();
  if (profileSnapshot.exists) {
    return db.doc(path).update(profile);
  }
  return db.doc(path).set(profile);
}
