import * as admin from "firebase-admin";
import { FieldValue } from 'firebase-admin/firestore';


export interface ProfileAction {
	type: string;
	alias: string;
}

export function processProfileAction(path: string, action: ProfileAction) {
	console.log(`module processProfileAction ${path}: ${action.type}`);

	const db = admin.firestore();
	const timestamp = FieldValue.serverTimestamp()
	const profile = { alias: action.alias, timestamp };
	return db.doc(path).set(profile);
}
