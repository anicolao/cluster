import type { SignedInUser } from "@ourway/svelte-firebase-auth";
import { createAction, createReducer } from "@reduxjs/toolkit";

export interface UserState {
  users: { [k: string]: SignedInUser };
}

export const login = createAction<SignedInUser>("login");
export const logout = createAction<string>("logout");

export const initialState: UserState = {
  users: {},
};

export const users = createReducer(initialState, (r) => {
  r.addCase(login, (state, action) => {
    state.users[action.payload.uid] = action.payload;
  });
  r.addCase(logout, (state, action) => {
    delete state.users[action.payload];
  });
});
